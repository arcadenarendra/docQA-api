
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import { pool } from './pool.js';

const migrationsDir = fileURLToPath(
    new URL('./migrations/', import.meta.url)
);

async function runMigrations() {
    const files = (await readdir(migrationsDir))
        .filter(file => /^\d+.*\.sql$/i.test(file))
        .sort();

    if (files.length === 0) {
        console.log('No migration files found');
        return;
    }

    for (const file of files) {
        const migrationPath = join(migrationsDir, file);
        const sql = await readFile(migrationPath, 'utf8');

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            await client.query(sql);

            await client.query('COMMIT');

            console.log(`Migration completed: ${file}`);
        } catch (error) {
            await client.query('ROLLBACK');
            throw new Error(
                `Migration failed: ${file} - ${error.message}`,
                { cause: error }
            );
        } finally {
            client.release();
        }
    }

    console.log('All migrations completed successfully');
}

try {
    await runMigrations();
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
} finally {
    await pool.end();
}
