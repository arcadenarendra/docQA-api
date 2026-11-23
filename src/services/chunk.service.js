
export function cleanPdfText(text) {
    if (typeof text !== 'string') {
        throw new TypeError('PDF text must be a string');
    }

    return text
        .replace(/\r\n?/g, '\n')
        // Remove PDF parser page markers such as "-- 1 of 53 --"
        .replace(/^\s*--\s*\d+\s+of\s+\d+\s*--\s*$/gm, '')
        .split('\n')
        .map(line => line.replace(/[ \t]+/g, ' ').trim())
        .join('\n')
        // Remove excessive blank lines
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

export function chunkText(
    text,
    { chunkSize = 1200, overlap = 200 } = {}
) {
    if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
        throw new Error('chunkSize must be a positive integer');
    }

    if (
        !Number.isInteger(overlap) ||
        overlap < 0 ||
        overlap >= chunkSize
    ) {
        throw new Error('overlap must be between 0 and chunkSize');
    }

    const cleanedText = cleanPdfText(text);

    if (!cleanedText) {
        return [];
    }

    const chunks = [];
    let start = 0;

    while (start < cleanedText.length) {
        const targetEnd = Math.min(
            start + chunkSize,
            cleanedText.length
        );

        let end = targetEnd;

        if (targetEnd < cleanedText.length) {
            const minimumBoundary = start + chunkSize * 0.6;

            const boundaries = [
                { index: cleanedText.lastIndexOf('\n\n', targetEnd), length: 2 },
                { index: cleanedText.lastIndexOf('. ', targetEnd), length: 1 },
                { index: cleanedText.lastIndexOf('? ', targetEnd), length: 1 },
                { index: cleanedText.lastIndexOf('! ', targetEnd), length: 1 },
                { index: cleanedText.lastIndexOf('\n', targetEnd), length: 1 },
                { index: cleanedText.lastIndexOf(' ', targetEnd), length: 1 }
            ];

            const validBoundaries = boundaries
                .filter(boundary =>
                    boundary.index >= minimumBoundary
                )
                .sort((a, b) => b.index - a.index);

            if (validBoundaries.length > 0) {
                end = validBoundaries[0].index +
                    validBoundaries[0].length;
            }
        }

        const chunk = cleanedText.slice(start, end).trim();

        if (chunk) {
            chunks.push({
                chunkIndex: chunks.length,
                text: chunk,
                characterCount: chunk.length,
                startOffset: start,
                endOffset: end
            });
        }

        if (end >= cleanedText.length) {
            break;
        }

        // Move backwards to create overlap.
        let nextStart = Math.max(start + 1, end - overlap);

        // Avoid starting the next chunk in the middle of a word.
        while (
            nextStart < end &&
            !/\s/.test(cleanedText[nextStart])
        ) {
            nextStart++;
        }

        while (
            nextStart < cleanedText.length &&
            /\s/.test(cleanedText[nextStart])
        ) {
            nextStart++;
        }

        start = nextStart;
    }

    return chunks;
}
