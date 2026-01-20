const db = require('./server/db');

async function fixDatabase() {
    console.log('Veritabanı kontrol ediliyor...');

    try {
        // 1. Check/Add region column to tasks
        console.log('1. Tasks tablosu kontrol ediliyor (region sütunu)...');
        await db.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='region') THEN
                    ALTER TABLE tasks ADD COLUMN region VARCHAR(50) DEFAULT 'Diğer';
                    RAISE NOTICE 'Region column added';
                END IF;
            END
            $$;
        `);
        console.log('   ✅ Tasks tablosu güncel.');

    } catch (err) {
        console.error('   ❌ HATA:', err.message);
    }

    console.log('-----------');
    console.log('İşlem Tamamlandı.');
    process.exit();
}

fixDatabase();
