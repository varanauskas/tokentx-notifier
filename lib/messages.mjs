function formatValue({ value, tokenDecimal }) {
    const decimalPlaces = parseInt(tokenDecimal);
    const padded = value.padStart(decimalPlaces, "0");
    const seperator = padded.length - decimalPlaces;
    const integerPart = padded.substring(0, seperator);
    const decimalPart = padded.substring(seperator).replace(/0+$/, '');
    if (decimalPart.length === 0) return integerPart;
    return `${integerPart}.${decimalPart}`;
}

const escape = text => text.replace(/([|{\[\]*_~}+)(#>!=\-.])/gm, '\\$1');

export const formatEtherscan = (etherscan) => `*${etherscan.split('.')[0]}*`;

const formatTx = (tx, etherscan) => `*[${tx.hash}](https://${etherscan}/tx/${tx.hash})*
*From:* [${tx.from}](https://${etherscan}/address/${tx.from})
*To:* [${tx.to}](https://${etherscan}/address/${tx.to})
*Amount:* ${escape(formatValue(tx))} ${tx.tokenSymbol}`;

export const formatAccountUrl = (etherscan, { contractAddress, address }) => `https://${etherscan}/token/${contractAddress}?a=${address}`;

export const formatNewTx = (tx, etherscan) => `🚨 New transaction in ${formatEtherscan(etherscan)}:

${formatTx(tx, etherscan)}`;

export const formatStatus = (watch) => `⏰ The bot is listening for new token transactions on these addresses:

${Object.entries(watch).map(([etherscan, { accounts }]) => `${formatEtherscan(etherscan)}:
${accounts.map((account) => `[${account.address}](${formatAccountUrl(etherscan, account)})`).join('\n')}`).join('\n')}

Last check at *${escape(new Date().toString())}*`;

export const formatError = (etherscan) => `⚠️ Error occured when checking ${formatEtherscan(etherscan)}`;