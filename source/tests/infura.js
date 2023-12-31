import WebSocket from 'ws';
import axios from 'axios'
// const API_KEY = '50994bfe9e0e40f7a74e2fbbc7d915c2';
// const ws = new WebSocket('wss://mainnet.infura.io/ws/v3/50994bfe9e0e40f7a74e2fbbc7d915c2');

const txn = '0x5872d77ed303ae5926ec262f002714332535b0c12b75f981757f2417893ce4ba'
const response = (await axios.get(`https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${txn}&apikey=26D6GVX57KX2MQKF8RHHSAFTPQC8ME7NH7`)).data.result
console.log(response)
const methods = ['0x60806040', '0x60a06040', '0x61016060']
if (methods.includes((response.input).slice(0,10))) console.log((response.input).slice(0,10))
// ws.on('open', function open() {
//     ws.send(JSON.stringify({
//       "jsonrpc": "2.0",
//       "id": 1,
//       "method": "eth_subscribe",
//       "params": ["logs", {
//         "address": "0x0000000000000000000000000000000000000000"
//       }]
//     }));
//   });
  
//   ws.on('message', function incoming(data) {
//     console.log(data.toString());
//   });

// ws.on('open', function open() {
//   ws.send(JSON.stringify({
//     "jsonrpc": "2.0",
//     "id": 1,
//     "method": "eth_subscribe",
//     "params": ["logs", {address:"0x0000000000000000000000000000000000000000"}]
//   }));
// });

// ws.on('message', function incoming(data) {
//   console.log(String(data));
// }); 


const response1 = ( await axios.request({
    method: 'post',
    url: "https://mainnet.infura.io/v3/50994bfe9e0e40f7a74e2fbbc7d915c2",
    headers: {
        "Content-Type": "application/json",
    },
    data: {
        "jsonrpc":"2.0",
        "method":"eth_getTransactionReceipt",
        "params": ['0x5872d77ed303ae5926ec262f002714332535b0c12b75f981757f2417893ce4ba'],
        "id":1
    }
})).data.result
console.log(response1)