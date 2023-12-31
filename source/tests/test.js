import axios from 'axios';

const transactions = (await axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&address=0x0000000000000000000000000000000000000000&page=1&offset=3000&startblock=0&endblock=999999999&sort=desc&apikey=26D6GVX57KX2MQKF8RHHSAFTPQC8ME7NH7`)).data.result
const bannedTokens = ['0xae7ab96520de3a18e5e111b5eaab095312d7fe84', '0x99f5acc8ec2da2bc0771c32814eff52b712de1e5', '0x9c04560df8dff626555317ccc2c336b9c24fda41', '0xf951e335afb289353dc249e82926178eac7ded78', '0x5db5235b5c7e247488784986e58019fffd98fda4', '0xed7985385bf434f0815aa9c90450945aee02d733']

for (const transaction of transactions) {
    if (transaction.from == '0x0000000000000000000000000000000000000000') {
        if (!bannedTokens.includes(transaction.contractAddress)) {
            const response = (await axios.request({
                method: 'post',
                url: "https://mainnet.infura.io/v3/50994bfe9e0e40f7a74e2fbbc7d915c2",
                headers: {
                    "Content-Type": "application/json",
                },
                data: {
                    "jsonrpc":"2.0",
                    "method":"eth_getTransactionByHash",
                    "params": [transaction.hash],
                    "id":1
                }
            })).data.result
            
            if ((response.input).slice(0,10) == '0x60806040') {
                console.log(transaction.contractAddress)
            }
        }
    }
}
// console.log(transactions)
// for (const transaction of transactions) {
    // console.log(transaction.from)
    // if (transaction.from == '0x0000000000000000000000000000000000000000') {
            // console.log(transaction)
    // }   
    // if (transaction.methodId == '0x60806040') {
        // console.log(transaction)
        // hashes.push(transaction.hash)
    // }
    // console.log(transaction)
    // console.log(transaction.from, transaction.to, new Date(transaction.timeStamp*1000))
// }