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

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist'), {
    setHeaders: (res, path) => {
        if (path.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/subcontractors', require('./routes/subcontractors'));
app.use('/api/definitions', require('./routes/definitions'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/payments', require('./routes/payments')); // Add this line
app.use('/api/subs', require('./routes/subs')); // Add this line

// Version Endpoint for Debugging
app.get('/api/version', (req, res) => {
    res.json({ timestamp: new Date().toISOString(), version: '1.0.1-fix-cache' });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Static Folder for Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// WEB SETUP & REPAIR ROUTE
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

app.get('/setup', async (req, res) => {
    // SECURITY CHECK
    if (req.query.key !== 'tamir123') {
        return res.status(403).send('<h1>⛔ Erişim Engellendi</h1><p>Bu sayfaya erişim yetkiniz yok.</p>');
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        console.log('Starting setup...');

        // Hardcoded Schema to avoid FS issues
        const sql = `
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'technician')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                title VARCHAR(100) NOT NULL,
                description TEXT,
                address TEXT NOT NULL,
                maps_link TEXT,
                lat DECIMAL(9,6),
                lng DECIMAL(9,6),
                due_date TIMESTAMP,
                status VARCHAR(20) DEFAULT 'pending',
                assigned_to INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        await pool.query(sql);
        console.log('Tables created.');

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
        console.log('Admin user upserted.');

        res.send('<h1>✅ TAMIR EDILDI!</h1><p>Admin sifresi: 123456</p>');
    } catch (err) {
        console.error('SETUP ERROR:', err);
        res.status(500).send(`
            <div style="font-family: monospace; padding: 20px; background: #ffebee;">
                <h1>❌ HATA</h1>
                <h3>Message:</h3>
                <pre>${err.message}</pre>
                <h3>Stack:</h3>
                <pre>${err.stack}</pre>
            </div>
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

        // NEW: Create Task Assignments Table (Multi-Assign)
        await db.query(`
            CREATE TABLE IF NOT EXISTS task_assignments (
                task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (task_id, user_id)
            );
        `);
        console.log(' - Checked task_assignments table');

        // MIGRATION: If task_assignments is empty, verify if we need to migrate from old column
        const countRes = await db.query('SELECT COUNT(*) FROM task_assignments');
        if (parseInt(countRes.rows[0].count) === 0) {
            console.log(' - detailed migration check...');
            // Insert existing assignments
            await db.query(`
                INSERT INTO task_assignments (task_id, user_id)
                SELECT id, assigned_to FROM tasks 
                WHERE assigned_to IS NOT NULL
                ON CONFLICT DO NOTHING
             `);
            console.log(' - Migrated old assignments to task_assignments table');
        }

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

        // NEW: Projects Table (Insaat/Ihale)
        await db.query(`
            CREATE TABLE IF NOT EXISTS projects (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                start_date DATE,
                end_date DATE,
                status VARCHAR(50) DEFAULT 'active',
                tender_price DECIMAL(15, 2) DEFAULT 0, -- Ihale Bedeli
                progress_payment DECIMAL(15, 2) DEFAULT 0, -- Hakedis (Alinan)
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Migration for existing tables (safe to run multiple times)
        try {
            await db.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS tender_price DECIMAL(15, 2) DEFAULT 0;`);
            await db.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress_payment DECIMAL(15, 2) DEFAULT 0;`);
        } catch (e) {
            console.log('Migration note: Columns might already exist');
        }

        console.log(' - Checked projects table');

        // NEW: Project Files (DWG, PDF, Excel)
        await db.query(`
            CREATE TABLE IF NOT EXISTS project_files (
                id SERIAL PRIMARY KEY,
                project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
                file_url TEXT NOT NULL,
                file_type VARCHAR(50), -- dwg, pdf, excel, image, other
                file_name VARCHAR(255),
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log(' - Checked project_files table');

        // NEW: Project Expenses (Giderler)
        await db.query(`
            CREATE TABLE IF NOT EXISTS project_expenses (
                id SERIAL PRIMARY KEY,
                project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
                amount DECIMAL(10, 2) NOT NULL,
                category VARCHAR(100),
                description TEXT,
                receipt_url TEXT, -- Image of the bill/receipt
                expense_date DATE DEFAULT CURRENT_DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log(' - Checked project_expenses table');

        // Check app_settings
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
