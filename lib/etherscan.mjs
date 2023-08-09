import { RetryableError, wrapRetryable } from "./retryable.mjs";

export const getTokenTx = wrapRetryable(async function getTokenTx(etherscan, params) {
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
        throw new RetryableError(`${etherscan} connection error`, true, error);
    }
    if (!response.ok)
        throw new RetryableError(`${etherscan} got ${response.status}`, response.status >= 500);
    const text = await response.text();
    const json = JSON.parse(text);
    if (json.status !== "1")
        throw new RetryableError(`${etherscan} error "${text}}"`, ["Invalid API Key", "No transactions found"].includes(json.result));
    return json.result;
});
