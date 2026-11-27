
import { gemini } from '../config/gemini.js';

try {
    console.log('Testing Gemini connection...');

    const response = await gemini.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'Reply with exactly: Gemini connection successful.'
    });

    console.log('Gemini response:', response.text);

} catch (error) {
    console.error('Gemini connection failed:');
    console.error(error);
    process.exitCode = 1;
}
