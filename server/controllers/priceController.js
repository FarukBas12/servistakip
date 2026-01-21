const db = require('../db');

// List (Search or All)
exports.list = async (req, res) => {
    const { q } = req.query; // Search query
    try {
        let query = 'SELECT * FROM price_definitions';
        const params = [];

        if (q) {
            query += ' WHERE work_item ILIKE $1 ORDER BY work_item LIMIT 20';
            params.push(`%${q}%`);
        } else {
            query += ' ORDER BY work_item'; // Might want limit for performance if large
        }

        const { rows } = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Import / Bulk Create
exports.importPrices = async (req, res) => {
    const { items } = req.body; // Array of { work_item, detail, unit_price }
    const client = await db.pool.connect();

    try {
        if (!items || !Array.isArray(items)) return res.status(400).json({ message: 'Invalid data' });

        await client.query('BEGIN');

        // Strategy: We can delete all and replace, OR upsert.
        // For simplicity and "Master List" nature, let's Upsert based on Work Item? 
        // Or just Insert. Let's do simple Insert, user can clear list if needed (future).
        // Actually, user might upload same file again. 
        // Let's check if exists, update price. Else insert.

        for (const item of items) {
            const { work_item, detail, unit_price } = item;
            if (!work_item) continue;

            // Upsert Logic (Postgres 9.5+)
            // Check if exists
            const check = await client.query('SELECT id FROM price_definitions WHERE work_item = $1', [work_item]);

            if (check.rows.length > 0) {
                // Update
                await client.query(
                    'UPDATE price_definitions SET unit_price = $1, detail = $2 WHERE id = $3',
                    [unit_price, detail, check.rows[0].id]
                );
            } else {
                // Insert
                await client.query(
                    'INSERT INTO price_definitions (work_item, detail, unit_price) VALUES ($1, $2, $3)',
                    [work_item, detail, unit_price]
                );
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Prices imported successfully' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Import failed' });
    } finally {
        client.release();
    }
};

exports.delete = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM price_definitions WHERE id = $1', [id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error' });
    }
};
