// ██╗███╗   ███╗██████╗  ██████╗ ██████╗ ████████╗
// ██║████╗ ████║██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝
// ██║██╔████╔██║██████╔╝██║   ██║██████╔╝   ██║   
// ██║██║╚██╔╝██║██╔═══╝ ██║   ██║██╔══██╗   ██║   
// ██║██║ ╚═╝ ██║██║     ╚██████╔╝██║  ██║   ██║   
// ╚═╝╚═╝     ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   

import axios from 'axios';
import * as fs from 'node:fs';

import { Telegraf, session } from "telegraf"; // Библитека Телеграма.

import { FACTORY_ADDRESS, INIT_CODE_HASH } from '@uniswap/v2-sdk'
import { pack, keccak256 } from '@ethersproject/solidity'
import { getCreate2Address } from '@ethersproject/address'

import { checkSourceCodeVerified, getHolders } from './source/library.js' // Импортирование больших запросов из requests.js.
import { infura_request, get_contract_address_request } from './source/requests.js' // Импортирование больших запросов из requests.js.
import { main_message, source_code_verify_message, token_launching_message, lock_burn_liqudity_message } from './source/messages.js' // Импортирование больших запросов из requests.js.

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

const chatId = -1002057713225 // GROUP: -1002057713225 | DM: 989966856
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
const txnHashes = []

while (true) {
    try {
        const transactions = [] // Объявление главного массива со всеми подходязими по параметрам транзакциями.

        // 1. Метод отслеживания транзакций в блокчейне с форматом: FROM: CONTRACT_CREATOR, TO: NULL (без получателся), что означает создания нового контракта.
        const transactionsNullRecipient = (await axios.request(infura_request)).data.result.transactions
        transactionsNullRecipient.forEach(async transaction => {
            if (transaction.to == null && !(txnHashes.includes(transaction.hash))) {
                transactions.push({
                    contractAddress: (await axios.request(get_contract_address_request(transaction.hash))).data.result.contractAddress,
                    hash: transaction.hash,
                    to: transaction.from,
                    input: transaction.input 
                });
            } 
        })

        // 2. Метод отслеживания транзакций кошелька 0x0000...0000 с форматом: FROM: 0x0000...0000, TO: CONTRACT_CREATOR
        const transactionsNullSenderWithMethod = (await axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&address=0x0000000000000000000000000000000000000000&page=1&offset=20&startblock=0&endblock=999999999&sort=desc&apikey=26D6GVX57KX2MQKF8RHHSAFTPQC8ME7NH7`)).data.result
        const bannedTokens = ['0xae7ab96520de3a18e5e111b5eaab095312d7fe84', '0x99f5acc8ec2da2bc0771c32814eff52b712de1e5', '0x9c04560df8dff626555317ccc2c336b9c24fda41', '0xf951e335afb289353dc249e82926178eac7ded78', '0x5db5235b5c7e247488784986e58019fffd98fda4', '0xed7985385bf434f0815aa9c90450945aee02d733']
        for (const transaction of transactionsNullSenderWithMethod) {
            if (transaction.from == '0x0000000000000000000000000000000000000000') {
                if (!bannedTokens.includes(transaction.contractAddress)) {
                    try {
                        const response = (await axios.get(`https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${transaction.hash}&apikey=26D6GVX57KX2MQKF8RHHSAFTPQC8ME7NH7`)).data.result

                        const methods = ['0x60806040', '0x60a06040', '0x61016060']
                        if (methods.includes((response.input).slice(0,10))) transactions.push(transaction)
                    } catch (e) { }
                }
            }
        }

        // 3. Запуск функции проверки каждой полученной транзакции (то есть токена) многопоточно.
        for (const transaction of transactions) {
            if (!txnHashes.includes(transaction.hash)) checkToken(transaction);
            txnHashes.push(transaction.hash);
        }

        await wait(5000)

    } catch (e) {
        console.log(e)
    }
}



//  ██████╗██╗  ██╗███████╗ ██████╗██╗  ██╗██╗███╗   ██╗ ██████╗ 
// ██╔════╝██║  ██║██╔════╝██╔════╝██║ ██╔╝██║████╗  ██║██╔════╝ 
// ██║     ███████║█████╗  ██║     █████╔╝ ██║██╔██╗ ██║██║  ███╗
// ██║     ██╔══██║██╔══╝  ██║     ██╔═██╗ ██║██║╚██╗██║██║   ██║
// ╚██████╗██║  ██║███████╗╚██████╗██║  ██╗██║██║ ╚████║╚██████╔╝
//  ╚═════╝╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝ 
                                                              


async function checkToken(transaction) {
    try {
        let token = new Object();
        token.address = transaction.contractAddress
        token.creator = transaction.to

        // 1. Получение информации о токене с помощью Etherscan.
        const response = (await axios.get(`https://api.etherscan.io/api?module=token&action=tokeninfo&contractaddress=${token.address}&apikey=26D6GVX57KX2MQKF8RHHSAFTPQC8ME7NH7`)).data.result
        if (response == 'Token info not found') {
            const data = fs.readFileSync("data.txt", "utf8").split('\n')
            data.push(`❌ ${token.address} ${new Date(Date.now()).getHours()+2}:${new Date(Date.now()).getMinutes()}`)
            fs.writeFileSync("data.txt", `${data.join('\n')}`)

            return console.log('❌', token.address)
        }

        // Добавление новой информации в объект с токеном.
        token.name = response[0].tokenName // Имя токена.
        token.symbol = response[0].symbol // Символ токена.
        token.totalSupply = response[0].totalSupply // Общая эмиссия.
        token.decimals = response[0].divisor // Числа после запятой.
        
        if (!token.name || !token.symbol || !token.totalSupply || !token.decimals) return console.log('❌', token.address)

        // Логирование успешного запуска токена в data.txt.
        const data = fs.readFileSync("data.txt", "utf8").split('\n')
        data.push(`✅ DEPLOY ${token.name} ${new Date(Date.now()).getHours()+2}:${new Date(Date.now()).getMinutes()}`)
        fs.writeFileSync("data.txt", `${data.join('\n')}`)

        console.log('✅ DEPLOY', token.name) // Логирование успешного запуска токена в консоли.

        // Отправка сообщения о создании нового токена.
        const mainMessage = await bot.telegram.sendPhoto(chatId,
            { source: './source/images/itoken_new_token.png' },
            { caption: main_message(token) }
        )

            
        // 2. Проверка наличия открытого исходного кода контракта с помощью Etherscan.
        verifySourceCode(token)
        async function verifySourceCode(token) {
            try {
                for (let attempt = 0; attempt < 200; attempt++) {
                    token = await checkSourceCodeVerified(token) // Вызов функции проверки наличия исходного кода токена и извлечение оттуда всех ссылок на медиа токена.

                    if (token?.sourceCodeVerified) {
                        // Логирование публикации исходного кода токена в data.txt.
                        const data = fs.readFileSync("data.txt", "utf8").split('\n')
                        data.push(`🔍 VERIFIED ${token.name} ${new Date(Date.now()).getHours()+2}:${new Date(Date.now()).getMinutes()}`)
                        fs.writeFileSync("data.txt", `${data.join('\n')}`)

                        console.log('🔍 VERIFIED', token.name) // Логирование публикации исходного кода токена в консоли.

                        // Отправка сообщения о публикации исходного кода токена.
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
            } catch (e) { console.log(e); console.log('🛑 Возникла ошибка в блоке проверки наличия исходного кода токена.') }
        }

            

        // 3. Отслеживание запуска токена на Uniswap.
        parseLaunching(token)
        async function parseLaunching(token) {
            try {
                for (let attempts = 0; attempts < 1000; attempts++) {
                    // Получние всех возможных пар для токена с помощью Uniswap SDK API формата: [TOKEN, ETHER] и [ETHER, TOKEN].
                    const pair1 = getCreate2Address(FACTORY_ADDRESS, keccak256(['bytes'], [pack(['address', 'address'], [token.address, '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'])]), INIT_CODE_HASH) // [TOKEN, ETHER].
                    const pair2 = getCreate2Address(FACTORY_ADDRESS, keccak256(['bytes'], [pack(['address', 'address'], ['0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', token.address])]), INIT_CODE_HASH) // [ETHER, TOKEN].
                    
                    // Получние транзакций обеих пар с Etherscan API.
                    const pair1Txns = (await axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=${pair1}&page=1&offset=10&startblock=0&endblock=999999999&sort=desc&apikey=26D6GVX57KX2MQKF8RHHSAFTPQC8ME7NH7`)).data
                    const pair2Txns = (await axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=${pair2}&page=1&offset=10&startblock=0&endblock=999999999&sort=desc&apikey=26D6GVX57KX2MQKF8RHHSAFTPQC8ME7NH7`)).data
                    
                    // Если появилась хотя бы одна транзакция в адресе полученной ПАРЫ, выполнять условие.
                    if (pair1Txns.message == 'OK' || pair2Txns.message == 'OK') {
                        token.pair = pair1Txns.message == 'OK' ? pair1 : pair2; // Выявление валидной пары.

                        // Логирование запуска токена на Uniswap в data.txt.
                        const data = fs.readFileSync("data.txt", "utf8").split('\n')
                        data.push(`🦄 UNISWAP ${token.name} ${new Date(Date.now()).getHours()+2}:${new Date(Date.now()).getMinutes()}`)
                        fs.writeFileSync("data.txt", `${data.join('\n')}`)

                        console.log('🦄 UNISWAP', token.name) // Логирование публикации исходного кода токена в консоли.

                        // Вызов функции отслеживания залока/сжигания ликвидности .
                        parseLpLocking(token)

                        // Возврат функции и отправка сообщения о запуске токена на Uniswap.
                        return await bot.telegram.sendPhoto(chatId,
                            { source: './source/images/itoken_launching.png'},
                            { caption: token_launching_message(token) },
                            { reply_to_message_id: mainMessage.message_id },
                            { disable_web_page_preview: true }
                        )
                    }
            
                    await wait(5000)
                }
            } catch (e) { console.log(e); console.log('🛑 Возникла ошибка в блоке отслеживания запуска токена на Uniswap.') }
        }



        // 4. Отслеживание блокировки или сжигания ликвидности.
        async function parseLpLocking(token) {
            try {
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

                    token.lpLocker = lpLocker // Присваивание новой информации в объект с токеном.

                    // Логирование блокировки или сжигания ликвидности пары токена в data.txt.
                    const data = fs.readFileSync("data.txt", "utf8").split('\n')
                    data.push(`⚡️ LIQUIDITY ${token.name} (${token.lpLocker}) ${new Date(Date.now()).getHours()+2}:${new Date(Date.now()).getMinutes()}`)
                    fs.writeFileSync("data.txt", `${data.join('\n')}`)

                    console.log('⚡️ LIQUIDITY', token.name) // Логирование блокировки или сжигания ликвидности пары токена в консоль.

                    // Возврат функции и отправка сообщения о блокировке или сжигании ликвидности пары токена.
                    return await bot.telegram.sendPhoto(chatId, 
                        { source: lpLocker[0] == 'dead' ? './source/images/itoken_lp_burned.png' : './source/images/itoken_lp_locked.png'},
                        { caption: lock_burn_liqudity_message(token) },
                        { reply_to_message_id: mainMessage.message_id },
                        { disable_web_page_preview: true }
                    )
                }
            } catch (e) { console.log(e); console.log('🛑 Возникла ошибка в блоке отслеживания блокировки или сжигания ликвидности токена.') }
        }
    } catch (e) { 
        console.log(e); console.log('🛑 Возникла ошибка в главной функции проверки токена (транзакции).') 
    }
}