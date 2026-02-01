const imaps = require('imap-simple');
const simpleParser = require('mailparser').simpleParser;
const db = require('../db');
const { uploadStream } = require('../utils/cloudinary'); // Usage: uploadStream(buffer).then(url)

/**
 * Main function to check emails and create tasks
 */
exports.checkEmails = async () => {
    let connection = null;

    try {
        // 1. Get Settings from DB
        const { rows } = await db.query('SELECT * FROM app_settings WHERE id = 1');
        const settings = rows[0];

        if (!settings || !settings.email_user || !settings.email_pass || !settings.email_active) {
            console.log('Email Service: Not configured or inactive.');
            return;
        }

        const config = {
            imap: {
                user: settings.email_user,
                password: settings.email_pass,
                host: settings.email_host || 'imap.gmail.com',
                port: settings.email_port || 993,
                tls: true,
                tlsOptions: { rejectUnauthorized: false },
                authTimeout: 15000 // Increased to 15s
            }
        };

        // 2. Connect to IMAP
        connection = await imaps.connect(config);
        await connection.openBox('INBOX');

        // 3. Search for UNSEEN messages
        const searchCriteria = ['UNSEEN'];
        const fetchOptions = {
            bodies: ['HEADER', 'TEXT', ''],
            markSeen: true,
            struct: true
        };

        const messages = await connection.search(searchCriteria, fetchOptions);

        if (messages.length === 0) {
            // console.log('Email Service: No new emails.');
            connection.end();
            return { processed: 0, errors: [] };
        }

        console.log(`Email Service: Found ${messages.length} new emails.`);
        let processedCount = 0;
        let errors = [];

        // 4. Process Each Message
        for (const message of messages) {
            try {
                const all = message.parts.find(part => part.which === '');
                const id = message.attributes.uid;
                const idHeader = 'Imap-Id: ' + id + '\r\n';

                // Parse Email
                const mail = await simpleParser(idHeader + all.body);

                const subject = mail.subject || '(Başlıksız Servis)';
                const from = mail.from?.text || 'Bilinmeyen Gönderici';
                const bodyText = mail.text || mail.html || '';

                // Create Task in DB
                // Status: pool, Priority: medium
                const taskResult = await db.query(
                    'INSERT INTO tasks (title, description, status, priority, due_date, address) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
                    [
                        subject,
                        `${bodyText}\n\n[Otomatik oluşturuldu. Gönderen: ${from}]`,
                        'pool',
                        'medium',
                        new Date(), // Due date today by default
                        'Adres belirtilmedi (Mailden geldi)'
                    ]
                );

                const taskId = taskResult.rows[0].id;

                // Handle Attachments
                if (mail.attachments && mail.attachments.length > 0) {
                    for (const attachment of mail.attachments) {
                        // Check if image
                        if (attachment.contentType.startsWith('image/')) {
                            // Upload to Cloudinary
                            try {
                                const result = await uploadStream(attachment.content); // Helper we need to ensure exists or import

                                // Save to Photos
                                await db.query(
                                    'INSERT INTO photos (task_id, url, type, gps_lat, gps_lng) VALUES ($1, $2, $3, $4, $5)',
                                    [taskId, result.secure_url, 'raw', null, null]
                                );
                                console.log(`Photo uploaded for Task ${taskId}`);
                            } catch (uplErr) {
                                console.error('Cloudinary upload failed:', uplErr);
                            }
                        }
                    }
                }

                console.log(`Task created from email: ${subject} (ID: ${taskId})`);
                processedCount++;

            } catch (err) {
                console.error('Error processing message:', err);
                errors.push(err.message);
            }
        }

        connection.end();
        return { processed: processedCount, total: messages.length, errors };

    } catch (err) {
        console.error('Email Service Error:', err.message);
        if (connection) connection.end();
        return { processed: 0, errors: [err.message] };
    }
};
