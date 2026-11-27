
import { questionSchema } from '../utils/question.validation.js';

import {
    generateQueryEmbedding
} from '../services/embedding.service.js';

import {
    searchSimilarChunks
} from '../repositories/document.repository.js';

import {
    generateAnswer
} from '../services/answer.service.js';

export async function askQuestion(req, res, next) {
    try {
        // 1. Validate request
        const validation = questionSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                error: {
                    message: 'Validation failed',
                    details: validation.error.issues.map(issue => ({
                        field: issue.path.join('.'),
                        message: issue.message
                    }))
                }
            });
        }

        const { question } = validation.data;

        // 2. Generate query embedding
        const queryEmbedding = await generateQueryEmbedding(question);

        // 3. Search only the authenticated user's documents
        const chunks = await searchSimilarChunks(
            req.user.id,
            queryEmbedding,
            { limit: 5 }
        );

        // 4. Handle no matching documents
        if (chunks.length === 0) {
            return res.status(200).json({
                answer: 'No relevant information was found in your uploaded documents.',
                sources: []
            });
        }

        // 5. Generate answer using retrieved context
        const result = await generateAnswer(question, chunks);

        return res.status(200).json({
            question,
            answer: result.answer,
            sources: result.sources
        });

    } catch (error) {
        next(error);
    }
}
