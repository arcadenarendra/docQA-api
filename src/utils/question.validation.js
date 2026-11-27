import { z } from 'zod';

export const questionSchema = z.object({
    question: z
        .string()
        .trim()
        .min(1, 'Question cannot be empty')
        .max(1000, 'Question cannot exceed 1000 characters')
});