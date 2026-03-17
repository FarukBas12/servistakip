const db = require('../db');

exports.searchStore = async (req, res) => {
    try {
        const { code } = req.params;
        const { rows } = await db.query('SELECT * FROM stores WHERE code = $1', [code]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Mağaza bulunamadı.' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('searchStore error:', err);
        res.status(500).json({ message: 'Mağaza arama hatası.', error: err.message });
    }
};

exports.createStore = async (req, res) => {
    try {
        const { code, name, address } = req.body;
        const { rows } = await db.query(
            'INSERT INTO stores (code, name, address) VALUES ($1, $2, $3) RETURNING *',
            [code, name, address]
        );
        res.json(rows[0]);
    } catch (err) {
        console.error('createStore error:', err);
        res.status(500).json({ message: 'Mağaza kaydı oluşturulamadı.', error: err.message });
    }
};

exports.bulkCreateStores = async (req, res) => {
    try {
        const { stores } = req.body;
        if (!stores || stores.length === 0) return res.status(400).json({ message: 'Veri bulunamadı.' });

        const BATCH_SIZE = 500;

        for (let i = 0; i < stores.length; i += BATCH_SIZE) {
            const batch = stores.slice(i, i + BATCH_SIZE);
            const values = [];
            const placeholders = [];
            let counter = 1;

            batch.forEach(store => {
                if (store.code && store.name) {
                    values.push(store.code, store.name, store.address);
                    placeholders.push(`($${counter}, $${counter + 1}, $${counter + 2})`);
                    counter += 3;
                }
            });

            if (placeholders.length > 0) {
                const query = `
                    INSERT INTO stores (code, name, address) 
                    VALUES ${placeholders.join(', ')}
                    ON CONFLICT (code) DO UPDATE SET 
                        name = EXCLUDED.name, 
                        address = EXCLUDED.address
                `;
                await db.query(query, values);
            }
        }

        res.json({ message: 'Mağazalar başarıyla yüklendi.', count: stores.length });
    } catch (err) {
        console.error('bulkCreateStores error:', err);
        res.status(500).json({ message: 'Toplu mağaza aktarımı başarısız.', error: err.message });
    }
};

exports.getAllStores = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM stores ORDER BY code');
        res.json(rows);
    } catch (err) {
        console.error('getAllStores error:', err);
        res.status(500).json({ message: 'Mağaza listesi yüklenemedi.', error: err.message });
    }
};

exports.deleteStore = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM stores WHERE id = $1', [id]);
        res.json({ message: 'Mağaza silindi.' });
    } catch (err) {
        console.error('deleteStore error:', err);
        res.status(500).json({ message: 'Mağaza silinemedi.', error: err.message });
    }
};
