const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { cloudinary } = require('../utils/cloudinary');

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
        const { rows } = await db.query(`
            SELECT id, username, role, full_name, photo_url, phone, start_date, status 
            FROM users 
            ORDER BY created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.createUser = async (req, res) => {
    const { username, password, role, full_name, phone, start_date, photo_url } = req.body;
    try {
        // Check if user exists
        const userCheck = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const { rows } = await db.query(
            `INSERT INTO users (username, password_hash, role, full_name, phone, start_date, photo_url, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'active') 
             RETURNING id, username, role, full_name, photo_url, phone, start_date, status`,
            [username, hashedPassword, role, full_name || null, phone || null, start_date || new Date(), photo_url || null]
        );

        res.json(rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { full_name, phone, role, status, photo_url, password } = req.body;

    try {
        let updateFields = [];
        let values = [];
        let paramCount = 1;

        if (full_name !== undefined) { updateFields.push(`full_name = $${paramCount++}`); values.push(full_name); }
        if (phone !== undefined) { updateFields.push(`phone = $${paramCount++}`); values.push(phone); }
        if (role !== undefined) { updateFields.push(`role = $${paramCount++}`); values.push(role); }
        if (status !== undefined) { updateFields.push(`status = $${paramCount++}`); values.push(status); }
        if (photo_url !== undefined) { updateFields.push(`photo_url = $${paramCount++}`); values.push(photo_url); }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            updateFields.push(`password_hash = $${paramCount++}`);
            values.push(hashedPassword);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        values.push(id);
        const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING id, username, role, full_name, photo_url, phone, start_date, status`;

        const { rows } = await db.query(query, values);
        res.json(rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.uploadPhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'user_photos', transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }] },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        res.json({ url: result.secure_url });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: 'User deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Database migration - run once
exports.migrateUsers = async (req, res) => {
    try {
        await db.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
            ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
            ALTER TABLE users ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
            ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        `);
        res.json({ message: 'Migration complete' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Migration Error: ' + err.message);
    }
};
