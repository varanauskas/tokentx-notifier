import { sleep } from "./utils.mjs";

export class RetryableError extends Error {
    #canRetryOrRetryAfter;
    details;

    constructor(message, canRetryOrRetryAfter, details) {
        super(message);
        this.#canRetryOrRetryAfter = canRetryOrRetryAfter;
        this.details = details;
    }

    get retryAfter() {
        return typeof this.#canRetryOrRetryAfter === "number"
            ? this.#canRetryOrRetryAfter
            : null;
    }

    get canRetry() {
        return typeof this.#canRetryOrRetryAfter === "boolean"
            ? this.#canRetryOrRetryAfter
            : this.retryAfter !== null; 
    }
}

async function callRetryable(fn, attempt = 0) {
    try {
        return await fn();
    } catch (error) {
        if (error instanceof RetryableError && error.canRetry && attempt <= 10) {
            const retryAfter = error.retryAfter ?? (2 ** attempt) * 750;
            console.warn(`${error.message}, retrying after ${retryAfter} ms`, error.details);
            await sleep(retryAfter);
            return callRetryable(fn, attempt++);
        }
        throw error;
    }
}

export const wrapRetryable = fn => (...args) => callRetryable(() => fn(...args));
