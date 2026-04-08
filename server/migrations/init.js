const pool = require('../config/db');
const bcrypt = require('bcryptjs');

async function runMigrations() {
    console.log('🔄 Checking Database Schema...');

    try {
        // Essential tables first
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'technician', 'depocu')),
                job_title VARCHAR(100),
                full_name VARCHAR(100),
                photo_url TEXT,
                phone VARCHAR(50),
                start_date TIMESTAMP,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
             CREATE TABLE IF NOT EXISTS app_settings (
                id SERIAL PRIMARY KEY,
                delete_password VARCHAR(50) DEFAULT '123456',
                email_host VARCHAR(255),
                email_port INTEGER,
                email_user VARCHAR(255),
                email_pass VARCHAR(255),
                email_active BOOLEAN DEFAULT false
            );
        `);
        await pool.query("INSERT INTO app_settings (id, delete_password) VALUES (1, '123456') ON CONFLICT (id) DO NOTHING");

        // Regions
        await pool.query(`
            CREATE TABLE IF NOT EXISTS regions (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL
            );
        `);

        // Tasks
        await pool.query(`
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
                assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
                priority VARCHAR(20) DEFAULT 'medium',
                source VARCHAR(20) DEFAULT 'manual',
                region VARCHAR(50) DEFAULT 'Diğer',
                is_quoted BOOLEAN DEFAULT FALSE,
                service_form_no VARCHAR(100),
                updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Task Assignments
        await pool.query(`
            CREATE TABLE IF NOT EXISTS task_assignments (
                task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (task_id, user_id)
            );
        `);

        // Task Logs
        await pool.query(`
            CREATE TABLE IF NOT EXISTS task_logs (
                id SERIAL PRIMARY KEY,
                task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                action VARCHAR(50) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Photos
        await pool.query(`
            CREATE TABLE IF NOT EXISTS photos (
                id SERIAL PRIMARY KEY,
                task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
                url TEXT NOT NULL,
                type VARCHAR(50),
                gps_lat DECIMAL(9,6),
                gps_lng DECIMAL(9,6),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Projects
        await pool.query(`
            CREATE TABLE IF NOT EXISTS projects (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                start_date DATE,
                end_date DATE,
                status VARCHAR(50) DEFAULT 'active',
                tender_price DECIMAL(15, 2) DEFAULT 0,
                progress_payment DECIMAL(15, 2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Project Files
        await pool.query(`
            CREATE TABLE IF NOT EXISTS project_files (
                id SERIAL PRIMARY KEY,
                project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
                file_url TEXT NOT NULL,
                file_type VARCHAR(50),
                file_name VARCHAR(255),
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Subcontractors
        await pool.query(`
            CREATE TABLE IF NOT EXISTS subcontractors (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                phone VARCHAR(20),
                photo TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Payments (Hakediş Header)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                subcontractor_id INTEGER REFERENCES subcontractors(id) ON DELETE SET NULL,
                title VARCHAR(150),
                store_name VARCHAR(150),
                waybill_info TEXT, 
                waybill_image TEXT,
                payment_date DATE,
                total_amount NUMERIC(12, 2) DEFAULT 0,
                status VARCHAR(20) DEFAULT 'pending',
                kdv_rate INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Payment Items
        await pool.query(`
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

        // Cash Transactions
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cash_transactions (
                id SERIAL PRIMARY KEY,
                subcontractor_id INTEGER REFERENCES subcontractors(id) ON DELETE CASCADE,
                amount NUMERIC(12, 2) NOT NULL,
                transaction_date DATE DEFAULT CURRENT_DATE,
                description VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Stocks
        await pool.query(`
            CREATE TABLE IF NOT EXISTS stocks (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                unit VARCHAR(20) DEFAULT 'Adet',
                quantity NUMERIC(15, 2) DEFAULT 0,
                critical_level NUMERIC(15, 2) DEFAULT 0,
                purchase_price DECIMAL(10, 2) DEFAULT 0,
                category VARCHAR(100) DEFAULT 'Genel',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Stock Transactions
        await pool.query(`
            CREATE TABLE IF NOT EXISTS stock_transactions (
                id SERIAL PRIMARY KEY,
                stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                type VARCHAR(20) NOT NULL CHECK (type IN ('in', 'out')),
                quantity NUMERIC(15, 2) NOT NULL,
                project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
                description TEXT,
                transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Notifications
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                type VARCHAR(50) DEFAULT 'info',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Calendar Notes
        await pool.query(`
            CREATE TABLE IF NOT EXISTS calendar_notes (
                id SERIAL PRIMARY KEY,
                date VARCHAR(20) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Seed default regions if empty
        const regionCount = await pool.query('SELECT COUNT(*) FROM regions');
        if (parseInt(regionCount.rows[0].count) === 0) {
            const defaultRegions = ['Kemalpaşa', 'Manisa', 'Güzelbahçe', 'Torbalı', 'Menemen', 'Diğer'];
            for (const r of defaultRegions) {
                await pool.query('INSERT INTO regions (name) VALUES ($1)', [r]);
            }
        }

        // Upsert admin
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('123456', salt);
        await pool.query(`
            INSERT INTO users (username, password_hash, role) 
            VALUES ('admin', $1, 'admin')
            ON CONFLICT (username) DO NOTHING
        `, [hash]);

        // Ensure tasks table has source and is_retry for the new dashboard
        await pool.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT \'manual\'');
        await pool.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_retry BOOLEAN DEFAULT FALSE');

        console.log('✅ Database Schema Verified & Updated!');
    } catch (e) {
        console.error('❌ Schema update error:', e.message);
    }
}

module.exports = runMigrations;
