import React, { useState } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const StoreImport = () => {
    const navigate = useNavigate();
    const [csvData, setCsvData] = useState('');
    const [status, setStatus] = useState('');

    const handleImport = async () => {
        if (!csvData.trim()) return alert('Lütfen veri yapıştırın');

        setStatus('Yükleniyor...');

        // Simple CSV parser: Split by new line, then by comma or tab
        const rows = csvData.split('\n').filter(r => r.trim());
        const stores = [];

        rows.forEach((row, index) => {
            // Support Tab (Excel copy-paste) or Comma (CSV)
            let cols = row.split('\t');
            if (cols.length < 2) cols = row.split(',');
            // If still 1, maybe semicolon
            if (cols.length < 2) cols = row.split(';');

            if (cols.length >= 3) {
                stores.push({
                    code: cols[0].trim(),
                    name: cols[1].trim(),
                    address: cols.slice(2).join(' ').trim() // Join rest as address in case of extra commas
                });
            }
        });

        try {
            await api.post('/stores/bulk', { stores });
            setStatus(`Başarılı! ${stores.length} mağaza eklendi.`);
            setTimeout(() => navigate('/admin'), 2000);
        } catch (err) {
            console.error(err);
            setStatus('Hata oluştu. Kodların benzersiz olduğundan emin olun.');
        }
    };

    return (
        <div className="dashboard">
            <button onClick={() => navigate('/admin')} className="glass-btn" style={{ marginBottom: '1rem' }}>&larr; Geri</button>
            <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                <h2 style={{ marginTop: 0 }}>Toplu Mağaza Yükleme</h2>

                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                    <strong>Nasıl Yapılır?</strong>
                    <ol style={{ paddingLeft: '20px', marginTop: '10px' }}>
                        <li>Excel dosyanızı açın.</li>
                        <li>Sütunlar şu sırada olmalı: <b>KOD</b> | <b>İSİM</b> | <b>ADRES</b></li>
                        <li>Başlık satırını almayın.</li>
                        <li>Verileri seçip kopyalayın (Ctrl+C).</li>
                        <li>Aşağıdaki kutuya yapıştırın (Ctrl+V).</li>
                        <li>"Yükle" butonuna basın.</li>
                    </ol>
                </div>

                <textarea
                    className="glass-input"
                    rows="10"
                    placeholder={"A101-001\tA101 Alsancak\tKıbrıs Şehitleri Cad. No:1 İzmir\nBİM-342\tBİM Bornova\tBornova Meydan..."}
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                />

                <button onClick={handleImport} className="glass-btn" style={{ marginTop: '10px', background: 'rgba(76, 175, 80, 0.3)', width: '100%' }}>
                    Yükle
                </button>

                {status && <p style={{ marginTop: '10px', fontWeight: 'bold' }}>{status}</p>}
            </div>
        </div>
    );
};

export default StoreImport;
