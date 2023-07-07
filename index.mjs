#!/usr/bin/env node

import { readFile, appendFile } from "fs/promises";
import { existsSync } from "fs";
import pkg from "./package.json" assert { type: "json" };
import { getTokenTx } from "./lib/etherscan.mjs";
import { deleteMessage, sendMessage } from "./lib/telegram.mjs";
import { formatAccountUrl, formatHeartbeat, formatNewTxs } from "./lib/messages.mjs";
import { readConfig } from "./lib/config.mjs";

const {
    telegramToken,
    chatId,
    watch = [],
    sleepMs = 5000, // 5 seconds
    heartbeatMs = 1800000 // 30 minutes
} = await readConfig();

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

let nextHeartbeat = 0;
let lastHeartbeatMessageId;

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
                    if (ignoreFileExists) sendMessage(telegramToken, chatId, formatNewTxs(newTxs, etherscan));
                    await appendFile(ignoreFile, newTxs.map(({ hash }) => hash.toLowerCase()).join('\n') + '\n', "ascii");
                }
            } catch (error) {
                console.error("Watch error", error);
                sendMessage(telegramToken, chatId, "⚠️ Error occured").catch(error => console`Cannot send error message ${error}`);
            }
    
            await sleep(sleepMs);
        }
    }));

    if (Date.now() >= nextHeartbeat) {
        const { message_id } = await sendMessage(telegramToken, chatId, formatHeartbeat(watch), { disable_notification: true });
        if (lastHeartbeatMessageId) deleteMessage(telegramToken, chatId, lastHeartbeatMessageId).catch(console.error);
        lastHeartbeatMessageId = message_id;
        nextHeartbeat = Date.now() + heartbeatMs;
    }
}
