const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function check() {
    try {
        const res = await pool.query('SELECT id, title, lat, lng, created_at FROM tasks ORDER BY id DESC LIMIT 10');
        console.log('--- Last 10 Tasks ---');
        res.rows.forEach(r => {
            console.log(`[${r.id}] ${r.title}: Lat=${r.lat}, Lng=${r.lng} (Created: ${r.created_at})`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

check();
