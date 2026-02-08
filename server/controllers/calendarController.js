const db = require('../db');

exports.getNotes = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM calendar_notes ORDER BY date ASC, created_at ASC');
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.addNote = async (req, res) => {
    try {
        const { date, title, description, completed } = req.body;
        const { rows } = await db.query(
            'INSERT INTO calendar_notes (date, title, description, completed) VALUES ($1, $2, $3, $4) RETURNING *',
            [date, title, description || '', completed || false]
        );
        res.json(rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { completed } = req.body; // Only mainly updating status from UI currently
        const { rows } = await db.query(
            'UPDATE calendar_notes SET completed = $1 WHERE id = $2 RETURNING *',
            [completed, id]
        );
        res.json(rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM calendar_notes WHERE id = $1', [id]);
        res.json({ message: 'Note deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
