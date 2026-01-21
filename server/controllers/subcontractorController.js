const db = require('../db');

exports.list = async (req, res) => {
    try {
        // Fetch Subcontractors with Balance Calculation
        // Balance = (Total Hakediş) - (Total Cash Paid)
        const query = `
            SELECT 
                s.*,
                (
                    COALESCE((SELECT SUM(total_amount) FROM payments WHERE subcontractor_id = s.id), 0) 
                    - 
                    COALESCE((SELECT SUM(amount) FROM cash_transactions WHERE subcontractor_id = s.id), 0)
                ) as balance
            FROM subcontractors s
            ORDER BY s.name
        `;
        const { rows } = await db.query(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.create = async (req, res) => {
    const { name, phone } = req.body;
    try {
        const { rows } = await db.query(
            'INSERT INTO subcontractors (name, phone) VALUES ($1, $2) RETURNING *',
            [name, phone]
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
        await db.query('DELETE FROM subcontractors WHERE id = $1', [id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Deletion failed' });
    }
};

// Add Cash Payment (Ödeme Ekle)
exports.addTransaction = async (req, res) => {
    const { subcontractor_id, amount, description, date } = req.body;
    try {
        await db.query(
            'INSERT INTO cash_transactions (subcontractor_id, amount, description, transaction_date) VALUES ($1, $2, $3, $4)',
            [subcontractor_id, amount, description, date || new Date()]
        );
        res.status(201).json({ message: 'Transaction added' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error adding transaction' });
    }
};
