
import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production'])
        .default('development'),

    PORT: z.coerce.number().int().positive().default(3000),

    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    
    GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),  

    EMBEDDING_DIM: z.coerce.number()
    
    .int()
    .refine(
        value => [768, 1536, 3072].includes(value),
        'EMBEDDING_DIM must be 768, 1536, or 3072'
    )
    .default(768)
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
    console.error(
        'Environment validation failed:',
        result.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
        }))
    );

    process.exit(1);
}

export const env = result.data;

