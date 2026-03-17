const db = require('../db');

exports.getRegions = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM regions ORDER BY id');
        res.json(rows);
    } catch (err) {
        console.error('getRegions error:', err);
        res.status(500).json({ message: 'Bölge listesi alınamadı.', error: err.message });
    }
};

exports.addRegion = async (req, res) => {
    const { name } = req.body;
    try {
        if (!name) return res.status(400).json({ message: 'Bölge ismi gereklidir.' });

        const { rows } = await db.query('INSERT INTO regions (name) VALUES ($1) RETURNING *', [name]);
        res.json(rows[0]);
    } catch (err) {
        console.error('addRegion error:', err);
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Bu bölge zaten mevcut.' });
        }
        res.status(500).json({ message: 'Bölge eklenirken hata oluştu.', error: err.message });
    }
};

exports.deleteRegion = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM regions WHERE id = $1', [id]);
        res.json({ message: 'Bölge silindi.' });
    } catch (err) {
        console.error('deleteRegion error:', err);
        res.status(500).json({ message: 'Bölge silinemedi.', error: err.message });
    }
};
