const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const db = require('./config/db');
const runMigrations = require('./migrations/init');
const initCronJobs = require('./services/cronService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Version Info
const versionPath = path.join(__dirname, '../version.json');
const versionData = fs.existsSync(versionPath) 
    ? JSON.parse(fs.readFileSync(versionPath, 'utf8'))
    : { version: '1.0.0' };

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/stores', require('./routes/stores'));
app.use('/api/definitions', require('./routes/definitions'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/subs', require('./routes/subs'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/stock-tracking', require('./routes/stockTracking'));
app.use('/api/backup', require('./routes/backup'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/regions', require('./routes/regions'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/health', require('./routes/health'));

// Version Endpoint
app.get('/api/version', (req, res) => res.json({ version: versionData.version }));

// Static Folders
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../client/dist')));

// Catchall
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Final Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Sunucu hatası oluştu.',
        error: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

// Initialize and Start
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    
    // Background Tasks
    await runMigrations();
    initCronJobs();
});
