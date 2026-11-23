
import { readFile } from 'node:fs/promises';
import { PDFParse } from 'pdf-parse';

export async function extractPdfText(filePath) {
    const fileBuffer = await readFile(filePath);

    const parser = new PDFParse({
        data: fileBuffer
    });

    try {
        const result = await parser.getText();

        return {
            text: result.text,
            pageCount: result.total
        };
    } finally {
        // Release PDF parser resources
        await parser.destroy();
    }
}
