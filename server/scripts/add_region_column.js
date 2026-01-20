const pool = require('../db');

const addRegionColumn = async () => {
    try {
        console.log('Adding region column to tasks table...');
        await pool.query(`
            ALTER TABLE tasks 
            ADD COLUMN IF NOT EXISTS region VARCHAR(50) DEFAULT 'Diğer';
        `);
        console.log('SUCCESS: region column added.');
        process.exit(0);
    } catch (err) {
        console.error('ERROR: Could not add region column.', err.message);
        process.exit(1);
    }
};

addRegionColumn();
