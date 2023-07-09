#!/usr/bin/env node

import { readFile, appendFile } from "fs/promises";
import { existsSync } from "fs";
import pkg from "./package.json" assert { type: "json" };
import { getTokenTx } from "./lib/etherscan.mjs";
import { deleteMessage, editMessageText, sendMessage } from "./lib/telegram.mjs";
import { formatAccountUrl, formatEtherscan, formatStatus, formatNewTx, formatError } from "./lib/messages.mjs";
import { readConfig } from "./lib/config.mjs";
import { sleep } from "./lib/utils.mjs";
import { statusMessage } from "./lib/status.mjs";

const {
    telegramToken,
    chatId,
    watch = [],
    sleepMs = 5000, // 5 seconds
} = await readConfig();

const status = statusMessage(telegramToken, chatId);

console.log(`${pkg.name} (v${pkg.version}) is listening for new transactions and sending messages to ${chatId}`);

while (true) {
    await Promise.all(Object.entries(watch).map(async ([etherscan, { apiKey, accounts }]) => {
        const ignoreFile = `${etherscan}.ignore.txt`;
        const ignoreFileExists = existsSync(ignoreFile);

        for (const account of accounts) {
            try {
                const result = await getTokenTx(etherscan, { apiKey, ...account });
    
                const ignoreHashes = ignoreFileExists ? (await readFile(ignoreFile, "ascii")).split("\n").map(line => line.trim()) : [];
    
                const newTxs = result.filter(({ hash }) => !ignoreHashes.includes(hash.toLowerCase()));

                console.log(`Got ${newTxs.length} new transactions for ${formatAccountUrl(etherscan, account)}`);
    
                if (newTxs.length > 0) {
                    if (ignoreFileExists) {
                        for (const tx of newTxs) {
                            await sendMessage(telegramToken, chatId, formatNewTx(tx, etherscan));
                            await sleep(500);
                        }
                    }
                    await appendFile(ignoreFile, newTxs.map(({ hash }) => hash.toLowerCase()).join('\n') + '\n', "ascii");
                }
            } catch (error) {
                console.error("Watch error", error);
                sendMessage(telegramToken, chatId, formatError(etherscan)).catch(error => console`Cannot send error message ${error}`);
            }
    
            await sleep(sleepMs);
        }
    }));

    status.update(watch);
}
