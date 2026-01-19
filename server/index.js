const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));

// Static Folder for Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.send('Field Service API Running');
});

// WEB SETUP ROUTE (For Manual DB Init)
const fs = require('fs');
const { Pool } = require('pg');
app.get('/setup', async (req, res) => {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf8');
        await pool.query(sql);
        res.send('<h1>✅ VERITABANI KURULDU!</h1><p>Tablolar olusturuldu ve admin kullanicisi eklendi.</p><p>Simdi <b>admin</b> / <b>123456</b> ile giris yapin.</p>');
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
