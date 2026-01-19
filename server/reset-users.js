const db = require('./db');
const bcrypt = require('bcrypt');

async function resetUsers() {
    try {
        console.log('Resetting user passwords...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password', salt);

        // Update Admin
        const adminRes = await db.query(
            'UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING *',
            [hashedPassword, 'admin']
        );

        if (adminRes.rowCount === 0) {
            console.log('Admin user not found, inserting...');
            await db.query(
                'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
                ['admin', hashedPassword, 'admin']
            );
        } else {
            console.log('Admin password updated.');
        }

        // Update Tech
        const techRes = await db.query(
            'UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING *',
            [hashedPassword, 'tech1']
        );

        if (techRes.rowCount === 0) {
            console.log('Tech1 user not found, inserting...');
            await db.query(
                'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
                ['tech1', hashedPassword, 'technician']
            );
        } else {
            console.log('Tech1 password updated.');
        }

        console.log('Reset complete. Passwords are set to "password"');
    } catch (err) {
        console.error('Error resetting users:', err);
    } finally {
        // Force exit to close pool
        setTimeout(() => process.exit(0), 1000);
    }
}

resetUsers();
