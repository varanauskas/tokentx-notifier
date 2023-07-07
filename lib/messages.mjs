function formatValue({ value, tokenSymbol, tokenDecimal }) {
    const decimalPlaces = parseInt(tokenDecimal);
    const padded = value.padStart(decimalPlaces, "0");
    return `${padded.substring(0, padded.length - decimalPlaces)}\\.${padded.substring(padded.length - decimalPlaces)} ${tokenSymbol}`;
}

export const formatEtherscan = (etherscan) => `*${etherscan.split('.')[0]}*`;

const formatTx = (tx, etherscan) => `*[${tx.hash}](https://${etherscan}/tx/${tx.hash})*
*From:* [${tx.from}](https://${etherscan}/address/${tx.from})
*To:* [${tx.to}](https://${etherscan}/address/${tx.to})
*Amount:* ${formatValue(tx)}`;

export const formatAccountUrl = (etherscan, { contractAddress, address }) => `https://${etherscan}/token/${contractAddress}?a=${address}`;

export const formatNewTxs = (newTxs, etherscan) => `🚨 New transactions in ${formatEtherscan(etherscan)}:

${newTxs.map(tx => formatTx(tx, etherscan)).join('\n\n')}`;

export const formatHeartbeat = (watch) => `❤️ Heartbeat, the bot is listening for new transactions

${Object.entries(watch).map(([etherscan, { accounts }]) => `${formatEtherscan(etherscan)}:
${accounts.map((account) => `[${account.address}](${formatAccountUrl(etherscan, account)})`).join('\n')}`).join('\n')}`;