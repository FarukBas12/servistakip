const db = require('../db');
const XLSX = require('xlsx');
const { cloudinary } = require('../utils/cloudinary');

// --- SUBCONTRACTORS ---
exports.listSubs = async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT s.*, 
            (COALESCE((SELECT SUM(total_amount) FROM payments WHERE subcontractor_id = s.id AND status != 'cancelled'), 0) - 
             COALESCE((SELECT SUM(amount) FROM cash_transactions WHERE subcontractor_id = s.id), 0)) as balance
            FROM subcontractors s ORDER BY s.name
        `);
        res.json(rows);
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.createSub = async (req, res) => {
    try {
        const { name, phone } = req.body;
        const { rows } = await db.query('INSERT INTO subcontractors (name, phone) VALUES ($1, $2) RETURNING *', [name, phone]);
        res.json(rows[0]);
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.updateSub = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, photoBase64 } = req.body;

        // Base64 Fallback (Priority)
        let uploadDebug = 'Skipped';
        let base64Len = 0;

        if (photoBase64) {
            base64Len = photoBase64.length;
            console.log('Uploading Base64 Image. Length:', base64Len);
            try {
                const uploadRes = await cloudinary.uploader.upload(photoBase64, {
                    folder: 'field-service-app'
                });
                photo = uploadRes.secure_url;
                uploadDebug = 'Success: ' + photo;
            } catch (upErr) {
                console.error('Cloudinary Upload Failed:', upErr);
                uploadDebug = 'Failed: ' + upErr.message;
            }
        } else {
            console.log('No photoBase64 received.');
        }

        await db.query(`
            UPDATE subcontractors 
            SET name = $1, phone = $2, 
                photo = COALESCE($3, photo) 
            WHERE id = $4`,
            [name, phone, photo, id]
        );
        res.json({ message: 'Updated', derivedPhoto: photo, debugLen: base64Len, debugUpload: uploadDebug });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message, stack: err.stack });
    }
};

exports.deleteSub = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        // Verify Password
        const settingRes = await db.query('SELECT delete_password FROM app_settings WHERE id = 1');
        const correctPassword = settingRes.rows[0]?.delete_password || '123456';

        if (password !== correctPassword) {
            return res.status(403).json({ message: 'Hatalı Şifre!' });
        }

        await db.query('DELETE FROM subcontractors WHERE id = $1', [id]);
        res.json({ message: 'Deleted' });
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.getSettings = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT delete_password, email_host, email_port, email_user, email_pass, email_active FROM app_settings WHERE id = 1');
        res.json(rows[0] || { delete_password: '123456' });
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

const emailService = require('../services/EmailService');

exports.updateSettings = async (req, res) => {
    try {
        const { delete_password, email_host, email_port, email_user, email_pass, email_active } = req.body;

        // Dynamic update based on provided fields
        if (delete_password) {
            await db.query('UPDATE app_settings SET delete_password = $1 WHERE id = 1', [delete_password]);
        }

        if (email_host !== undefined) {
            await db.query(
                `UPDATE app_settings SET 
                 email_host = $1, email_port = $2, email_user = $3, email_pass = $4, email_active = $5 
                 WHERE id = 1`,
                [email_host, email_port, email_user, email_pass, email_active]
            );
        }

        res.json({ message: 'Settings Updated' });
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.testEmailConnection = async (req, res) => {
    try {
        console.log('Manual Email Check Triggered...');
        const result = await emailService.checkEmails();
        res.json({
            message: 'Test Tamamlandı.',
            details: result || { processed: 0, total: 0 }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Test Hatası: ' + err.message });
    }
};

// --- CASH TRANSACTIONS ---
exports.addCash = async (req, res) => {
    try {
        const { subcontractor_id, amount, description, transaction_date } = req.body;
        await db.query('INSERT INTO cash_transactions (subcontractor_id, amount, description, transaction_date) VALUES ($1, $2, $3, $4)',
            [subcontractor_id, amount, description, transaction_date]);
        res.json({ message: 'Saved' });
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

// --- PRICE DEFINITIONS ---
exports.listPrices = async (req, res) => {
    try {
        const { subId } = req.query;
        const { rows } = await db.query('SELECT * FROM price_definitions WHERE subcontractor_id = $1 ORDER BY work_item', [subId]);
        res.json(rows);
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.importPrices = async (req, res) => {
    try {
        if (!req.file) return res.status(400).send('Dosya yüklenmedi/seçilmedi.');

        const { subId } = req.body;
        if (!subId) return res.status(400).send('Taşeron ID eksik.');

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName]);

        console.log(`Importing ${data.length} rows for sub ${subId} from sheet ${firstSheetName}`);

        let count = 0;
        for (const row of data) {
            // Flexible Column Matching (Case Insensitive + Trimming)
            const keys = Object.keys(row);

            // Find 'Kalem' column
            const itemKey = keys.find(k => /kalem/i.test(k) || /item/i.test(k) || /açıklama/i.test(k) || /iş/i.test(k));
            // Find 'Fiyat' column
            const priceKey = keys.find(k => /fiyat/i.test(k) || /price/i.test(k) || /tutar/i.test(k));

            const item = itemKey ? row[itemKey] : null;
            const price = priceKey ? row[priceKey] : 0;

            if (item) {
                await db.query(`
                    INSERT INTO price_definitions (subcontractor_id, work_item, unit_price) 
                    VALUES ($1, $2, $3)`, [subId, String(item).trim(), parseFloat(price) || 0]);
                count++;
            }
        }
        res.json({ message: `${count} kalem başarıyla yüklendi.` });
    } catch (err) {
        console.error('Import Error:', err);
        res.status(500).send('Sunucu Hatası: Excel okunamadı. ' + err.message);
    }
};

exports.addPrice = async (req, res) => {
    try { // Manual add
        const { subId, work_item, unit_price } = req.body;
        await db.query('INSERT INTO price_definitions (subcontractor_id, work_item, unit_price) VALUES ($1, $2, $3)', [subId, work_item, unit_price]);
        res.json({ message: 'Added' });
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.deletePrice = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM price_definitions WHERE id = $1', [id]);
        res.json({ message: 'Deleted' });
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

// --- PAYMENTS (HAKEDİŞ) ---
exports.createPayment = async (req, res) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        // Parse items if sent as string (Multipart/form-data)
        let { subcontractor_id, title, store_name, waybill_info, payment_date, items, kdv_rate } = req.body;
        if (typeof items === 'string') items = JSON.parse(items);

        let waybill_image = null;
        if (req.file) {
            waybill_image = req.file.path;
        }

        // Calculate total
        const subTotal = items.reduce((acc, item) => acc + (parseFloat(item.quantity) * parseFloat(item.unit_price)), 0);
        const vatRate = parseFloat(kdv_rate) || 0;
        const total = subTotal + (subTotal * vatRate / 100);

        const resHeader = await client.query(`
            INSERT INTO payments (subcontractor_id, title, store_name, waybill_info, waybill_image, payment_date, total_amount, status, kdv_rate)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8) RETURNING id`,
            [subcontractor_id, title, store_name, waybill_info, waybill_image, payment_date, total, vatRate]
        );
        const paymentId = resHeader.rows[0].id;

        for (const item of items) {
            await client.query(`
                INSERT INTO payment_items (payment_id, work_item, quantity, unit_price, total_price)
                VALUES ($1, $2, $3, $4, $5)`,
                [paymentId, item.work_item, item.quantity, item.unit_price, (item.quantity * item.unit_price)]
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Payment Created' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).send('Server Error');
    } finally {
        client.release();
    }
};

exports.getPaymentDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const headerRes = await db.query('SELECT * FROM payments WHERE id = $1', [id]);
        if (headerRes.rows.length === 0) return res.status(404).json({ message: 'NotFound' });

        const itemsRes = await db.query('SELECT * FROM payment_items WHERE payment_id = $1', [id]);

        res.json({ ...headerRes.rows[0], items: itemsRes.rows });
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.getLedger = async (req, res) => {
    try {
        const { id } = req.params;
        // Fetch Payments (Credit)
        const paymentsRes = await db.query(`
            SELECT id, title as description, store_name, total_amount as amount, payment_date as date, 'hakedis' as type 
            FROM payments WHERE subcontractor_id = $1 AND status != 'cancelled'
        `, [id]);

        // Fetch Cash Transactions (Debit)
        const cashRes = await db.query(`
            SELECT id, description, amount, transaction_date as date, 'odeme' as type 
            FROM cash_transactions WHERE subcontractor_id = $1
        `, [id]);

        // Combine and Sort
        const all = [...paymentsRes.rows, ...cashRes.rows].sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json(all);
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.deleteTransaction = async (req, res) => {
    try {
        const { type, id } = req.params;
        if (type === 'hakedis') {
            await db.query('DELETE FROM payments WHERE id = $1', [id]);
        } else if (type === 'odeme') {
            await db.query('DELETE FROM cash_transactions WHERE id = $1', [id]);
        }
        res.json({ message: 'Deleted' });
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.updateCashTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        let { amount, description, transaction_date } = req.body;

        // Validation
        if (!amount || isNaN(parseFloat(amount))) amount = 0;
        if (!transaction_date) transaction_date = new Date();

        await db.query(`
            UPDATE cash_transactions 
            SET amount = $1, description = $2, transaction_date = $3 
            WHERE id = $4`,
            [amount, description, transaction_date, id]);
        res.json({ message: 'Updated' });
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

exports.updatePayment = async (req, res) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        let { title, store_name, waybill_info, payment_date, items, kdv_rate } = req.body;

        if (typeof items === 'string') items = JSON.parse(items);

        let waybill_image = null;
        if (req.file) {
            waybill_image = req.file.path;
        }

        // Calculate total
        const subTotal = items.reduce((acc, item) => acc + (parseFloat(item.quantity) * parseFloat(item.unit_price)), 0);
        const vatRate = parseFloat(kdv_rate) || 0;
        const total = subTotal + (subTotal * vatRate / 100);

        // Update header
        if (waybill_image) {
            await client.query(`
                UPDATE payments 
                SET title = $1, store_name = $2, waybill_info = $3, waybill_image = $4, payment_date = $5, total_amount = $6, kdv_rate = $7
                WHERE id = $8`,
                [title, store_name, waybill_info, waybill_image, payment_date, total, vatRate, id]
            );
        } else {
            await client.query(`
                UPDATE payments 
                SET title = $1, store_name = $2, waybill_info = $3, payment_date = $4, total_amount = $5, kdv_rate = $6
                WHERE id = $7`,
                [title, store_name, waybill_info, payment_date, total, vatRate, id]
            );
        }

        // Update items (Simple approach: delete and re-insert)
        await client.query('DELETE FROM payment_items WHERE payment_id = $1', [id]);
        for (const item of items) {
            const qty = parseFloat(item.quantity) || 0;
            const price = parseFloat(item.unit_price) || 0;
            await client.query(`
                INSERT INTO payment_items (payment_id, work_item, quantity, unit_price, total_price)
                VALUES ($1, $2, $3, $4, $5)`,
                [id, item.work_item, qty, price, (qty * price)]
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Payment Updated' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).send('Server Error');
    } finally {
        client.release();
    }
};
