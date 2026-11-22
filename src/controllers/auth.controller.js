
import { registerSchema } from '../utils/auth.validation.js';
import { registerUser } from '../services/auth.service.js';
import { getUserById } from '../services/auth.service.js';

import { loginSchema } from '../utils/auth.validation.js';
import { loginUser } from '../services/auth.service.js';

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



export async function login(req, res, next) {
    try {
        const validation = loginSchema.safeParse(req.body);

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

        const result = await loginUser(validation.data);

        return res.status(200).json({
            message: 'Login successful',
            ...result
        });
    } catch (error) {
        next(error);
    }
}


export async function getMe(req, res, next) {
    try {
        const user = await getUserById(req.user.id);

        if (!user) {
            return res.status(404).json({
                error: {
                    message: 'User not found'
                }
            });
        }

        return res.status(200).json({
            user
        });
    } catch (error) {
        next(error);
    }
}