
import { stat } from 'node:fs/promises';
import { resolve, basename } from 'node:path';

import { pool } from '../db/pool.js';
import { extractPdfText } from '../services/pdf.service.js';
import { chunkText } from '../services/chunk.service.js';
import { generateBatchEmbeddings } from '../services/batch-embedding.service.js';
import { saveDocumentWithChunks } from '../repositories/document.repository.js';

const userId = process.env.TEST_USER_ID;

const filePath = resolve(
    'uploads/eec907d1-8243-43b5-a751-e0a0171337cc.pdf'
);

async function testDocumentRepository() {
    if (!userId) {
        throw new Error('TEST_USER_ID environment variable is required');
    }

    // 1. Read the uploaded PDF
    const fileStats = await stat(filePath);

    // 2. Extract PDF text
    const pdf = await extractPdfText(filePath);

    // 3. Generate three chunks for testing
    const chunks = chunkText(pdf.text).slice(0, 3);

    if (chunks.length !== 3) {
        throw new Error('Expected at least three PDF chunks');
    }

    console.log('Chunks prepared:', chunks.length);

    // 4. Generate embeddings
    const embeddedChunks = await generateBatchEmbeddings(
        chunks,
        { concurrency: 2 }
    );

    console.log('Embeddings generated:', embeddedChunks.length);

    // 5. Save document and chunks in Supabase
    const result = await saveDocumentWithChunks(
        {
            userId,
            originalName: 'System_Design_Mastery_Shivansh_Vasu.pdf',
            storedName: basename(filePath),
            fileSize: fileStats.size,
            pageCount: pdf.pageCount
        },
        embeddedChunks
    );

    console.log('\nDocument saved successfully!');
    console.log(result);

    // 6. Verify database records
    const verification = await pool.query(
        `SELECT
            d.id,
            d.status,
            COUNT(dc.id)::INTEGER AS total_chunks
         FROM documents d
         LEFT JOIN document_chunks dc
            ON dc.document_id = d.id
         WHERE d.id = $1
         GROUP BY d.id`,
        [result.documentId]
    );

    console.log('\nDatabase verification:');
    console.log(verification.rows[0]);
}

try {
    await testDocumentRepository();
} catch (error) {
    console.error('Integration test failed:', error.message);
    process.exitCode = 1;
} finally {
    await pool.end();
}
