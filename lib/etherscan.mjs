import { RetryableError, wrapRetryable } from "./retryable.mjs";

/**
 * Cache startBlocks
 * @type {Map<string, BigInt>}
 */
let startBlocks = new Map();

const RETRYABLE_MESSAGES = new Set([
    "Query Timeout occured. Please select a smaller result dataset",
    "No transactions found"
]);

export const getTokenTx = wrapRetryable(async function getTokenTx(etherscan, params) {
    // Construct URL without startBlock
    const url = new URL(`https://api.${etherscan}/api`);
    url.searchParams.append("module", "account");
    url.searchParams.append("action", "tokentx");
    url.searchParams.append("page", "1");
    Object.entries(params).forEach(([key, value]) => url.searchParams.append(key.toLowerCase(), value));
    url.searchParams.append("sort", "desc");

    // Calculate Cache key before appending startBlock
    const key = url.toString();

    // Append startBlock from cache if present
    const startBlock = startBlocks.get(key);
    if (startBlock) url.searchParams.append("startblock", startBlock.toString());

    let response;
    try {
        response = await fetch(url);
    } catch (error) {
        throw new RetryableError(`${etherscan} connection error`, true, error);
    }
    if (!response.ok)
        throw new RetryableError(
            `${etherscan} got ${response.status}`,
            response.status >= 500,
            url
        );
    const text = await response.text();
    const json = JSON.parse(text);
    if (json.status !== "1")
        throw new RetryableError(
            `${etherscan} error "${text}}"`,
            json.result === "Invalid API Key" || RETRYABLE_MESSAGES.has(json.message),
            url
        );
    const { result } = json;

    // If transactions present cache last transaction start block
    if (result.length !== 0) {
        result.sort((a, b) => Number(BigInt(a.blockNumber) - BigInt(b.blockNumber)));
        startBlocks.set(key, BigInt(result.at(-1).blockNumber) - 1n);
    }
    return result;
});
