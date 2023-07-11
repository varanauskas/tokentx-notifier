import { sleep } from "./utils.mjs";

async function request(telegramToken, method, chat_id, body) {
    const result = await fetch(`https://api.telegram.org/bot${telegramToken}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id,
            ...body
        })
    });
    if (!result.ok && result.status !== 429)
        throw new Error(`Telegram error ${result.status} (${await result.text()})`);
    const json = await result.json();
    if (result.status === 429) {
        const { retry_after } = json.parameters ?? { retry_after: 10 };
        console.log(`Telegram error 429, sleeping ${retry_after} seconds`);
        await sleep((retry_after + 1) * 1000);
        return request(telegramToken, method, chat_id, body);
    }
    if (!json.ok) throw new Error(`Telegram error (${JSON.stringify(json)})`)
    return json.result;
}

const textOptions = {
    parse_mode: "MarkdownV2",
    disable_web_page_preview: true
};

export const sendMessage = (telegramToken, chatId, text, options = {}) => request(telegramToken, "sendMessage", chatId, {
    text,
    ...textOptions,
    ...options
});

export const editMessageText = (telegramToken, chatId, message_id, text, options = {}) => request(telegramToken, "editMessageText", chatId, { message_id, text, ...textOptions, ...options });

export const deleteMessage = (telegramToken, chatId, message_id) => request(telegramToken, "deleteMessage", chatId, { message_id });