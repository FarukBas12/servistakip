const db = require('./db');
async function check() {
    try {
        const res = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'subcontractors'");
        console.log('Columns in subcontractors table:');
        console.log(res.rows.map(r => r.column_name));
    } catch (e) {
        console.error(e);
    }
    process.exit();
}
check();
