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
            return res.status(400).json({ message: 'Dosya boş veya okunabilir veri içermiyor.' });
        }

        // Helper: Normalize string (lowercase, remove spaces and turkish chars)
        const normalize = (str) => {
            if (!str) return '';
            return str.toString().toLowerCase()
                .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
                .replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ö/g, 'o')
                .replace(/ç/g, 'c').replace(/\s+/g, '');
        };

        // Find keys in the first row to determine mapping
        const fileKeys = Object.keys(rows[0]);
        const normalizedKeys = fileKeys.reduce((acc, key) => {
            acc[normalize(key)] = key; // map normalized -> pointer to original key
            return acc;
        }, {});

        // Define possible aliases for each target field
        const mapField = (aliases) => {
            for (const alias of aliases) {
                const nAlias = normalize(alias);
                if (normalizedKeys[nAlias]) return normalizedKeys[nAlias];
            }
            return null;
        };

        const keyName = mapField(['Ürün Adı', 'Urun Adi', 'Stok Adı', 'Stok Ismi', 'Name', 'Malzeme']);
        const keyCategory = mapField(['Kategori', 'Category', 'Tur', 'Cins']);
        const keyQuantity = mapField(['Miktar', 'Adet', 'Sayi', 'Quantity']);
        const keyUnit = mapField(['Birim', 'Unit', 'Olcu']);
        const keyCritical = mapField(['Kritik', 'Kritik Seviye', 'Uyarı', 'Limit', 'Critical']);

        // Debug: If main key is missing, fail early
        if (!keyName) {
            return res.status(400).json({
                message: `Hata: 'Ürün Adı' sütunu bulunamadı. Dosyanızdaki sütunlar: ${fileKeys.join(', ')}`
            });
        }

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');
            let addedCount = 0;
            let updatedCount = 0;

            for (const row of rows) {
                const name = row[keyName];
                if (!name) continue;

                const category = keyCategory ? (row[keyCategory] || 'Genel') : 'Genel';
                const quantity = keyQuantity ? (parseFloat(row[keyQuantity]) || 0) : 0;
                const unit = keyUnit ? (row[keyUnit] || 'Adet') : 'Adet';
                const critical_level = keyCritical ? (parseFloat(row[keyCritical]) || 5) : 5;

                // Check existence
                const check = await client.query('SELECT id FROM stocks WHERE name = $1', [name]);

                if (check.rows.length === 0) {
                    await client.query(`
                        INSERT INTO stocks (name, category, quantity, unit, critical_level)
                        VALUES ($1, $2, $3, $4, $5)
                    `, [name, category, quantity, unit, critical_level]);
                    addedCount++;
                } else {
                    // Update info but ADD quantity
                    // Strategy: If user uploads excel, maybe they are adding stock OR setting initial stock.
                    // For safety, let's UPDATE params and ADD quantity if > 0
                    await client.query(`
                        UPDATE stocks SET 
                            category = $2, 
                            critical_level = $3,
                            quantity = quantity + $4 
                        WHERE id = $1
                    `, [check.rows[0].id, category, critical_level, quantity]); // Add quantity!
                    updatedCount++;
                }
            }

            await client.query('COMMIT');
            res.json({
                message: `İşlem Başarılı!\n${addedCount} yeni ürün eklendi.\n${updatedCount} mevcut ürün güncellendi (miktarlar eklendi).`
            });

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
