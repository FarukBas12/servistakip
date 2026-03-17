const db = require('../db');

// Get all payments (Pool)
exports.getPayments = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM payments ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error('getPayments error:', err);
        res.status(500).json({ message: 'Hakediş listesi yüklenemedi.', error: err.message });
    }
};

// Get Single Payment with Items
exports.getPaymentById = async (req, res) => {
    const { id } = req.params;
    try {
        const paymentRes = await db.query('SELECT * FROM payments WHERE id = $1', [id]);
        if (paymentRes.rows.length === 0) return res.status(404).json({ message: 'Hakediş bulunamadı.' });

        const itemsRes = await db.query('SELECT * FROM payment_items WHERE payment_id = $1 ORDER BY id ASC', [id]);

        const payment = paymentRes.rows[0];
        payment.items = itemsRes.rows;

        res.json(payment);
    } catch (err) {
        console.error('getPaymentById error:', err);
        res.status(500).json({ message: 'Hakediş detayları alınırken hata oluştu.', error: err.message });
    }
};

// Create New Payment (Header + Items)
exports.createPayment = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { title, payment_date, items, kdv_rate } = req.body;
        await client.query('BEGIN');

        const paymentRes = await client.query(
            'INSERT INTO payments (title, payment_date, total_amount, status, kdv_rate) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, payment_date, 0, 'pending', kdv_rate || 0]
        );
        const paymentId = paymentRes.rows[0].id;
        let subTotal = 0;

        if (items && Array.isArray(items)) {
            for (const item of items) {
                const qty = parseFloat(item.quantity) || 0;
                const price = parseFloat(item.unit_price) || 0;
                const total = qty * price;
                subTotal += total;

                await client.query(
                    'INSERT INTO payment_items (payment_id, work_item, detail, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6)',
                    [paymentId, item.work_item, item.detail || '', qty, price, total]
                );
            }
        }

        const vatRate = parseFloat(kdv_rate) || 0;
        const grandTotal = subTotal + (subTotal * vatRate / 100);

        await client.query('UPDATE payments SET total_amount = $1 WHERE id = $2', [grandTotal, paymentId]);

        await client.query('COMMIT');
        res.status(201).json({ message: 'Hakediş oluşturuldu.', id: paymentId });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('createPayment error:', err);
        res.status(500).json({ message: 'Hakediş oluşturulamadı.', error: err.message });
    } finally {
        client.release();
    }
};

// Toggle Status (Pending <-> Paid)
exports.toggleStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query('SELECT status FROM payments WHERE id = $1', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Hakediş bulunamadı.' });

        const newStatus = rows[0].status === 'paid' ? 'pending' : 'paid';
        await db.query('UPDATE payments SET status = $1 WHERE id = $2', [newStatus, id]);

        res.json({ message: 'Durum güncellendi.', status: newStatus });
    } catch (err) {
        console.error('toggleStatus error:', err);
        res.status(500).json({ message: 'Durum güncellenirken hata oluştu.', error: err.message });
    }
};

// Delete Payment
exports.deletePayment = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM payments WHERE id = $1', [id]);
        res.json({ message: 'Hakediş silindi.' });
    } catch (err) {
        console.error('deletePayment error:', err);
        res.status(500).json({ message: 'Hakediş silinemedi.', error: err.message });
    }
};
