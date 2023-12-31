import { fmt, bold, code, link } from 'telegraf/format';

export function main_message(token, transaction) { return fmt`
💡 ${bold`Contract deployed`}

${bold`${token.name} (${token.symbol})`}
• Address: ${code`${token.address}`}
• Creator: ${code`${transaction.from}`}

Total Supply: ${bold`${Math.round(token.totalSupply / 10**token.decimals).toLocaleString('de')}`} (+ ${token.decimals} dec)
`}



export function source_code_verify_message(token) { 
const urlEtherScanCode = `https://etherscan.io/token/${token.address}#code`;

return fmt`
${bold`🔎  Source code verified`}

${bold`${token.name} (${token.symbol})`}
• Address: ${code`${token.address}`}

${link('Etherscan', urlEtherScanCode)} ${token?.website ? '• ' : ''}${token?.website ? link('Website', token.website) : ''}${token?.telegram ? ' • ' : ''}${token?.telegram ? link('Telegram', token.telegram) : ''}${token?.twitter ? ' • ' : ''}${token?.twitter ? link('Twitter', token.twitter) : ''}
`}



export function token_launching_message(token) {
const urlEtherScanCode = `https://etherscan.io/token/${token.address}#code`;

return fmt`
${bold`🚀 Launching`}

${bold`${token.name} (${token.symbol})`}
• Address: ${code`${token.address}`}
• Pair: ${code`${token.pair}`}

${link('Etherscan', urlEtherScanCode)}
`}



export function lock_burn_liqudity_message(token) {
const urlEtherScanCode = `https://etherscan.io/token/${token.address}#code`;
    
return fmt`
${bold`${token.lpLocker[0] == 'dead' ? '🔥 Liquidity Burned' : '🔒 Liquidity Locked'}`}
    
${bold`${token.name} (${token.symbol})`}
• Address: ${code`${token.address}`}
• Pair: ${code`${token.pair}`}
${token.lpLocker[0] != 'dead' ? `• ${token.lpLocker[0]} - ${token.lpLocker[1]}\n` : ''}
${link('Etherscan', urlEtherScanCode)}
`}