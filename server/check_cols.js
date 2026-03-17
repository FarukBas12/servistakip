const db = require('./db');
async function check() {
    const tables = ['projects', 'payments', 'stocks'];
    for (const table of tables) {
        try {
            const res = await db.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
            console.log(`Columns in ${table}:`, res.rows.map(r => r.column_name));
        } catch (e) {
            console.error(e);
        }
    }
    process.exit();
}
check();
