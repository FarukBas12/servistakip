const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function initDb() {
    try {
        const sqlPath = path.join(__dirname, 'database.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split by semicolon to run commands one by one (simplified) if needed, 
        // but pg library can handle multiple statements usually.
        // However, the \c command is psql specific and won't work in node-pg.
        // We should remove the \c fieldservice part since connection string usually selects DB.

        // Clean up SQL: remove \c command
        const cleanSql = sql.replace(/\\c fieldservice;/g, '');

        console.log('Connecting to database...');
        await pool.query(cleanSql);
        console.log('Database initialized successfully!');
    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        await pool.end();
    }
}

initDb();
