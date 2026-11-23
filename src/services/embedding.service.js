
import { gemini } from '../config/gemini.js';
import { env } from '../config/env.js';

const MODEL = 'gemini-embedding-001';

function normalizeEmbedding(embedding) {
    const magnitude = Math.sqrt(
        embedding.reduce((sum, value) => sum + value * value, 0)
    );

    if (magnitude === 0) {
        throw new Error('Cannot normalize a zero embedding');
    }

    return embedding.map(value => value / magnitude);
}

async function generateEmbedding(text, taskType) {
    if (typeof text !== 'string' || !text.trim()) {
        throw new Error('Text must be a non-empty string');
    }

    const response = await gemini.models.embedContent({
        model: MODEL,
        contents: text,
        config: {
            taskType,
            outputDimensionality: env.EMBEDDING_DIM
        }
    });

    const embedding = response.embeddings?.[0]?.values;

    if (!Array.isArray(embedding)) {
        throw new Error('Gemini returned an invalid embedding');
    }

    if (embedding.length !== env.EMBEDDING_DIM) {
        throw new Error(
            `Expected ${env.EMBEDDING_DIM} dimensions, received ${embedding.length}`
        );
    }

    if (!embedding.every(Number.isFinite)) {
        throw new Error('Embedding contains invalid numerical values');
    }

    return normalizeEmbedding(embedding);
}

export async function generateDocumentEmbedding(text) {
    return generateEmbedding(text, 'RETRIEVAL_DOCUMENT');
}

export async function generateQueryEmbedding(text) {
    return generateEmbedding(text, 'RETRIEVAL_QUERY');
}
