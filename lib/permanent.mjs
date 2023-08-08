import { editMessageText, sendMessage } from "./telegram.mjs";

const NO_MESSAGE = Symbol("NO_MESSAGE");

export function sendPermanentMessage(telegramToken, chatId) {
    let statusMessageId;

    async function setMessageText(text) {
        try {
            if (!statusMessageId) throw NO_MESSAGE;
            await editMessageText(telegramToken, chatId, statusMessageId, text);
        } catch (error) {
            if (!(error === NO_MESSAGE)) console.warn("Error when updating status", error);
            const { message_id } = await sendMessage(telegramToken, chatId, text, { disable_notification: true });
            statusMessageId = message_id;
        }
    }

    return setMessageText;
}