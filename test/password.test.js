import { describe, it, expect } from 'vitest';

import {
    hashPassword,
    comparePassword
} from '../src/utils/password.js';

describe('Password Utility', () => {
    it('should hash a password', async () => {
        const password = 'Test@12345';

        const hashedPassword = await hashPassword(password);

        expect(hashedPassword).not.toBe(password);
        expect(hashedPassword).toMatch(/^\$2[aby]\$/);
    });

    it('should compare the correct password', async () => {
        const password = 'Test@12345';
        const hashedPassword = await hashPassword(password);

        const result = await comparePassword(
            password,
            hashedPassword
        );

        expect(result).toBe(true);
    });

    it('should reject an incorrect password', async () => {
        const hashedPassword = await hashPassword('Test@12345');

        const result = await comparePassword(
            'WrongPassword',
            hashedPassword
        );

        expect(result).toBe(false);
    });
});