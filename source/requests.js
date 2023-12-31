// 1. Получние всех транзакций в последнем блоке блокчейна.
const infura_request = {
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
}


// 2. Получние адреса контракта с помощью Etherscan.
export function get_contract_address_request(hash) {
    return {
        method: 'post',
        url: "https://mainnet.infura.io/v3/50994bfe9e0e40f7a74e2fbbc7d915c2",
        headers: {
            "Content-Type": "application/json",
        },
        data: {
            "jsonrpc":"2.0",
            "method":"eth_getTransactionReceipt",
            "params": [hash],
            "id":1
        }
    }
}


export function get_defined_request(pair) {
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



export { infura_request }