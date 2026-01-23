const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        console.log('🔄 Starting Multi-Assign Migration...');

        // 1. Create Assignment Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS task_assignments (
                task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (task_id, user_id)
            );
        `);
        console.log('✅ task_assignments table created.');

        // 2. Migrate Existing Data
        const { rows } = await pool.query('SELECT id, assigned_to FROM tasks WHERE assigned_to IS NOT NULL');

        for (const task of rows) {
            await pool.query(
                'INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [task.id, task.assigned_to]
            );
        }
        console.log(`✅ Migrated ${rows.length} existing assignments.`);

        // 3. Update tasks status logic (Optional cleanup, keeping column for safety for now)
        // await pool.query('ALTER TABLE tasks DROP COLUMN assigned_to'); 

        console.log('🎉 Migration Complete!');
    } catch (err) {
        console.error('❌ Migration Failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
