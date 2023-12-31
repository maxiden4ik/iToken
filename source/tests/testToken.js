import axios from 'axios'
// const token = '0xCe1b1Ee7a0A4836e88917Cafa2b0b6eFE87C61f5'
// const response = (await axios.get(`https://api.etherscan.io/api?module=token&action=tokeninfo&contractaddress=${token}&apikey=26D6GVX57KX2MQKF8RHHSAFTPQC8ME7NH7`)).data.result
//     console.log( {
//         name: response[0].tokenName,
//         symbol: response[0].symbol,
//         totalSupply: response[0].totalSupply,
//         decimals: response[0].divisor,
//     })

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))


import { FACTORY_ADDRESS, INIT_CODE_HASH } from '@uniswap/v2-sdk'
import { pack, keccak256 } from '@ethersproject/solidity'
import { getCreate2Address } from '@ethersproject/address'

const address = '0xb69c064ab19e27ac2153a8c5f98faa76b5a2be18'

parseTokenLaunching(address)

async function parseTokenLaunching(address) {
    for (let attempts = 0; attempts < 1000; attempts++) {
        const pair1 = getCreate2Address(FACTORY_ADDRESS, keccak256(['bytes'], [pack(['address', 'address'], [address, '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'])]), INIT_CODE_HASH)
        const pair2 = getCreate2Address(FACTORY_ADDRESS, keccak256(['bytes'], [pack(['address', 'address'], ['0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', address])]), INIT_CODE_HASH)

        const pair1Txns = (await axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=${pair1}&page=1&offset=10&startblock=0&endblock=999999999&sort=desc&apikey=26D6GVX57KX2MQKF8RHHSAFTPQC8ME7NH7`)).data
        const pair2Txns = (await axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=${pair2}&page=1&offset=10&startblock=0&endblock=999999999&sort=desc&apikey=26D6GVX57KX2MQKF8RHHSAFTPQC8ME7NH7`)).data
        
        if (pair1Txns.message == 'OK') {
            const txns = pair1Txns.result
            const date = new Date(txns[txns.length-1].timeStamp * 1000)
            console.log(`${date.getHours()+2}:${date.getMinutes()}`)
            console.log(pair1);
            return pair1
        };

        if (pair2Txns.message == 'OK') {
            const txns = pair2Txns.result
            const date = new Date(txns[txns.length-1].timeStamp * 1000)
            console.log(`${date.getHours()+2}:${date.getMinutes()}`)
            console.log(pair2);
            return pair2
        };

        await wait(1000)
    }
}