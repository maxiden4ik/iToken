import axios from 'axios';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
import { Telegraf, session } from "telegraf"; // Библитека Телеграма.
import { fmt, bold, code, link } from 'telegraf/format';

import { FACTORY_ADDRESS, INIT_CODE_HASH } from '@uniswap/v2-sdk'
import { pack, keccak256 } from '@ethersproject/solidity'
import { getCreate2Address } from '@ethersproject/address'

const chatId = -1002057713225
const token = '6747283089:AAF4GDLRpbyHnRpw2t92PG6iR8Oth5PGat8' // Токен для Телеграм бота.
const bot = new Telegraf(token); // Создание бота.

bot.use(session())
console.log('Бот запущен.')
// bot.telegram.sendMessage(989966856, 'start')
const txnHashs = []

while (true) {
    try {
    const transactions = (await axios.request({
        method: 'post',
        url: "https://mainnet.infura.io/v3/50994bfe9e0e40f7a74e2fbbc7d915c2",
        headers: {
            "Content-Type": "application/json",
        },
        data: {
            "jsonrpc":"2.0",
            "method":"eth_getBlockByNumber",
            "params":["latest", true],
            "id":1
        }
    })).data.result.transactions

    for (const transaction of transactions) {
        if (transaction.to == null) {
            if (!(txnHashs.includes(transaction.hash))) {
                txnHashs.push(transaction.hash)

                const contractAddress = (await axios.request({
                    method: 'post',
                    url: "https://mainnet.infura.io/v3/50994bfe9e0e40f7a74e2fbbc7d915c2",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    data: {
                        "jsonrpc":"2.0",
                        "method":"eth_getTransactionReceipt",
                        "params": [transaction.hash],
                        "id":1
                    }
                })).data.result.contractAddress
                
                async function getTokenInfo(contractAddress) {
                    for (let attempt = 0; attempt < 10; attempt++) {
                        const response = (await axios.get(`https://api.etherscan.io/api?module=token&action=tokeninfo&contractaddress=${contractAddress}&apikey=26D6GVX57KX2MQKF8RHHSAFTPQC8ME7NH7`)).data.result
                        if (response == 'Token info not found') {
                            await wait(1000)
                        } else {
                            return response[0]
                        } 
                    }
                    return false
                }

                const tokenInfo = await getTokenInfo(contractAddress)

                if (!tokenInfo.tokenName || !tokenInfo.symbol || !tokenInfo.totalSupply || !tokenInfo.divisor || !tokenInfo.totalSupply) break;

                const mainMesage = await bot.telegram.sendMessage(chatId, 
fmt`🐳 ${bold`Contract deployed`}

 ${bold`${tokenInfo.tokenName} (${tokenInfo.symbol})`}
 • Address: ${code`${contractAddress}`}
 • Creator: ${code`${transaction.from}`}

 Total Supply: ${bold`${Math.round(tokenInfo.totalSupply / 10**tokenInfo.divisor).toLocaleString('de')}`} (+ ${tokenInfo.divisor} decimals)
`)

                


                async function verifySourceCode(contractAddress, tokenInfo, mainMesage) {
                    for (let attempt = 0; attempt < 1800; attempt++) {
                        const sourceCode = await checkSourceCodeVerified(contractAddress)
                        if (sourceCode) {
                            const urlEtherScanCode = `https://etherscan.io/token/${token.address}#code`

                            return await bot.telegram.sendMessage(chatId, fmt`
${bold`📗 Source code verified`}

${bold`${tokenInfo.tokenName} (${tokenInfo.symbol})`}
• Address: ${code`${contractAddress}`}

${link('Etherscan', urlEtherScanCode)} ${sourceCode?.website ? link('Website', sourceCode.website) : ''}${sourceCode?.website ? ' ' : ''}${sourceCode?.telegram ? link('Telegram', sourceCode.telegram) : ''}${sourceCode?.telegram ? ' ' : ''}${sourceCode?.twitter ? link('Twitter', sourceCode.twitter) : sourceCode.twitter}`,
{ reply_to_message_id: mainMesage.message_id }
                            )
                        } else {
                            // console.log(sourceCode, tokenInfo.tokenName)
                            await wait(5000)
                        } 
                    }
                    return false
                }
                verifySourceCode(contractAddress, tokenInfo, mainMesage)



                async function parseLaunching(address) {
                    for (let attempt = 0; attempt < 150; attempt++) {
                    const pair1 = getCreate2Address(FACTORY_ADDRESS,keccak256(['bytes'], [pack(['address', 'address'], [address, '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'])]),INIT_CODE_HASH)
                    const pair2 = getCreate2Address(FACTORY_ADDRESS,keccak256(['bytes'], [pack(['address', 'address'], ['0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', address])]),INIT_CODE_HASH)
                    
                    function get_defined_request(pair) {
                        return {
                        method: 'post',
                        url: "https://graph.defined.fi/graphql",
                        data: { 
                            query: `{
                                getDetailedPairStats(
                                networkId: 1
                                pairAddress: "${pair}"
                                ) {
                                tokenOfInterest
                                pair {
                                    token0
                                    token1
                                    pooled {
                                    token0
                                    token1
                                    }
                                }
                                }
                            
                            }`
                        },
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "242df15f9343a6fada5bc34868e17bd4eb21c458"
                        }
                        }
                    }
                    
                    try {
                        const pair1Response = (await axios.request(get_defined_request(pair1)))?.data?.data?.getDetailedPairStats
                        await wait(500)
                        const pair2Response = (await axios.request(get_defined_request(pair2)))?.data?.data?.getDetailedPairStats
                    
                        if (pair1Response || pair2Response) {
                            const urlEtherScanCode = `https://etherscan.io/token/${address}#code`
                        
                            getLpLocker(pair1Response ? pair1 : pair2, tokenInfo.divisor)

                            console.log('⭐️ LAUNCHING', tokenInfo.tokenName)
                            return await bot.telegram.sendMessage(chatId, fmt`
${bold`⭐️ Launching`}

${bold`${tokenInfo.tokenName} (${tokenInfo.symbol})`}
• Address: ${code`${address}`}
• Pair: ${code`${pair1Response ? pair1 : pair2}`}

${link('Etherscan', urlEtherScanCode)}`,
                    { reply_to_message_id: mainMesage.message_id })



                        } else {
                            await wait(5000)
                        } 
                    } catch (e) {
                        console.log(e)
                    }
                    }
                    return false
                }

                parseLaunching(contractAddress)
  



                async function getLpLocker(pairAddress, decimals) {
                    console.log('checking this lp locked....')
                    try {
                        const totalSupply = (await axios.get(`https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=${pairAddress}&apikey=26D6GVX57KX2MQKF8RHHSAFTPQC8ME7NH7`)).data.result // Получение значения ликвидности самой пары, а не токена с Etherscan.
                        if (!totalSupply) return false // Если значение ликвидности пары не было получено, возвращать ошибку false.
                
                        const lpHolders = await getHolders(pairAddress, decimals) // Получние всех холдеров ликвидности пары.
                
                        if (lpHolders.length == 0) return false // Если холдеров не было обнаружено, возвращать ошибку false.
                        const lpLocker = [lpHolders[0][0], (lpHolders[0][1]) / (totalSupply / 10**decimals) * 100] // Получение топ-1 холдера и занесение его в отдельный массив.
                
                        // Проверка топ-1 холдера lpLocker на совпадение адресов кошельков с перечисленными операторами блокировки ликвидности.
                        if (lpLocker[0] == '0xe2fe530c047f2d85298b07d9333c05737f1435fb') lpLocker[0] = 'TrustSwap: Team Finance Lock'
                        if (lpLocker[0] == '0x663a5c229c09b049e36dcc11a9b0d4a8eb9db214') lpLocker[0] = 'UNCX Network'
                        if (lpLocker[0] == '0x000000000000000000000000000000000000dead') lpLocker[0] = 'dead'
                        if (lpLocker[0].startsWith('0x')) return false

                        return await bot.telegram.sendMessage(chatId, fmt`
${bold`🔥 Lp Locked`}

${bold`${tokenInfo.tokenName} (${tokenInfo.symbol})`}
• Address: ${code`${address}`}
• ${lpLocker[0]} - ${lpLocker}%

${link('Etherscan', urlEtherScanCode)}`,
                { reply_to_message_id: mainMesage.message_id })

                    } catch (e) {
                        console.log('📕 Возникла ошибка в блоке получения оператора ликвидности.')
                    }
                }




            }
        }
    }

    await wait(1000)
    } catch (e) {
        console.log(e)
    }
}




async function checkSourceCodeVerified(address) {
    try {
        const banned_resources = [
            'github', 'wikipedia', 'hardhat', 'ethereum.org',
            'zeppelin', 'readthedocs', 'consensys', 'metadrop',
            'theverge', 'medium'
        ]

        // Создание и обработка запроса
        const response = (await axios.get(`https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=I42WBTQDF5JSSWARWCNYFU2DUI1IFGQWD1`)).data.result[0]
        if (response.ABI == 'Contract source code not verified') return false // Возвращать false, если исходный код не был получен.
        const content = (response.SourceCode).split('\n') // Извлечение исходного кода токена.
    
        // Код может быть в виде обычного текста: function()..., а может и быть в виде объекта: "lang": "solidity", "content": function()...,
        // и здесь регестрируются оба случая, чтобы в случае чего не упускать исходного кода.
        const contentIndex = content.indexOf(content.find(element => element.includes('\"content\"'))) || '-1'; // Индекс "content" в коде в массиве ответа (2-ой случай). Изначально: -1.
    
        const text = (contentIndex == -1) ? content : content[contentIndex].split('\\n') // Извлечение исходного кода созданием массива для каждой отдельной строчки.
        const links = text.filter(element => element.includes('https://')).map(link => link.trim()); // Объявление массива для предполагающихся ссылок на ресурсы.
    
        const item = new Object; // Создание объекта для предполагающихся ссылок на ресурсы.
        for (const rawLink of links) {
            // Обработка raw-ссылки.
            let link = rawLink.slice(rawLink.indexOf('https://'))
            if (link.indexOf('\\') > 0) link = link.slice(0, link.indexOf('\\'))
            if (link.indexOf(' ') > 0) link = link.slice(0, (link.indexOf(' ')))
    
            // Извлечение ссылок.
            if (link.includes('t.me')) { item.telegram = link; continue; } // Извлечение ТГ-канала.
            if (link.includes('twitter.com') || link.includes('x.com') || link.includes('X.com')) { item.twitter = link; continue; } // Извлечение Твиттера.
            if (!banned_resources.some(element => link.includes(element))) item.website = link; // Извлечение сайта.
            
            if (Object.keys(item).length == 3) break; // Не проверять ссылки дальше, если объект со всеми ресурсами полностью собран.
        }
    
        // Возврат данных
        if (Object.keys(item).length == 0) return true // Если ссылок не было найдено, то просто вернуть true, ибо исходный код был получен, а соответственно и подтверждён
        return item // Если ссылки были найдены, вывести объект с ссылками, который будет равен true в Boolean, чтобы прошло подтверждение наличия исходного кода
    } catch (e) {
        console.log(e)
    }
}
