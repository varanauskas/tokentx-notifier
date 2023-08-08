import { RetryableError, wrapRetryable } from "./retryable.mjs";

const request = wrapRetryable(async function request(telegramToken, method, chat_id, body) {
    let response;
    try {
        response = await fetch(`https://api.telegram.org/bot${telegramToken}/${method}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id,
                ...body
            })
        });
    } catch (error) {
        throw RetryableError(`Telegram error`, true, error);
    }
    if (!response.ok) {
        let canRetryOrRetryAfter = false;
        if (response.status === 429) {
            const json = await response.json();
            const { retry_after } = json.parameters ?? { retry_after: 10 };
            canRetryOrRetryAfter = retry_after;
        }
        throw new RetryableError(`Telegram error ${response.status} (${await response.text()})`, canRetryOrRetryAfter);
    }
    const json = await response.json();
    if (!json.ok)
        throw new RetryableError(`Telegram error (${JSON.stringify(json)})`, false);
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