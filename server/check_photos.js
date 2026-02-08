require('dotenv').config();
const db = require('./db');

async function checkPhotos() {
    try {
        const res = await db.query('SELECT id, name, photo FROM subcontractors WHERE photo IS NOT NULL AND photo != \'\'');
        console.log('Subcontractors with photos:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkPhotos();
