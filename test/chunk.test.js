
import { describe, it, expect } from 'vitest';

import {
    cleanPdfText,
    chunkText
} from '../src/services/chunk.service.js';

describe('PDF Text Cleaning', () => {
    it('should remove excessive whitespace', () => {
        const result = cleanPdfText('Hello\n\n\n\nWorld');

        expect(result).toBe('Hello\n\nWorld');
    });

    it('should remove PDF page markers', () => {
        const result = cleanPdfText(
            'Hello\n\n-- 1 of 10 --\n\nWorld'
        );

        expect(result).not.toContain('-- 1 of 10 --');
    });

    it('should reject non-string input', () => {
        expect(() => cleanPdfText(null)).toThrow();
    });
});

describe('Text Chunking', () => {
    it('should return an empty array for empty text', () => {
        expect(chunkText('   ')).toEqual([]);
    });

    it('should create multiple chunks', () => {
        const text = 'A'.repeat(3000);
        const chunks = chunkText(text);

        expect(chunks.length).toBeGreaterThan(1);
    });

    it('should keep chunks within the configured size', () => {
        const text = 'A'.repeat(3000);
        const chunks = chunkText(text);

        chunks.forEach(chunk => {
            expect(chunk.characterCount).toBeLessThanOrEqual(1200);
        });
    });

    it('should assign sequential chunk indexes', () => {
        const chunks = chunkText('A'.repeat(3000));

        chunks.forEach((chunk, index) => {
            expect(chunk.chunkIndex).toBe(index);
        });
    });

    it('should reject invalid overlap', () => {
        expect(() =>
            chunkText('Hello world', {
                chunkSize: 100,
                overlap: 100
            })
        ).toThrow();
    });
});
