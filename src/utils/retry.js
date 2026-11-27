
function isRetryableError(error) {
    const status = error.status ?? error.statusCode;

    if ([429, 500, 502, 503, 504].includes(status)) {
        return true;
    }

    // Network-related errors
    const retryableCodes = [
        'ECONNRESET',
        'ETIMEDOUT',
        'ECONNREFUSED',
        'EAI_AGAIN'
    ];

    return retryableCodes.includes(error.code);
}

export async function retry(
    operation,
    {
        retries = 3,
        initialDelay = 2000
    } = {}
) {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;

            if (
                attempt === retries ||
                !isRetryableError(error)
            ) {
                throw error;
            }

            const delay = initialDelay * (2 ** attempt);

            await new Promise(resolve =>
                setTimeout(resolve, delay)
            );
        }
    }

    throw lastError;
}
