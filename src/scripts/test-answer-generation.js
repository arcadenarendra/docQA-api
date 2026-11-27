
import { pool } from '../db/pool.js';

import {
    generateQueryEmbedding
} from '../services/embedding.service.js';

import {
    searchSimilarChunks
} from '../repositories/document.repository.js';

import {
    generateAnswer
} from '../services/answer.service.js';

const userId = process.env.TEST_USER_ID;

async function testAnswerGeneration() {
    if (!userId) {
        throw new Error('TEST_USER_ID is required');
    }

    const question =
        'What are the main phases of the system design learning program?';

    // 1. Generate query embedding
    const queryEmbedding = await generateQueryEmbedding(question);

    // 2. Retrieve relevant document chunks
    const chunks = await searchSimilarChunks(
        userId,
        queryEmbedding,
        { limit: 5 }
    );

    if (chunks.length === 0) {
        throw new Error('No matching document chunks found');
    }

    // 3. Generate answer using retrieved context
    const result = await generateAnswer(question, chunks);

    console.log('\nQUESTION:');
    console.log(question);

    console.log('\nGENERATED ANSWER:');
    console.log(result.answer);

    console.log('\nSOURCES:');
    console.log(JSON.stringify(result.sources, null, 2));
}

try {
    await testAnswerGeneration();
} catch (error) {
    console.error('Answer generation failed:', error);
    process.exitCode = 1;
} finally {
    await pool.end();
}
