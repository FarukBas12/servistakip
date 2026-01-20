const db = require('./db');

async function fixDatabase() {
    console.log('Veritabanı kapsamlı kontrol ediliyor...');

    try {
        const columnsToCheck = ['region', 'lat', 'lng', 'maps_link'];

        for (const col of columnsToCheck) {
            console.log(`Kontrol ediliyor: ${col}...`);
            await db.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='${col}') THEN
                        ALTER TABLE tasks ADD COLUMN ${col} ${col === 'lat' || col === 'lng' ? 'FLOAT' : 'VARCHAR(255)'};
                        RAISE NOTICE '${col} column added';
                        RAISE NOTICE 'Sütun eklendi: ${col}';
                    END IF;
                END
                $$;
            `);
        }
        console.log('   ✅ Tüm sütunlar kontrol edildi.');

    } catch (err) {
        console.error('   ❌ HATA:', err);
    }

    console.log('-----------');
    console.log('İşlem Tamamlandı.');
    process.exit();
}

fixDatabase();
