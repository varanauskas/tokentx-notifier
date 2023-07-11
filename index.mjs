#!/usr/bin/env node

import { readFile, appendFile } from "fs/promises";
import { existsSync } from "fs";
import pkg from "./package.json" assert { type: "json" };
import { getTokenTx } from "./lib/etherscan.mjs";
import { deleteMessage, editMessageText, sendMessage } from "./lib/telegram.mjs";
import { formatAccountUrl, formatEtherscan, formatStatus, formatNewTxs, formatError } from "./lib/messages.mjs";
import { readConfig } from "./lib/config.mjs";
import { sleep } from "./lib/utils.mjs";
import { statusMessage } from "./lib/status.mjs";

const {
    telegramToken,
    chatId,
    watch = [],
    etherscanSleepMs = 5000, // 5 seconds
} = await readConfig();

const TXS_PER_MESSAGE = 16;

const status = statusMessage(telegramToken, chatId);

console.log(`${pkg.name} (v${pkg.version}) is listening for new transactions and sending messages to ${chatId}`);

while (true) {
    // Pipeline to get new txs
    const newTxs = await Promise.all(Object.entries(watch).map(async ([etherscan, { apiKey, accounts }]) => {
        const ignoreFile = `${etherscan}.ignore.txt`;
        const ignoreFileExists = existsSync(ignoreFile);
        const ignoreHashes = ignoreFileExists ? (await readFile(ignoreFile, "ascii")).split("\n").map(line => line.trim()) : [];

        const txs = [];

        for (const account of accounts) {
            try {
                const result = await getTokenTx(etherscan, {
                    apiKey,
                    offset: ignoreFileExists ? "100" : "10000",
                    ...account
                });

                const newTxs = result.filter(({ hash }) => !ignoreHashes.includes(hash.toLowerCase()));

                console.log(`Got ${newTxs.length} new transactions for ${formatAccountUrl(etherscan, account)}`);

                txs.push(...newTxs);
            } catch (error) {
                console.error("Watch error", error);
                sendMessage(telegramToken, chatId, formatError(etherscan)).catch(error => console.log(`Cannot send error message ${error}`));
            }

            await sleep(etherscanSleepMs);
        }

        return { etherscan, txs, ignoreFile, ignoreFileExists };
    }));

    for (const { etherscan, txs, ignoreFile, ignoreFileExists } of newTxs) {
        if (txs.length === 0) continue;
        if (ignoreFileExists) {
            for (let page = 0; page < txs.length / TXS_PER_MESSAGE; page++) {
                const messageTxs = txs.slice(page * TXS_PER_MESSAGE, (page + 1) * TXS_PER_MESSAGE);
                await sendMessage(telegramToken, chatId, formatNewTxs(messageTxs, etherscan));
            }
        }

        await appendFile(ignoreFile, txs.map(({ hash }) => hash.toLowerCase()).join('\n') + '\n', "ascii");
    }

    status.update(watch);
}
