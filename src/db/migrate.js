
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { pool } from './pool.js';

const migrationPath = fileURLToPath(
    new URL('./migrations/001_users.sql', import.meta.url)
);

try {
    const sql = await readFile(migrationPath, 'utf8');

    await pool.query(sql);

    console.log('Migration completed successfully');
} catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
} finally {
    await pool.end();
}
