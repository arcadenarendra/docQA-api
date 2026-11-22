
import { registerSchema } from '../utils/auth.validation.js';
import { registerUser } from '../services/auth.service.js';
import jwt from 'jsonwebtoken';

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


export function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: {
                message: 'Authentication token is required'
            }
        });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            error: {
                message: 'Invalid authorization header'
            }
        });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
        return res.status(500).json({
            error: {
                message: 'Authentication configuration error'
            }
        });
    }

    try {
        const decoded = jwt.verify(token, secret, {
            algorithms: ['HS256']
        });

        req.user = {
            id: decoded.sub
        };

        next();
    } catch (error) {
        return res.status(401).json({
            error: {
                message: 'Invalid or expired token'
            }
        });
    }
}