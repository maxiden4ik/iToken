import { Web3 } from "web3";
import axios from 'axios';

async function main(){
  const web3 = new Web3("wss://mainnet.infura.io/ws/v3/50994bfe9e0e40f7a74e2fbbc7d915c2");

  let options = {
    topics: [web3.utils.sha3("Transfer(address,address,uint256)")],
  };

  const abi = [
    {
      constant: true,
      inputs: [],
      name: "symbol",
      outputs: [
        {
          name: "",
          type: "string",
        },
      ],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "decimals",
      outputs: [
        {
          name: "",
          type: "uint8",
        },
      ],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
  ];

  let subscription = await web3.eth.subscribe("logs", options);

  async function collectData(contract) {
    try {
      var decimals = await contract.methods.decimals().call();
    }
    catch {
      decimals = 18n;
    }
    try {
      var symbol = await contract.methods.symbol().call();
    }
    catch {
      symbol = '???';
    }
    return { decimals, symbol };
  }

  subscription.on("data", (event) => {
    if (event.topics.length == 3) {
      let transaction = web3.eth.abi.decodeLog(
        [
          {
            type: "address",
            name: "from",
            indexed: true,
          },
          {
            type: "address",
            name: "to",
            indexed: true,
          },
          {
            type: "uint256",
            name: "value",
            indexed: false,
          },
        ],
        event.data,
        [event.topics[0], event.topics[1], event.topics[2]],
      );

      const contract = new web3.eth.Contract(abi, event.address);
      collectData(contract).then(async (contractData) => {
        var unit = Object.keys(web3.utils.ethUnitMap).find(
          (key) => web3.utils.ethUnitMap[key] == (BigInt(10) ** contractData.decimals)
        );
        if (!unit) {
          // Simplification for contracts that use "non-standard" units, e.g. REDDIT contract returns decimals==8
          unit = "wei"
        }
        // This is logging each transfer event found:
        const value = web3.utils.fromWei(transaction.value, unit);
        if (transaction.from == '0x0000000000000000000000000000000000000000') {
            // const response = ( await axios.request({
            //     method: 'post',
            //     url: "https://mainnet.infura.io/v3/50994bfe9e0e40f7a74e2fbbc7d915c2",
            //     headers: {
            //         "Content-Type": "application/json",
            //     },
            //     data: {
            //         "jsonrpc":"2.0",
            //         "method":"eth_getTransactionReceipt",
            //         "params": [event.transactionHash],
            //         "id":1
            //     }
            // })).data.result
            
            // if (!response.to) {
              // console.log(response)
                // console.log(event)
            // }
            const banned = ['TITANX', 'XEN', 'STONE', 'swETH', 'wstETH', 'PRISMAETH-f', 'stETH', 'esLBR', 'eETH', 'cvxPrisma']
            if (!banned.includes(contractData.symbol)) {
              console.log(event)
              console.log(
                `Transfer of ${value+' '.repeat(Math.max(0,30-value.length))} ${
                contractData.symbol+' '.repeat(Math.max(0,10-contractData.symbol.length))
              } from ${transaction.from} to ${transaction.to}`,
            )
            }
        }
      });
    }
  });

  subscription.on("error", (err) => {
    throw err;
  });
  subscription.on("connected", (nr) =>
    console.log("Subscription on ERC-20 started with ID %s", nr),
  );

}
main();



{
  removed: false,
  logIndex: 289n,
  transactionIndex: 127n,
  transactionHash: '0x1e3a44d2446bf6aa0b9dc9b8211a7a9a4f391bd28413da9856fd877dca64f58a',
  blockHash: '0xfaa3ed3eef55936eb5e34c6171225806393ce59678b9e1fe6313009a389a417e',
  blockNumber: 18890950n,
  address: '0xdabaefc04b8f7ed287c6e46be785f8d03512d26d',
  data: '0x00000000000000000000000000000000000000084d01aa032c20e60a89440000',
  topics: [
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '0x0000000000000000000000003ad024c46cfab10aad4097482df0a03179aca0f4'
  ]
}
Transfer of 657657657657                   Uterus     from 0x0000000000000000000000000000000000000000 to 0x3AD024c46CfaB10Aad4097482df0a03179ACa0f4







{
  removed: false,
  logIndex: 125n,
  transactionIndex: 94n,
  transactionHash: '0x9eee352bc900a9a833075a2b471a38e038bba24ed5a261f465a70741f63c250f',
  blockHash: '0x954151fcd35aa7fec58f0d9e2012320bdbe7fc9771c3b20bb51b03e8178579a4',
  blockNumber: 18890946n,
  address: '0x49aa3fd69569c985e782d6831b7772b5bea0a330',
  data: '0x0000000000000000000000000000000000000000000000008ac7230489e80000',
  topics: [
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '0x00000000000000000000000004c9c0cbf9b639036b0bfbf9f20037fad1106c6a'
  ]
}
Transfer of 10000000000                    π          from 0x0000000000000000000000000000000000000000 to 0x04C9c0CBF9b639036B0bFbf9F20037fAd1106C6A
