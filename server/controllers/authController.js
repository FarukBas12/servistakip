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

        // Normal Login Flow
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

exports.getMe = async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT id, username, role, full_name, photo_url, phone, start_date, job_title FROM users WHERE id = $1',
            [req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

exports.getUsers = async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT id, username, role, full_name, photo_url, phone, start_date, status, job_title, last_lat, last_lng, last_location_update
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
    const { username, password, role, full_name, phone, start_date, photo_url, job_title } = req.body;
    try {
        // Check if user exists
        const userCheck = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Date check: If start_date exists and not empty, use it. Else use null or today? 
        // User says "only saves today's date", let's ensure it uses the provided date.
        const effectiveDate = (start_date && start_date !== '') ? start_date : new Date();

        const { rows } = await db.query(
            `INSERT INTO users (username, password_hash, role, full_name, phone, start_date, photo_url, status, job_title) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8) 
             RETURNING id, username, role, full_name, photo_url, phone, start_date, status, job_title`,
            [username, hashedPassword, role, full_name || null, phone || null, effectiveDate, photo_url || null, job_title || null]
        );

        res.json(rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { full_name, phone, role, status, photo_url, password, job_title, start_date } = req.body;

    try {
        let updateFields = [];
        let values = [];
        let paramCount = 1;

        if (full_name !== undefined) { updateFields.push(`full_name = $${paramCount++}`); values.push(full_name); }
        if (phone !== undefined) { updateFields.push(`phone = $${paramCount++}`); values.push(phone); }
        if (role !== undefined) { updateFields.push(`role = $${paramCount++}`); values.push(role); }
        if (status !== undefined) { updateFields.push(`status = $${paramCount++}`); values.push(status); }
        if (photo_url !== undefined) { updateFields.push(`photo_url = $${paramCount++}`); values.push(photo_url); }
        if (job_title !== undefined) { updateFields.push(`job_title = $${paramCount++}`); values.push(job_title); }
        if (start_date !== undefined) { updateFields.push(`start_date = $${paramCount++}`); values.push(start_date || null); }

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
        const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING id, username, role, full_name, photo_url, phone, start_date, status, job_title`;

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

exports.updateLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body;
        const userId = req.user.id;
        
        await db.query(
            'UPDATE users SET last_lat = $1, last_lng = $2, last_location_update = CURRENT_TIMESTAMP WHERE id = $3',
            [lat, lng, userId]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).send('Location update failed');
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
            ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title VARCHAR(100);
            ALTER TABLE users ADD COLUMN IF NOT EXISTS last_lat NUMERIC;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS last_lng NUMERIC;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        `);
        res.json({ message: 'Migration complete' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Migration Error: ' + err.message);
    }
};
