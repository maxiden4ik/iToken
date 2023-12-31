import axios from 'axios'

const address = '0xb69c064ab19e27ac2153a8c5f98faa76b5a2be18'
const token = '0x01DEd036C338b77439224365F93cD67c13E7816B'

const response = (await axios.get(`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=999999999&page=1&offset=1000&sort=desc&apikey=26D6GVX57KX2MQKF8RHHSAFTPQC8ME7NH7`)).data.result
//|| (transaction.to).toLowerCase() == token.toLowerCase()
const methods = ['0x01339c21', '0x07df7a0d', '0xc9567bf9']
for (const transaction of response) {
    if ((transaction.to).toLowerCase() == '0x7a250d5630b4cf539739df2c5dacb4c659f2488d' || methods.includes(transaction.input.slice(0, 10))) {
        const date = (new Date(transaction.timeStamp * 1000))
        if (new Date(Date.now()).getDay() == date.getDay()) {
            console.log(`${date.getHours()+2}:${date.getMinutes()}`)
        }
    }
}


// 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D