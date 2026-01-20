const db = require('./db');

async function fixDatabase() {
    console.log('Veritabanı PHOTOS Tablosu kontrol ediliyor...');

    try {
        console.log('Kontrol ediliyor: PHOTOS tablosu var mı?');
        await db.query(`
            CREATE TABLE IF NOT EXISTS photos (
                id SERIAL PRIMARY KEY,
                task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
                url TEXT NOT NULL,
                type VARCHAR(50),
                gps_lat FLOAT,
                gps_lng FLOAT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('   ✅ PHOTOS tablosu mevcut veya oluşturuldu.');

    } catch (err) {
        console.error('   ❌ HATA:', err);
    }

    console.log('-----------');
    console.log('İşlem Tamamlandı.');
    process.exit();
}

fixDatabase();
