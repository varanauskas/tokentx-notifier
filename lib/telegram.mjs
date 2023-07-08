const request = (telegramToken, method, chat_id, body) => fetch(`https://api.telegram.org/bot${telegramToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        chat_id,
        ...body
    })
}).then(async result => {
    if (!result.ok) throw new Error(`Telegram error ${result.status} (${await result.text()})`);
    const json = await result.json();
    if (!json.ok) throw new Error(`Telegram error (${JSON.stringify(json)})`)
    return json.result;
});

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