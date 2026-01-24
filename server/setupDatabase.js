const db = require('./db');

const createTables = async () => {
    try {
        console.log('Creating tables...');

        await db.query(`
            CREATE TABLE IF NOT EXISTS stocks (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100) DEFAULT 'Genel',
                quantity NUMERIC(10, 2) DEFAULT 0,
                unit VARCHAR(50) DEFAULT 'Adet',
                critical_level NUMERIC(10, 2) DEFAULT 5,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Stocks table created.');

        await db.query(`
            CREATE TABLE IF NOT EXISTS stock_transactions (
                id SERIAL PRIMARY KEY,
                stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
                type VARCHAR(10) CHECK (type IN ('in', 'out')),
                quantity NUMERIC(10, 2) NOT NULL,
                description TEXT,
                project_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Stock Transactions table created.');

        console.log('Database setup complete.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error creating tables:', err);
        process.exit(1);
    }
};

createTables();
