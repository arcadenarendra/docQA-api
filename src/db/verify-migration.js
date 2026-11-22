
import { pool } from './pool.js';

try {
    const result = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
    `);

    console.log('Migration verification result:');
    console.log(result.rows);

    if (result.rows.length === 1) {
        console.log('SUCCESS: users table exists.');
    } else {
        console.log('WARNING: users table was not found.');
    }
} catch (error) {
    console.error('Verification failed:', error.message);
    process.exitCode = 1;
} finally {
    await pool.end();
}
