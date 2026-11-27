
import { unlink } from 'node:fs/promises';

import { extractPdfText } from '../services/pdf.service.js';
import {
    cleanPdfText,
    chunkText
} from '../services/chunk.service.js';

import {
    generateBatchEmbeddings
} from '../services/batch-embedding.service.js';

import {
    saveDocumentWithChunks
} from '../repositories/document.repository.js';

export async function uploadDocument(req, res, next) {
    if (!req.file) {
        return res.status(400).json({
            error: {
                message: 'Please upload a PDF document'
            }
        });
    }

    try {
        // 1. Extract text from PDF
        const extracted = await extractPdfText(req.file.path);

        // 2. Clean extracted text
        const cleanedText = cleanPdfText(extracted.text);

        if (!cleanedText) {
            throw new Error(
                'No readable text found in the PDF'
            );
        }

        // 3. Split text into chunks
        const chunks = chunkText(cleanedText);

        if (chunks.length === 0) {
            throw new Error(
                'Unable to create document chunks'
            );
        }

        // 4. Generate embeddings
        const embeddedChunks = await generateBatchEmbeddings(
            chunks,
            { concurrency: 3 }
        );

        // 5. Save document and chunks in database
        const savedDocument = await saveDocumentWithChunks(
            {
                userId: req.user.id,
                originalName: req.file.originalname,
                storedName: req.file.filename,
                fileSize: req.file.size,
                pageCount: extracted.pageCount
            },
            embeddedChunks
        );

        // 6. Return success response
        return res.status(201).json({
            message: 'Document processed successfully',
            document: {
                id: savedDocument.documentId,
                originalName: req.file.originalname,
                pageCount: extracted.pageCount,
                totalChunks: savedDocument.totalChunks,
                status: savedDocument.status
            }
        });

    } catch (error) {
        next(error);

    } finally {
        // 7. Delete temporary uploaded file
        try {
            await unlink(req.file.path);
        } catch (cleanupError) {
            console.error(
                'Failed to delete temporary PDF:',
                cleanupError.message
            );
        }
    }
}
