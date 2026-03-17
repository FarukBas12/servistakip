const cron = require('node-cron');
const backupController = require('../controllers/backupController');
const emailService = require('../services/EmailService');
const notificationController = require('../controllers/notificationController');
const db = require('../config/db');

function initCronJobs() {
    // Schedule Daily Backup at 03:00 AM
    cron.schedule('0 3 * * *', () => {
        console.log('Running Daily Backup...');
        backupController.createBackup();
    });

    // Schedule Email Check (Every 5 minutes)
    cron.schedule('*/5 * * * *', () => {
        // console.log('Running Email Check Task...');
        emailService.checkEmails();
    });

    // Reminder Timer (Check every minute)
    setInterval(async () => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();

        if ((hours === 9 || hours === 17) && minutes === 0) {
            try {
                const { rows: users } = await db.query("SELECT id FROM users WHERE role IN ('admin')");
                for (const user of users) {
                    await notificationController.createNotification(
                        user.id,
                        `🔔 Stok Sayım Hatırlatması: ${hours}:00 oldu. Lütfen stokları kontrol edin.`,
                        'info'
                    );
                }
                console.log(`Reminder sent at ${hours}:00`);
            } catch (err) {
                console.error('Reminder Job Error:', err);
            }
        }
    }, 60000);
}

module.exports = initCronJobs;
