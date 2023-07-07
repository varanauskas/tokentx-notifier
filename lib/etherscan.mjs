export async function getTokenTx(etherscan, params) {
    const url = new URL(`https://api.${etherscan}/api`);
    url.searchParams.append("module", "account");
    url.searchParams.append("action", "tokentx")
    Object.entries(params).forEach(([key, value]) => url.searchParams.append(key.toLowerCase(), value));
    url.searchParams.append("sort", "desc");
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Etherscan error ${response.status} (${await response.text()})`);
    const json = await response.json();
    if (json.status !== "1") throw new Error(`Etherscan error (${JSON.stringify(json)})`);
    return json.result;
}