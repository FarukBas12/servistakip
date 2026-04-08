const db = require('../db');
const webpush = require('web-push');

// Web-Push Configuration
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        `mailto:${process.env.VAPID_EMAIL || 'admin@servistakip.com'}`,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

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

// Subscribe to push notifications
exports.subscribe = async (req, res) => {
    try {
        const userId = req.user.id;
        const { subscription } = req.body;

        // Her kullanıcının sadece bir aboneliğini mi tutalım? 
        // Genelde birden fazla cihazı olabilir. Biz son aboneliğini güncelleyelim veya ekleyelim.
        // Şimdilik basitleştirmek için: Varsa güncelle, yoksa ekle.
        await db.query(
            `INSERT INTO push_subscriptions (user_id, subscription_data) 
             VALUES ($1, $2)
             ON CONFLICT (user_id) DO UPDATE SET subscription_data = $2`,
            [userId, JSON.stringify(subscription)]
        );

        res.status(201).json({ message: 'Subscribed successfully' });
    } catch (err) {
        console.error('Subscription error:', err.message);
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

// INTERNAL FUNCTION: Create a notification and send PUSH
exports.createNotification = async (userId, message, type = 'info') => {
    try {
        // 1. Save to DB
        await db.query(
            `INSERT INTO notifications (user_id, message, type) 
             VALUES ($1, $2, $3)`,
            [userId, message, type]
        );

        // 2. Send Push Notification if subscription exists
        const { rows } = await db.query(
            'SELECT subscription_data FROM push_subscriptions WHERE user_id = $1',
            [userId]
        );

        if (rows.length > 0) {
            const subscription = JSON.parse(rows[0].subscription_data);
            const payload = JSON.stringify({
                title: 'M-Tech Servis',
                body: message,
                icon: '/logo.svg'
            });

            await webpush.sendNotification(subscription, payload).catch(err => {
                console.error('Push notification failed:', err.message);
                if (err.statusCode === 410) {
                    // Subscription expired, remove it?
                    db.query('DELETE FROM push_subscriptions WHERE user_id = $1', [userId]);
                }
            });
        }
    } catch (err) {
        console.error('Notification Error:', err.message);
    }
};
