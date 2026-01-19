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
        const { stores } = req.body; // Array of {code, name, address}
        const results = [];

        // Handling bulk insert usually done with a single query, but loop is safer for simple error handling per row if needed.
        // For speed, let's do a transaction or individual inserts.
        // Let's do individual for simplicity and error logging, but ignore duplicates (ON CONFLICT DO NOTHING)

        for (const store of stores) {
            if (!store.code || !store.name) continue;

            await db.query(
                'INSERT INTO stores (code, name, address) VALUES ($1, $2, $3) ON CONFLICT (code) DO UPDATE SET name = $2, address = $3',
                [store.code, store.name, store.address]
            );
        }

        res.json({ message: 'Success' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
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
