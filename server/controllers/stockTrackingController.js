const db = require('../db');

// Get All Stocks
exports.getStocks = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM stocks ORDER BY name');
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Create New Stock Item
exports.createStock = async (req, res) => {
    try {
        const { name, unit, quantity, critical_level, category } = req.body;

        // Check if exists
        const check = await db.query('SELECT * FROM stocks WHERE name = $1', [name]);
        if (check.rows.length > 0) {
            return res.status(400).json({ message: 'Bu isimde bir stok zaten mevcut.' });
        }

        const { rows } = await db.query(
            'INSERT INTO stocks (name, unit, quantity, critical_level, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, unit || 'Adet', quantity || 0, critical_level || 0, category || 'Genel']
        );
        res.json(rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Update Stock Info
exports.updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, unit, critical_level, category } = req.body;

        const { rows } = await db.query(
            'UPDATE stocks SET name = $1, unit = $2, critical_level = $3, category = $4 WHERE id = $5 RETURNING *',
            [name, unit, critical_level, category, id]
        );
        res.json(rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Delete Stock
exports.deleteStock = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM stocks WHERE id = $1', [id]);
        res.json({ message: 'Stok silindi.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Add Transaction (Giriş/Çıkış)
exports.addTransaction = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { stock_id, type, quantity, project_id, description } = req.body;
        const user_id = req.user.id;
        const amount = parseFloat(quantity);

        if (amount <= 0) return res.status(400).json({ message: 'Miktar 0 dan büyük olmalı.' });

        await client.query('BEGIN');

        // 1. Record Transaction
        await client.query(
            `INSERT INTO stock_transactions (stock_id, user_id, type, quantity, project_id, description) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [stock_id, user_id, type, amount, project_id || null, description]
        );

        // 2. Update Stock Quantity
        let quantityChange = type === 'in' ? amount : -amount;

        const updateRes = await client.query(
            'UPDATE stocks SET quantity = quantity + $1 WHERE id = $2 RETURNING *',
            [quantityChange, stock_id]
        );

        if (updateRes.rows[0].quantity < 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Yetersiz stok!' });
        }

        await client.query('COMMIT');

        // Return updated stock
        res.json(updateRes.rows[0]);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send('Server Error');
    } finally {
        client.release();
    }
};

// Get Single Stock History
exports.getStockHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await db.query(
            `SELECT st.*, u.username, p.name as project_name 
             FROM stock_transactions st
             LEFT JOIN users u ON st.user_id = u.id
             LEFT JOIN projects p ON st.project_id = p.id
             WHERE st.stock_id = $1 
             ORDER BY st.transaction_date DESC`,
            [id]
        );
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
