const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/stores', require('./routes/stores'));

// Static Folder for Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.send('Field Service API Running');
});

// Ensure Uploads Directory Exists
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// WEB SETUP & REPAIR ROUTE
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

app.get('/setup', async (req, res) => {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        // 1. Run Schema (Create Tables)
        const sql = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf8');
        await pool.query(sql);

        // 1.5 FIX SCHEMA (Add missing columns if they don't exist)
        try {
            await pool.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS maps_link TEXT");
            await pool.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS region VARCHAR(50) DEFAULT 'Diğer'");
            await pool.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS lat FLOAT");
            await pool.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS lng FLOAT");

            // Create Photos Table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS photos (
                    id SERIAL PRIMARY KEY,
                    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
                    url TEXT NOT NULL,
                    type VARCHAR(50),
                    gps_lat FLOAT,
                    gps_lng FLOAT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Create Stores Table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS stores (
                    id SERIAL PRIMARY KEY,
                    code VARCHAR(50) UNIQUE NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    address TEXT NOT NULL
                );
            `);
        } catch (e) {
            console.log('Schema update error:', e.message);
        }

        // 2. Force Reset Admin Password (Server-Side Hash)
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('123456', salt);

        // Upsert Admin User
        await pool.query(`
            INSERT INTO users (username, password_hash, role) 
            VALUES ('admin', $1, 'admin')
            ON CONFLICT (username) DO UPDATE 
            SET password_hash = $1
        `, [hash]);

        res.send('<h1>✅ TAMIR EDILDI!</h1><p>Admin sifresi <b>sunucu tarafinda</b> yeniden 123456 olarak ayarlandi.</p><p>Simdi giris yapabilirsiniz.</p>');
    } catch (err) {
        res.send('<h1>❌ HATA</h1><pre>' + err.message + '</pre>');
    } finally {
        await pool.end();
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// AUTO MIGRATION FUNCTION
async function runMigrations() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    console.log('🔄 Checking Database Schema...');

    try {
        await pool.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS maps_link TEXT");
        console.log(' - Checked maps_link');

        await pool.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS region VARCHAR(50) DEFAULT 'Diğer'");
        console.log(' - Checked region');

        await pool.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS lat FLOAT");
        console.log(' - Checked lat');

        await pool.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS lng FLOAT");
        console.log(' - Checked lng');

        // Create Photos Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS photos (
                id SERIAL PRIMARY KEY,
                task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
                url TEXT NOT NULL,
                type VARCHAR(50),
                gps_lat FLOAT,
                gps_lng FLOAT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log(' - Checked photos table');

        // FIX: Drop restrictive Check Constraint on photos type if exists
        try {
            await pool.query('ALTER TABLE photos DROP CONSTRAINT IF EXISTS photos_type_check');
            console.log(' - Dropped constraint photos_type_check');
        } catch (e) {
            // Ignore error
        }

        // Create Stores Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS stores (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                address TEXT NOT NULL
            );
        `);
        console.log(' - Checked stores table');

        console.log('✅ Database Schema Verified & Updated!');
    } catch (e) {
        console.error('❌ Schema update error:', e.message);
    } finally {
        await pool.end();
    }
}

// Start Server AFTER Migrations
runMigrations().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
