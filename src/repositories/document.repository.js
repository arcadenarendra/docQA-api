
import { pool } from '../db/pool.js';
import { env } from '../config/env.js';

const MAX_QUERY_PARAMETERS = 65535;
const PARAMETERS_PER_CHUNK = 7;

function validateDocument(document) {
    if (!document || typeof document !== 'object') {
        throw new Error('Document metadata is required');
    }

    const requiredFields = [
        'userId',
        'originalName',
        'storedName',
        'fileSize'
    ];

    for (const field of requiredFields) {
        if (
            document[field] === undefined ||
            document[field] === null ||
            document[field] === ''
        ) {
            throw new Error(`Missing document field: ${field}`);
        }
    }

    if (
        !Number.isSafeInteger(document.fileSize) ||
        document.fileSize <= 0
    ) {
        throw new Error('Invalid document file size');
    }

    if (
        document.pageCount !== null &&
        document.pageCount !== undefined &&
        (!Number.isInteger(document.pageCount) ||
            document.pageCount <= 0)
    ) {
        throw new Error('Invalid document page count');
    }
}

function validateChunks(chunks) {
    if (!Array.isArray(chunks) || chunks.length === 0) {
        throw new Error('At least one document chunk is required');
    }

    const maxChunks = Math.floor(
        MAX_QUERY_PARAMETERS / PARAMETERS_PER_CHUNK
    );

    if (chunks.length > maxChunks) {
        throw new Error(`Maximum ${maxChunks} chunks per insert`);
    }

    for (const chunk of chunks) {
        if (!chunk || typeof chunk.text !== 'string' || !chunk.text.trim()) {
            throw new Error('Invalid chunk text');
        }

        if (
            !Number.isInteger(chunk.chunkIndex) ||
            chunk.chunkIndex < 0
        ) {
            throw new Error('Invalid chunk index');
        }

        if (
            !Number.isInteger(chunk.characterCount) ||
            chunk.characterCount !== chunk.text.length
        ) {
            throw new Error(
                `Invalid character count for chunk ${chunk.chunkIndex}`
            );
        }

        if (
            !Number.isInteger(chunk.startOffset) ||
            !Number.isInteger(chunk.endOffset) ||
            chunk.startOffset < 0 ||
            chunk.endOffset <= chunk.startOffset
        ) {
            throw new Error(
                `Invalid offsets for chunk ${chunk.chunkIndex}`
            );
        }

        if (
            !Array.isArray(chunk.embedding) ||
            chunk.embedding.length !== env.EMBEDDING_DIM ||
            !chunk.embedding.every(Number.isFinite)
        ) {
            throw new Error(
                `Invalid embedding for chunk ${chunk.chunkIndex}`
            );
        }
    }
}

export async function saveDocumentWithChunks(
    document,
    chunks
) {
    validateDocument(document);
    validateChunks(chunks);

    const client = await pool.connect();
    let transactionStarted = false;

    try {
        await client.query('BEGIN');
        transactionStarted = true;

        // 1. Insert document metadata
        const documentResult = await client.query(
            `INSERT INTO documents (
                user_id,
                original_name,
                stored_name,
                file_size,
                page_count,
                status
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id`,
            [
                document.userId,
                document.originalName,
                document.storedName,
                document.fileSize,
                document.pageCount ?? null,
                'processing'
            ]
        );

        const documentId = documentResult.rows[0].id;

        // 2. Prepare chunk insertion
        const values = [];
        const placeholders = [];

        chunks.forEach((chunk, index) => {
            const offset = index * PARAMETERS_PER_CHUNK;

            placeholders.push(
                `(
                    $${offset + 1},
                    $${offset + 2},
                    $${offset + 3},
                    $${offset + 4},
                    $${offset + 5},
                    $${offset + 6},
                    $${offset + 7}::public.vector
                )`
            );

            values.push(
                documentId,
                chunk.chunkIndex,
                chunk.text,
                chunk.characterCount,
                chunk.startOffset,
                chunk.endOffset,
                `[${chunk.embedding.join(',')}]`
            );
        });

        // 3. Insert all chunks
        await client.query(
            `INSERT INTO document_chunks (
                document_id,
                chunk_index,
                content,
                character_count,
                start_offset,
                end_offset,
                embedding
            )
            VALUES ${placeholders.join(', ')}`,
            values
        );

        // 4. Mark document as completed
        await client.query(
            `UPDATE documents
             SET status = 'completed',
                 updated_at = NOW()
             WHERE id = $1`,
            [documentId]
        );

        await client.query('COMMIT');
        transactionStarted = false;

        return {
            documentId,
            totalChunks: chunks.length,
            status: 'completed'
        };

    } catch (error) {
        if (transactionStarted) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                throw new AggregateError(
                    [error, rollbackError],
                    'Database operation and rollback both failed'
                );
            }
        }

        throw error;

    } finally {
        client.release();
    }
}


export async function searchSimilarChunks(
    userId,
    queryEmbedding,
    { limit = 5 } = {}
) {
    if (!userId) {
        throw new Error('User ID is required');
    }

    if (
        !Array.isArray(queryEmbedding) ||
        queryEmbedding.length !== env.EMBEDDING_DIM ||
        !queryEmbedding.every(Number.isFinite)
    ) {
        throw new Error('Invalid query embedding');
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
        throw new Error('Limit must be between 1 and 20');
    }

    const vector = `[${queryEmbedding.join(',')}]`;

    const result = await pool.query(
        `SELECT
            dc.id AS chunk_id,
            dc.document_id,
            dc.chunk_index,
            dc.content,
            d.original_name,
            1 - (dc.embedding <=> $2::public.vector)
                AS similarity
         FROM document_chunks dc
         INNER JOIN documents d
            ON d.id = dc.document_id
         WHERE d.user_id = $1
           AND d.status = 'completed'
         ORDER BY dc.embedding <=> $2::public.vector
         LIMIT $3`,
        [userId, vector, limit]
    );

    return result.rows;
}

