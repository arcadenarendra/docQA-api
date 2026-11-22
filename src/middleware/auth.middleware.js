
import { registerSchema } from '../utils/auth.validation.js';
import { registerUser } from '../services/auth.service.js';

export async function register(req, res, next) {
    try {
        const validation = registerSchema.safeParse(req.body);

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

        const user = await registerUser(validation.data);

        return res.status(201).json({
            message: 'User registered successfully',
            user
        });
    } catch (error) {
        next(error);
    }
}
