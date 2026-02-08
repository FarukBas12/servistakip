const db = require('../db');

async function migrate() {
    try {
        console.log('Starting migration...');
        await db.query(`
            ALTER TABLE app_settings 
            ADD COLUMN IF NOT EXISTS notification_email VARCHAR(255);
        `);
        console.log("Column notification_email added successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
