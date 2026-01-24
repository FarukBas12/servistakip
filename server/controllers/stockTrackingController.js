const db = require('../db');
const xlsx = require('xlsx'); // Import xlsx library

// Get All Stocks
exports.getStocks = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM stocks ORDER BY name');
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error: ' + err.message });
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
        res.status(500).json({ message: 'Server Error: ' + err.message });
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

// Bulk Import Logic
exports.bulkImport = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Lütfen bir Excel dosyası yükleyin.' });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (rows.length === 0) {
            return res.status(400).json({ message: 'Dosya boş.' });
        }

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');
            let addedCount = 0;

            for (const row of rows) {
                // Map Excel Columns -> DB Columns
                // Expecting: "Ürün Adı", "Kategori", "Miktar", "Birim", "Kritik"
                const name = row['Ürün Adı'] || row['Stok Adı'] || row['Urun Adi'];
                if (!name) continue; // Skip invalid rows

                const category = row['Kategori'] || 'Genel';
                const quantity = parseFloat(row['Miktar']) || 0;
                const unit = row['Birim'] || 'Adet';
                const critical_level = parseFloat(row['Kritik']) || parseFloat(row['Kritik Seviye']) || 5;

                // Check existence first to avoid duplicate errors or decide update logic
                const check = await client.query('SELECT id FROM stocks WHERE name = $1', [name]);

                if (check.rows.length === 0) {
                    await client.query(`
                        INSERT INTO stocks (name, category, quantity, unit, critical_level)
                        VALUES ($1, $2, $3, $4, $5)
                    `, [name, category, quantity, unit, critical_level]);
                    addedCount++;
                } else {
                    // Start Update quantity if needed? For now just skip or maybe update params.
                    // Let's just update info (critical level, category), NOT quantity to avoid messing up tracking.
                    await client.query(`
                        UPDATE stocks SET category = $2, critical_level = $3
                        WHERE id = $1
                    `, [check.rows[0].id, category, critical_level]);
                }
            }

            await client.query('COMMIT');
            res.json({ message: `${addedCount} yeni ürün eklendi. Mevcut ürünlerin bilgileri güncellendi.` });

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Import Hatası: ' + err.message });
    }
};
