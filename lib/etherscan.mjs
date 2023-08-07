import { sleep } from "./utils.mjs";

async function handleError(message, attemt, etherscan, params) {
    console.warn(message);
    sleep(attempt * 750);
    return getTokenTx(etherscan, params, attempt * 2);
}

export async function getTokenTx(etherscan, params, attempt = 1) {
    const url = new URL(`https://api.${etherscan}/api`);
    url.searchParams.append("module", "account");
    url.searchParams.append("action", "tokentx");
    url.searchParams.append("page", "1");
    Object.entries(params).forEach(([key, value]) => url.searchParams.append(key.toLowerCase(), value));
    url.searchParams.append("sort", "desc");
    let response;
    try {
        response = await fetch(url);
    } catch (error) {
        if (attempt <= 1024) {
            return handleError(`${etherscan} connection error, retrying after ${attempt} ms`); 
        }
        throw error;
    }
    const response = await fetch(url);
    if (!response.ok) {
        if (response.status >= 500 && attempt <= 1024) {
            return handleError(`${etherscan} got ${response.status}, retrying after ${attempt} ms`);
        }
        throw new Error(`${etherscan} error ${response.status} (${await response.text()})`);
    }
    const json = await response.json();
    if (json.status !== "1") {
        if (["Invalid API Key", "No transactions found"].includes(json.result) && attempt <= 1024) {
            return handleError(`${etherscan} got ${json.result}, retrying after ${attempt} ms`);
        }
        throw new Error(`${etherscan} error (${JSON.stringify(json)})`);
    }
    return json.result;
}