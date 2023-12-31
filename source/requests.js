// 1. Получение всех транзакций в последнем блоке блокчейна.
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


export { infura_request }