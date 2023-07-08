import { formatStatus } from "./messages.mjs";
import { editMessageText, sendMessage } from "./telegram.mjs";

class NoStatusMessage extends Error {
    constructor() {
        super("NoStatusMessage");
    }
}

export function statusMessage(telegramToken, chatId) {
    let statusMessageId;

    async function update(watch) {
        const text = formatStatus(watch);
        try {
            if (!statusMessageId) throw new NoStatusMessage();
            await editMessageText(telegramToken, chatId, statusMessageId, text);
        } catch (error) {
            if (!(error instanceof NoStatusMessage)) console.warn("Error when updating status", error);
            const { message_id } = await sendMessage(telegramToken, chatId, text, { disable_notification: true });
            statusMessageId = message_id;
        }
    }

    return { update };
}