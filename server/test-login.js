const db = require('./db');
const bcrypt = require('bcrypt');

async function testLogin(username, password) {
    try {
        console.log(`Testing login for user: ${username}`);
        const { rows } = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = rows[0];

        if (!user) {
            console.log('User NOT FOUND in database.');
            return;
        }

        console.log('User found.');
        console.log('Stored Hash:', user.password_hash);
        console.log('Input Password:', password);

        const isMatch = await bcrypt.compare(password, user.password_hash);
        console.log('Bcrypt Compare Result:', isMatch);

        if (isMatch) {
            console.log('SUCCESS: Password matches.');
        } else {
            console.log('FAILURE: Password does NOT match.');
        }

    } catch (err) {
        console.error('Error during test:', err);
    } finally {
        setTimeout(() => process.exit(0), 1000);
    }
}

testLogin('admin', 'password');
