const db = require('../db');

// Get generic notifications for the logged-in user
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query(
            `SELECT * FROM notifications 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT 50`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Mark a specific notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await db.query(
            `UPDATE notifications 
             SET is_read = TRUE 
             WHERE id = $1 AND user_id = $2 
             RETURNING *`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Notification not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Mark ALL notifications as read for the user
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await db.query(
            `UPDATE notifications 
             SET is_read = TRUE 
             WHERE user_id = $1`,
            [userId]
        );
        res.json({ msg: 'All marked as read' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// INTERNAL FUNCTION: Create a notification
exports.createNotification = async (userId, message, type = 'info') => {
    try {
        await db.query(
            `INSERT INTO notifications (user_id, message, type) 
             VALUES ($1, $2, $3)`,
            [userId, message, type]
        );
    } catch (err) {
        console.error('Notification Error:', err.message);
    }
};
