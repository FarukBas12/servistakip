const db = require('../db');

// Get all payments (Pool)
exports.getPayments = async (req, res) => {
    try {
        // Enriched query to be added later if needed
        const { rows } = await db.query('SELECT * FROM payments ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get Single Payment with Items
exports.getPaymentById = async (req, res) => {
    const { id } = req.params;
    try {
        const paymentRes = await db.query('SELECT * FROM payments WHERE id = $1', [id]);
        if (paymentRes.rows.length === 0) return res.status(404).json({ message: 'Payment not found' });

        const itemsRes = await db.query('SELECT * FROM payment_items WHERE payment_id = $1 ORDER BY id ASC', [id]);

        const payment = paymentRes.rows[0];
        payment.items = itemsRes.rows;

        res.json(payment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create New Payment (Header + Items)
exports.createPayment = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { title, payment_date, items } = req.body;
        // Items: [{ work_item, detail, quantity, unit_price }]

        await client.query('BEGIN');

        // 1. Create Header
        const paymentRes = await client.query(
            'INSERT INTO payments (title, payment_date, total_amount, status) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, payment_date, 0, 'pending']
        );
        const paymentId = paymentRes.rows[0].id;
        let grandTotal = 0;

        // 2. Insert Items
        if (items && Array.isArray(items)) {
            for (const item of items) {
                const qty = parseFloat(item.quantity) || 0;
                const price = parseFloat(item.unit_price) || 0;
                const total = qty * price;
                grandTotal += total;

                await client.query(
                    'INSERT INTO payment_items (payment_id, work_item, detail, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6)',
                    [paymentId, item.work_item, item.detail || '', qty, price, total]
                );
            }
        }

        // 3. Update Grand Total
        await client.query('UPDATE payments SET total_amount = $1 WHERE id = $2', [grandTotal, paymentId]);

        await client.query('COMMIT');
        res.status(201).json({ message: 'Payment created', id: paymentId });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Creation failed' });
    } finally {
        client.release();
    }
};

// Toggle Status (Pending <-> Paid)
exports.toggleStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query('SELECT status FROM payments WHERE id = $1', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Not found' });

        const newStatus = rows[0].status === 'paid' ? 'pending' : 'paid';
        await db.query('UPDATE payments SET status = $1 WHERE id = $2', [newStatus, id]);

        res.json({ message: 'Status updated', status: newStatus });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete Payment
exports.deletePayment = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM payments WHERE id = $1', [id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
