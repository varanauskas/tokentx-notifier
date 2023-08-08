import { sleep } from "./utils.mjs";

export class RetryableError extends Error {
    #canRetryOrRetryAfter;
    originalError;

    constructor(message, canRetryOrRetryAfter, originalError) {
        super(message);
        this.#canRetryOrRetryAfter = canRetryOrRetryAfter;
        this.originalError = originalError;
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
            const retryAfter = error.retryAfter ?? (attempt ** 2) * 750;
            console.warn(`${error.message}, retrying after ${retryAfter} ms`);
            await sleep(retryAfter);
            return callRetryable(fn, attempt++);
        }
        throw error instanceof RetryableError
            ? error.originalError ?? error
            : error;
    }
}

export const wrapRetryable = fn => (...args) => callRetryable(() => fn(...args));
