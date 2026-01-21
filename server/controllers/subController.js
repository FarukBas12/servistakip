const db = require('../db');
const XLSX = require('xlsx');

// --- SUBCONTRACTORS ---
exports.listSubs = async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT s.*, 
            (COALESCE((SELECT SUM(total_amount) FROM payments WHERE subcontractor_id = s.id AND status != 'cancelled'), 0) - 
             COALESCE((SELECT SUM(amount) FROM cash_transactions WHERE subcontractor_id = s.id), 0)) as balance
            FROM subcontractors s ORDER BY s.name
        `);
        res.json(rows);
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.createSub = async (req, res) => {
    try {
        const { name, phone } = req.body;
        const { rows } = await db.query('INSERT INTO subcontractors (name, phone) VALUES ($1, $2) RETURNING *', [name, phone]);
        res.json(rows[0]);
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.updateSub = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone } = req.body;
        await db.query('UPDATE subcontractors SET name = $1, phone = $2 WHERE id = $3', [name, phone, id]);
        res.json({ message: 'Updated' });
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

// --- CASH TRANSACTIONS ---
exports.addCash = async (req, res) => {
    try {
        const { subcontractor_id, amount, description, transaction_date } = req.body;
        await db.query('INSERT INTO cash_transactions (subcontractor_id, amount, description, transaction_date) VALUES ($1, $2, $3, $4)',
            [subcontractor_id, amount, description, transaction_date]);
        res.json({ message: 'Saved' });
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

// --- PRICE DEFINITIONS ---
exports.listPrices = async (req, res) => {
    try {
        const { subId } = req.query;
        const { rows } = await db.query('SELECT * FROM price_definitions WHERE subcontractor_id = $1 ORDER BY work_item', [subId]);
        res.json(rows);
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.importPrices = async (req, res) => {
    try {
        if (!req.file) return res.status(400).send('No file');
        const { subId } = req.body;
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        for (const row of data) {
            const item = row['İş Kalemi'] || row['Kalem'] || row['item'];
            const price = row['Birim Fiyat'] || row['Fiyat'] || 0;
            if (item) {
                await db.query(`
                    INSERT INTO price_definitions (subcontractor_id, work_item, unit_price) 
                    VALUES ($1, $2, $3)`, [subId, item, price]);
            }
        }
        res.json({ message: 'Imported' });
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.addPrice = async (req, res) => {
    try { // Manual add
        const { subId, work_item, unit_price } = req.body;
        await db.query('INSERT INTO price_definitions (subcontractor_id, work_item, unit_price) VALUES ($1, $2, $3)', [subId, work_item, unit_price]);
        res.json({ message: 'Added' });
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

// --- PAYMENTS (HAKEDİŞ) ---
exports.createPayment = async (req, res) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const { subcontractor_id, title, store_name, waybill_info, payment_date, items } = req.body;

        // Calculate total
        const total = items.reduce((acc, item) => acc + (parseFloat(item.quantity) * parseFloat(item.unit_price)), 0);

        const resHeader = await client.query(`
            INSERT INTO payments (subcontractor_id, title, store_name, waybill_info, payment_date, total_amount, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING id`,
            [subcontractor_id, title, store_name, waybill_info, payment_date, total]
        );
        const paymentId = resHeader.rows[0].id;

        for (const item of items) {
            await client.query(`
                INSERT INTO payment_items (payment_id, work_item, quantity, unit_price, total_price)
                VALUES ($1, $2, $3, $4, $5)`,
                [paymentId, item.work_item, item.quantity, item.unit_price, (item.quantity * item.unit_price)]
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Payment Created' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).send('Server Error');
    } finally {
        client.release();
    }
};

exports.getLedger = async (req, res) => {
    try {
        const { id } = req.params;
        // Fetch Payments (Credit)
        const paymentsRes = await db.query(`
            SELECT id, title as description, total_amount as amount, payment_date as date, 'hakedis' as type 
            FROM payments WHERE subcontractor_id = $1 AND status != 'cancelled'
        `, [id]);

        // Fetch Cash Transactions (Debit)
        const cashRes = await db.query(`
            SELECT id, description, amount, transaction_date as date, 'odeme' as type 
            FROM cash_transactions WHERE subcontractor_id = $1
        `, [id]);

        // Combine and Sort
        const all = [...paymentsRes.rows, ...cashRes.rows].sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json(all);
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};
