const db = require('./db');
const bcrypt = require('bcrypt');

async function seedUsers() {
    try {
        console.log('Seeding users...');

        // Clear existing users to avoid duplicates/errors
        await db.query('DELETE FROM users');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password', salt); // Default password: 'password'

        await db.query(
            'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
            ['admin', hashedPassword, 'admin']
        );

        await db.query(
            'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
            ['tech1', hashedPassword, 'technician']
        );

        console.log('Users seeded successfully! Password is "password"');
    } catch (err) {
        console.error('Error seeding users:', err);
    } finally {
        process.exit();
    }
}

seedUsers();
