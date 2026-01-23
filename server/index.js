const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
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
app.use('/api/subs', require('./routes/subs')); // Unified Route


// Static Folder for Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
        console.error('SETUP ERROR:', err);
        res.send(`
            <h1>❌ HATA</h1>
            <p><strong>Message:</strong> ${err.message}</p>
            <p><strong>Stack:</strong></p>
            <pre>${err.stack}</pre>
        `);
    } finally {
        await pool.end();
    }
});

app.get('/', (req, res) => {
    res.send('Field Service API Running');
});

// Ensure Uploads Directory Exists
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
const db = require('./db');

async function runMigrations() {
    console.log('🔄 Checking Database Schema...');

    try {
        await db.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS maps_link TEXT");
        console.log(' - Checked maps_link');

        await db.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS region VARCHAR(50) DEFAULT 'Diğer'");
        console.log(' - Checked region');

        await db.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS lat FLOAT");
        console.log(' - Checked lat');

        await db.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS lng FLOAT");
        console.log(' - Checked lng');

        await db.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS service_form_no TEXT");
        await db.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_quoted BOOLEAN DEFAULT FALSE");
        console.log(' - Checked service form columns');

        // Create Photos Table
        await db.query(`
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
            await db.query('ALTER TABLE photos DROP CONSTRAINT IF EXISTS photos_type_check');
            console.log(' - Dropped constraint photos_type_check');
        } catch (e) {
            // Ignore error
        }

        // Create Stores Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS stores (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                address TEXT NOT NULL
            );
        `);
        console.log(' - Checked stores table');

        // Create Task Logs Table (For Return System)
        await db.query(`
            CREATE TABLE IF NOT EXISTS task_logs (
                id SERIAL PRIMARY KEY,
                task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id),
                action VARCHAR(50) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log(' - Checked task_logs table');

        // Create Subcontractors Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS subcontractors (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                phone VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log(' - Checked subcontractors table');

        // Create Price Definitions Table (Master List)
        await db.query(`
            CREATE TABLE IF NOT EXISTS price_definitions (
                id SERIAL PRIMARY KEY,
                subcontractor_id INTEGER REFERENCES subcontractors(id) ON DELETE CASCADE,
                work_item VARCHAR(255) NOT NULL,
                detail VARCHAR(255),
                unit_price NUMERIC(12, 2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log(' - Checked price_definitions table');

        // Create Payments Table (Hakediş Header)
        await db.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                subcontractor_id INTEGER REFERENCES subcontractors(id) ON DELETE SET NULL,
                title VARCHAR(150),
                store_name VARCHAR(150),
                waybill_info TEXT, 
                payment_date DATE,
                total_amount NUMERIC(12, 2) DEFAULT 0,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log(' - Checked payments table');

        // Add columns if missing (for updates)
        await db.query("ALTER TABLE payments ADD COLUMN IF NOT EXISTS store_name VARCHAR(150)");
        await db.query("ALTER TABLE payments ADD COLUMN IF NOT EXISTS waybill_info TEXT");
        await db.query("ALTER TABLE payments ADD COLUMN IF NOT EXISTS waybill_image TEXT"); // New Column for Photo URL

        // Create Payment Items Table (Hakediş Rows)
        await db.query(`
            CREATE TABLE IF NOT EXISTS payment_items (
                id SERIAL PRIMARY KEY,
                payment_id INTEGER REFERENCES payments(id) ON DELETE CASCADE,
                work_item VARCHAR(255),
                detail VARCHAR(255),
                quantity NUMERIC(10, 2),
                unit_price NUMERIC(12, 2),
                total_price NUMERIC(12, 2)
            );
        `);
        console.log(' - Checked payment_items table');

        // Create Cash Transactions Table (Ödemeler)
        await db.query(`
            CREATE TABLE IF NOT EXISTS cash_transactions (
                id SERIAL PRIMARY KEY,
                subcontractor_id INTEGER REFERENCES subcontractors(id) ON DELETE CASCADE,
                amount NUMERIC(12, 2) NOT NULL,
                transaction_date DATE DEFAULT CURRENT_DATE,
                description VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log(' - Checked cash_transactions table');

        // Create App Settings Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS app_settings (
                id SERIAL PRIMARY KEY,
                delete_password VARCHAR(255) DEFAULT '123456'
            );
        `);
        // Ensure one row exists
        await db.query("INSERT INTO app_settings (id, delete_password) VALUES (1, '123456') ON CONFLICT (id) DO NOTHING");
        console.log(' - Checked app_settings table');

        console.log('✅ Database Schema Verified & Updated!');
    } catch (e) {
        console.error('❌ Schema update error:', e.message);
    }
}

// Start Server AFTER Migrations
runMigrations().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
