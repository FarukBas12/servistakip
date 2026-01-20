const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Get all materials
router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM materials ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Add a material
router.post('/', auth, async (req, res) => {
    const { name, unit, price, category } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO materials (name, unit, price, category) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, unit, price, category]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete a material
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM materials WHERE id = $1', [id]);
        res.json({ message: 'Material deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
