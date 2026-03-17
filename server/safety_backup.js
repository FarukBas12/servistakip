const backupController = require('./controllers/backupController');
const db = require('./db');

async function runBackup() {
    console.log('--- Manual Safety Backup Starting ---');
    try {
        const url = await backupController.createBackup();
        if (url) {
            console.log('SUCCESS: Backup file uploaded to Cloudinary.');
            console.log('URL:', url);
        } else {
            console.error('FAILED: Backup function returned null.');
        }
    } catch (err) {
        console.error('CRITICAL ERROR during backup:', err);
    }
    process.exit();
}

runBackup();
