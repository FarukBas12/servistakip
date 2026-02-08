require('dotenv').config({ path: './server/.env' });
const db = require('./server/db');

async function checkPhotos() {
    try {
        const res = await db.query('SELECT id, name, photo FROM subcontractors WHERE photo IS NOT NULL');
        console.log('Subcontractors with photos:', res.rows);

        const all = await db.query('SELECT id, name, photo FROM subcontractors LIMIT 5');
        console.log('Sample data:', all.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkPhotos();
