const db = require('../db');

const addIndexes = async () => {
    try {
        console.log('Adding indexes...');

        // Tasks Table Indexes
        await db.query('CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);');
        console.log('Index created: idx_tasks_status');

        await db.query('CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);');
        console.log('Index created: idx_tasks_due_date');

        await db.query('CREATE INDEX IF NOT EXISTS idx_tasks_region ON tasks(region);');
        console.log('Index created: idx_tasks_region');

        // Task Assignments Table Indexes
        await db.query('CREATE INDEX IF NOT EXISTS idx_task_assignments_user_id ON task_assignments(user_id);');
        console.log('Index created: idx_task_assignments_user_id');

        await db.query('CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);');
        console.log('Index created: idx_task_assignments_task_id');

        // Task Logs Indexes
        await db.query('CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON task_logs(task_id);');
        console.log('Index created: idx_task_logs_task_id');

        console.log('All indexes added successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error adding indexes:', err);
        process.exit(1);
    }
};

addIndexes();
