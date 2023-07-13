import { sleep } from "./utils.mjs";

export async function getTokenTx(etherscan, params, attempt = 1) {
    const url = new URL(`https://api.${etherscan}/api`);
    url.searchParams.append("module", "account");
    url.searchParams.append("action", "tokentx");
    url.searchParams.append("page", "1");
    Object.entries(params).forEach(([key, value]) => url.searchParams.append(key.toLowerCase(), value));
    url.searchParams.append("sort", "desc");
    const response = await fetch(url);
    if (!response.ok) {
        if (response.status >= 500 && attempt <= 1024) {
            console.warn(`Etherscan got ${response.status}, retrying ${attempt} time`);
            await sleep(attempt * 750);
            return getTokenTx(etherscan, params, attempt * 2);
        }
        throw new Error(`Etherscan error ${response.status} (${await response.text()})`);
    }
    const json = await response.json();
    if (json.status !== "1") throw new Error(`Etherscan error (${JSON.stringify(json)})`);
    return json.result;
}