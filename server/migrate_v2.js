const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function migrate() {
    try {
        console.log('Migrating database...');
        // Add maps_link column if not exists
        await pool.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS maps_link TEXT');
        console.log('Migration successful!');
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await pool.end();
    }
}

migrate();
