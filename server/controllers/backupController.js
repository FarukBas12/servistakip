const db = require('../db');
const { cloudinary } = require('../utils/cloudinary');
const fs = require('fs');
const path = require('path');

exports.createBackup = async () => {
    try {
        console.log('🔄 Starting Automatic Backup...');

        // 1. Fetch Data
        const tables = ['users', 'tasks', 'projects', 'stocks', 'stock_transactions', 'subcontractors', 'payments', 'cash_transactions', 'project_expenses'];
        const backupData = {};

        for (const table of tables) {
            try {
                const res = await db.query(`SELECT * FROM ${table}`);
                backupData[table] = res.rows;
            } catch (err) {
                console.error(`Error fetching table ${table}:`, err.message);
                backupData[table] = { error: err.message };
            }
        }

        backupData.timestamp = new Date().toISOString();

        // 2. Create Temp File
        const fileName = `backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
        const filePath = path.join(__dirname, '../uploads', fileName);

        fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

        // 3. Upload to Cloudinary
        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: 'raw',
            folder: 'backups',
            public_id: fileName.replace('.json', '')
        });

        // 4. Cleanup
        fs.unlinkSync(filePath);

        console.log('✅ Backup Successful:', result.secure_url);
        return result.secure_url;

    } catch (err) {
        console.error('❌ Backup Failed:', err);
        return null; // Return null on failure
    }
};

exports.manualBackup = async (req, res) => {
    try {
        const url = await exports.createBackup();
        if (url) {
            res.json({ message: 'Backup Created Successfully', url });
        } else {
            res.status(500).json({ message: 'Backup Failed' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
