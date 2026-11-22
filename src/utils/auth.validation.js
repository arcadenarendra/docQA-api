
import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string()
        .trim()
        .email('Please provide a valid email address')
        .max(254),

    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(72, 'Password must not exceed 72 characters')
});
