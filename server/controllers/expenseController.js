const db = require('../db');

exports.createExpense = async (req, res) => {
    try {
        const { amount, category, description, receipt_url } = req.body;
        const userId = req.user.id;

        const { rows } = await db.query(
            'INSERT INTO expenses (user_id, amount, category, description, receipt_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [userId, amount, category, description, receipt_url]
        );

        res.json(rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getExpenses = async (req, res) => {
    try {
        let query = `
            SELECT e.*, u.full_name, u.username, u.photo_url 
            FROM expenses e 
            JOIN users u ON e.user_id = u.id 
        `;
        let params = [];

        // If not admin, only show own expenses
        if (req.user.role !== 'admin') {
            query += ' WHERE e.user_id = $1 ';
            params.push(req.user.id);
        }

        query += ' ORDER BY e.created_at DESC ';

        const { rows } = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateExpenseStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // approved, rejected

        const { rows } = await db.query(
            'UPDATE expenses SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        res.json(rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
