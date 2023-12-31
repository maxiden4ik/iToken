// ██╗███╗   ███╗██████╗  ██████╗ ██████╗ ████████╗
// ██║████╗ ████║██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝
// ██║██╔████╔██║██████╔╝██║   ██║██████╔╝   ██║   
// ██║██║╚██╔╝██║██╔═══╝ ██║   ██║██╔══██╗   ██║   
// ██║██║ ╚═╝ ██║██║     ╚██████╔╝██║  ██║   ██║   
// ╚═╝╚═╝     ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   

import axios from 'axios';

import { Telegraf, session } from "telegraf"; // Библитека Телеграма.
import { fmt, bold, code, link } from 'telegraf/format';

import { FACTORY_ADDRESS, INIT_CODE_HASH } from '@uniswap/v2-sdk'
import { pack, keccak256 } from '@ethersproject/solidity'
import { getCreate2Address } from '@ethersproject/address'

import { checkSourceCodeVerified, getHolders } from './source/library.js' // Импортирование больших запросов из requests.js.
import { infura_request, get_contract_address_request, get_defined_request } from './source/requests.js' // Импортирование больших запросов из requests.js.
import { main_message, source_code_verify_message, token_launching_message, lock_burn_liqudity_message } from './source/messages.js' // Импортирование больших запросов из requests.js.

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

const chatId = -1002057713225 // GROUP: -1002057713225 989966856
const token = '6747283089:AAF4GDLRpbyHnRpw2t92PG6iR8Oth5PGat8' // Токен для Телеграм бота.
const bot = new Telegraf(token); // Создание бота.

bot.use(session())


// ███╗   ███╗ █████╗ ██╗███╗   ██╗
// ████╗ ████║██╔══██╗██║████╗  ██║
// ██╔████╔██║███████║██║██╔██╗ ██║
// ██║╚██╔╝██║██╔══██║██║██║╚██╗██║
// ██║ ╚═╝ ██║██║  ██║██║██║ ╚████║
// ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝


console.log('Бот запущен.')
const txnHashs = []

while (true) {
    try {
        const transactions = (await axios.request(infura_request)).data.result.transactions
        for (const transaction of transactions) {
            if (transaction.to == null && !(txnHashs.includes(transaction.hash))) {
                txnHashs.push(transaction.hash)

                let token = new Object();
                token.address = (await axios.request(get_contract_address_request(transaction.hash))).data.result.contractAddress
                // 1. Получение информации о токене с помощью Etherscan.
                async function getTokenInfo(token) {
                    for (let attempt = 0; attempt < 600; attempt++) {
                        const response = (await axios.get(`https://api.etherscan.io/api?module=token&action=tokeninfo&contractaddress=${token.address}&apikey=26D6GVX57KX2MQKF8RHHSAFTPQC8ME7NH7`)).data.result
                        if (response == 'Token info not found') {
                            await wait(500)
                        } else {
                            return {
                                address: token.address,
                                name: response[0].tokenName,
                                symbol: response[0].symbol,
                                totalSupply: response[0].totalSupply,
                                decimals: response[0].divisor,
                            }
                        } 
                    }
                    return token
                }

                // Обработка полученных данных.
                token = await getTokenInfo(token)
                if (Object.keys(token).length < 5) continue;
                
                // Отправка сообщения о создании нового токена.
                const mainMessage = await bot.telegram.sendPhoto(chatId,
                    { source: './source/images/itoken_new_token.png' },
                    { caption: main_message(token, transaction) }
                )

                
                // 2. Проверка верификации исходного кода контракта с помощью Etherscan.
                verifySourceCode(token)
                async function verifySourceCode(token) {
                    for (let attempt = 0; attempt < 200; attempt++) {
                        token = await checkSourceCodeVerified(token)
                        if (token.sourceCodeVerified) {
                            return await bot.telegram.sendPhoto(chatId,
                                { source: './source/images/itoken_verify_code.png'},
                                { caption: source_code_verify_message(token) },
                                { reply_to_message_id: mainMessage.message_id },
                                { disable_web_page_preview: true }
                            )
                        } else {
                            await wait(5000)
                        } 
                    }
                    return false
                }

                

                // 3. Отслеживание запуска токена на Uniswap V2.
                parseLaunching(token)
                async function parseLaunching(token) {
                    try {

                    for (let attempt = 0; attempt < 1000; attempt++) {
                        const pair1 = getCreate2Address(FACTORY_ADDRESS, keccak256(['bytes'], [pack(['address', 'address'], [token.address, '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'])]), INIT_CODE_HASH)
                        const pair2 = getCreate2Address(FACTORY_ADDRESS, keccak256(['bytes'], [pack(['address', 'address'], ['0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', token.address])]), INIT_CODE_HASH)
                    
                        const pair1Response = (await axios.request(get_defined_request(pair1)))?.data?.data?.getDetailedPairStats
                        const pair2Response = (await axios.request(get_defined_request(pair2)))?.data?.data?.getDetailedPairStats
                    
                        if (pair1Response || pair2Response) {
                            token.pair = pair1Response ? pair1 : pair2
                            parseLpLocking(token)

                            return await bot.telegram.sendPhoto(chatId,
                                { source: './source/images/itoken_launching.png'},
                                { caption: token_launching_message(token) },
                                { reply_to_message_id: mainMessage.message_id },
                                { disable_web_page_preview: true }
                            )
                        } else {
                            await wait(5000)
                        } 
                    }
                    return false

                    } catch (e) {
                        console.log(e)
                    }
                }

  

                // 4. Отслеживание блокировки или сжигания ликвидности.
                async function parseLpLocking(token) {
                    for (let attempt = 0; attempt < 200; attempt++) {
                        await wait(5000)
                        const totalSupply = (await axios.get(`https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=${token.pair}&apikey=26D6GVX57KX2MQKF8RHHSAFTPQC8ME7NH7`)).data.result // Получение значения ликвидности самой пары, а не токена с Etherscan.
                        if (!totalSupply) continue // Если значение ликвидности пары не было получено, возвращать ошибку false.
                
                        const lpHolders = await getHolders(token.pair, token.decimals) // Получние всех холдеров ликвидности пары.
                
                        if (lpHolders.length == 0) return false // Если холдеров не было обнаружено, возвращать ошибку false.
                        const lpLocker = [lpHolders[0][0], (lpHolders[0][1]) / (totalSupply / 10**token.decimals) * 100] // Получение топ-1 холдера и занесение его в отдельный массив.
                        
                        // Проверка топ-1 холдера lpLocker на совпадение адресов кошельков с перечисленными операторами блокировки ликвидности.
                        if (lpLocker[0] == '0xe2fe530c047f2d85298b07d9333c05737f1435fb') lpLocker[0] = 'Team Finance'
                        if (lpLocker[0] == '0x663a5c229c09b049e36dcc11a9b0d4a8eb9db214') lpLocker[0] = 'UNCX Network'
                        if (lpLocker[0] == '0x000000000000000000000000000000000000dead') lpLocker[0] = 'dead'
                        if (lpLocker[0].startsWith('0x')) continue;

                        token.lpLocker = lpLocker

                        return await bot.telegram.sendPhoto(chatId, 
                            { source: lpLocker[0] == 'dead' ? './source/images/itoken_lp_burned.png' : './source/images/itoken_lp_locked.png'},
                            { caption: lock_burn_liqudity_message(token) },
                            { reply_to_message_id: mainMessage.message_id },
                            { disable_web_page_preview: true }
                        )
                    }
                }

        }
    }

    await wait(2000)
    } catch (e) {
        console.log(e)
    }
}