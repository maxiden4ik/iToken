import { Web3 } from "web3";
import axios from 'axios';

async function main(){
  const web3 = new Web3("wss://mainnet.infura.io/ws/v3/50994bfe9e0e40f7a74e2fbbc7d915c2");

  let options = {
    topics: [web3.utils.sha3("approve(address,uint256)")],
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
      console.log(event)
      
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
        console.log(event)
        console.log(transaction)
        console.log(
          `Transfer of ${value+' '.repeat(Math.max(0,30-value.length))} ${
          contractData.symbol+' '.repeat(Math.max(0,10-contractData.symbol.length))
        } from ${transaction.from} to ${transaction.to}`,
      )
        // This is logging each transfer event found:
        const value = web3.utils.fromWei(transaction.value, unit);
        if (transaction.from == '0x00001000000000000000000000000000000000000') {
            const response = ( await axios.request({
                method: 'post',
                url: "https://mainnet.infura.io/v3/50994bfe9e0e40f7a74e2fbbc7d915c2",
                headers: {
                    "Content-Type": "application/json",
                },
                data: {
                    "jsonrpc":"2.0",
                    "method":"eth_getTransactionReceipt",
                    "params": [event.transactionHash],
                    "id":1
                }
            })).data.result

            // if (!response.to) {
                console.log(response)
                // console.log(event)
            // }

            console.log(
                `Transfer of ${value+' '.repeat(Math.max(0,30-value.length))} ${
                contractData.symbol+' '.repeat(Math.max(0,10-contractData.symbol.length))
              } from ${transaction.from} to ${transaction.to}`,
            )
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