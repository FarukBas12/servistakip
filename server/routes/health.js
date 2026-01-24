const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
    try {
        const tableCheck = await db.query("SELECT to_regclass('public.stocks') as table_exists");
        let rowCount = 0;
        if (tableCheck.rows[0].table_exists) {
            const countRes = await db.query('SELECT count(*) FROM stocks');
            rowCount = countRes.rows[0].count;
        }
        res.json({
            status: 'online',
            serverTime: new Date().toISOString(),
            dbStatus: 'connected',
            tableExists: !!tableCheck.rows[0].table_exists,
            rowCount: rowCount
        });
    } catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
    }
});

module.exports = router;
