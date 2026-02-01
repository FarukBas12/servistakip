
const db = require('../db');

exports.getRegions = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM regions ORDER BY id');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.addRegion = async (req, res) => {
    const { name } = req.body;
    try {
        if (!name) return res.status(400).json({ message: 'Name is required' });

        const { rows } = await db.query('INSERT INTO regions (name) VALUES ($1) RETURNING *', [name]);
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteRegion = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM regions WHERE id = $1', [id]);
        res.json({ message: 'Region deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
