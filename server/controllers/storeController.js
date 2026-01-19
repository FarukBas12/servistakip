const db = require('../db');

exports.searchStore = async (req, res) => {
    try {
        const { code } = req.params;
        const { rows } = await db.query('SELECT * FROM stores WHERE code = $1', [code]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Store not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
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
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.bulkCreateStores = async (req, res) => {
    try {
        const { stores } = req.body;
        if (!stores || stores.length === 0) return res.status(400).json({ message: 'No data' });

        // Batch processing to avoid timeout and query limits
        const BATCH_SIZE = 500;

        for (let i = 0; i < stores.length; i += BATCH_SIZE) {
            const batch = stores.slice(i, i + BATCH_SIZE);

            // Construct dynamic query: INSERT INTO stores ... VALUES ($1,$2,$3), ($4,$5,$6) ...
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

        res.json({ message: 'Success', count: stores.length });
    } catch (err) {
        console.error('Bulk Import Error:', err.message);
        res.status(500).json({ message: err.message });
    }
};

exports.getAllStores = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM stores ORDER BY code');
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteStore = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM stores WHERE id = $1', [id]);
        res.json({ message: 'Store deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
