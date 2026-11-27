
import { pool } from '../db/pool.js';

import {
    generateQueryEmbedding
} from '../services/embedding.service.js';

import {
    searchSimilarChunks
} from '../repositories/document.repository.js';

const userId = process.env.TEST_USER_ID;

async function testSemanticSearch() {
    if (!userId) {
        throw new Error('TEST_USER_ID is required');
    }

    const question =
        'What topics are discussed in this system design document?';

    console.log('Question:', question);

    // 1. Convert the question into an embedding
    const queryEmbedding = await generateQueryEmbedding(question);

    console.log(
        'Query embedding dimensions:',
        queryEmbedding.length
    );

    // 2. Search the database
    const results = await searchSimilarChunks(
        userId,
        queryEmbedding,
        { limit: 3 }
    );

    // 3. Display the results
    console.log('\nMatching chunks:', results.length);

    for (const result of results) {
        console.log('\n----------------------------');
        console.log('Document:', result.original_name);
        console.log('Chunk index:', result.chunk_index);
        console.log(
            'Similarity:',
            Number(result.similarity).toFixed(4)
        );
        console.log('Content:', result.content.slice(0, 300));
    }
}

try {
    await testSemanticSearch();
} catch (error) {
    console.error('Semantic search failed:', error);
    process.exitCode = 1;
} finally {
    await pool.end();
}
