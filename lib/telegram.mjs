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
        throw new RetryableError(`Telegram fetch error`, true, error);
    }
    const text = await response.text();
    if (response.status === 502) {
        throw new RetryableError(`Telegram error 502 (${text})`, true);
    }
    let json;
    try {
        json = JSON.parse(text);
    } catch (error) {
        throw new RetryableError(`Telegram JSON parse error (${text})`, true, error);
    }
    if (!json.ok) {
        let canRetryOrRetryAfter = response.status === 502;
        if (response.status === 429) {
            const { retry_after } = json.parameters ?? { retry_after: 10 };
            canRetryOrRetryAfter = retry_after;
        }
        throw new RetryableError(`Telegram error ${response.status} (${text})`, canRetryOrRetryAfter);
    }
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