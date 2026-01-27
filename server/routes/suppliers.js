const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/suppliers - List all
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM suppliers ORDER BY company_name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /api/suppliers - Create
router.post('/', async (req, res) => {
    const { company_name, contact_name, email, phone, supply_items } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO suppliers (company_name, contact_name, email, phone, supply_items) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [company_name, contact_name, email, phone, supply_items]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// PUT /api/suppliers/:id - Update
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { company_name, contact_name, email, phone, supply_items } = req.body;
    try {
        const result = await db.query(
            'UPDATE suppliers SET company_name = $1, contact_name = $2, email = $3, phone = $4, supply_items = $5 WHERE id = $6 RETURNING *',
            [company_name, contact_name, email, phone, supply_items, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// DELETE /api/suppliers/:id - Delete
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM suppliers WHERE id = $1', [id]);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
