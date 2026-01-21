const db = require('../db');
const XLSX = require('xlsx');

exports.list = async (req, res) => {
    const { q, subId } = req.query; // Added subId support
    try {
        let query = 'SELECT * FROM price_definitions WHERE 1=1';
        const params = [];

        if (subId) {
            query += ' AND subcontractor_id = $1';
            params.push(subId);
        }

        if (q) {
            query += ` AND (work_item ILIKE $${params.length + 1})`;
            params.push(`%${q}%`);
        }

        query += ' ORDER BY work_item';

        const { rows } = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.create = async (req, res) => {
    const { work_item, detail, unit_price, subcontractor_id } = req.body;
    try {
        // Upsert based on (work_item, subcontractor_id) ideally, but for now simple insert/update
        // If subId is present, we scope it.
        const { rows } = await db.query(
            'INSERT INTO price_definitions (work_item, detail, unit_price, subcontractor_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [work_item, detail, unit_price || 0, subcontractor_id]
        );
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Creation failed' });
    }
};

exports.delete = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM price_definitions WHERE id = $1', [id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Deletion failed' });
    }
};

exports.importPrices = async (req, res) => {
    try {
        if (!req.file) return res.status(400).send('No file uploaded');
        const { subId } = req.body; // Target Subcontractor

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        for (const row of data) {
            const workItem = row['İş Kalemi'] || row['Kalem'] || row['Is Kalemi'];
            const detail = row['Detay'] || '';
            const price = row['Birim Fiyat'] || row['Fiyat'] || 0;

            if (workItem) {
                // If subId provided, insert specifically for them
                if (subId) {
                    await db.query(
                        `INSERT INTO price_definitions (work_item, detail, unit_price, subcontractor_id)
                         VALUES ($1, $2, $3, $4)
                         ON CONFLICT (id) DO NOTHING`, // TODO: Better conflict handling? For now, just insert.
                        [workItem, detail, price, subId]
                    );
                } else {
                    // Global (Old behavior - keep for compatibility if needed, or disable)
                    await db.query(
                        `INSERT INTO price_definitions (work_item, detail, unit_price)
                         VALUES ($1, $2, $3)
                         ON CONFLICT (id) DO NOTHING`,
                        [workItem, detail, price]
                    );
                }
            }
        }

        res.json({ message: 'Import successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Import failed' });
    }
};
