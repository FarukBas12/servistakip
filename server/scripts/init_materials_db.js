const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const createTableQuery = `
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) DEFAULT 'Adet',
    price DECIMAL(10, 2) DEFAULT 0.00,
    category VARCHAR(100)
);

-- Add service_form_data column to tasks if not exists
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS service_form_data JSONB;
`;

const seedDataQuery = `
INSERT INTO materials (name, unit, price, category) VALUES
('Alçıpan (Standart)', 'Adet', 120.00, 'Yapı'),
('Tuğla (13.5)', 'Adet', 4.50, 'Yapı'),
('Saten Alçı', 'Torba', 85.00, 'Boya'),
('Tavan Boyası (20kg)', 'Kova', 650.00, 'Boya'),
('Korniş (3''lü)', 'Metre', 45.00, 'Dekorasyon'),
('Spot Lamba', 'Adet', 75.00, 'Elektrik'),
('Laminat Parke', 'm2', 250.00, 'Zemin')
ON CONFLICT DO NOTHING;
`;

async function initDB() {
    try {
        console.log('Creating materials table...');
        await pool.query(createTableQuery);
        console.log('Table created.');

        console.log('Seeding initial data...');
        await pool.query(seedDataQuery);
        console.log('Seed data inserted.');

        console.log('Database update complete! Ctrl+C to exit if not auto-closed.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

initDB();
