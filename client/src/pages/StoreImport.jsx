import React, { useState } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const StoreImport = () => {
    const navigate = useNavigate();
    const [csvData, setCsvData] = useState('');
    const [status, setStatus] = useState('');
    const [previewData, setPreviewData] = useState([]);

    const parseData = (text) => {
        const rows = text.split('\n').filter(r => r.trim());
        const stores = [];

        rows.forEach((row) => {
            // Priority: Tab -> Semicolon -> Comma
            let cols = row.split('\t');
            if (cols.length < 2) cols = row.split(';');
            if (cols.length < 2) cols = row.split(',');

            if (cols.length >= 1) { // Allow even if only code exists, though validation will fail
                stores.push({
                    code: cols[0]?.trim() || '',
                    name: cols[1]?.trim() || '',
                    address: cols.slice(2).join(' ').trim() || ''
                });
            }
        });
        return stores;
    };

    const handleTextChange = (e) => {
        const text = e.target.value;
        setCsvData(text);
        setPreviewData(parseData(text));
    };

    const handleImport = async () => {
        if (previewData.length === 0) return alert('Lütfen veri yapıştırın');

        // Filter out header if user copied it (basic check: if code header says 'Code' or similar)
        const validStores = previewData.filter(s => s.code.length > 0 && s.name.length > 0 && !s.code.toLowerCase().includes('kod') && !s.code.toLowerCase().includes('code'));

        setStatus(`Yükleniyor... (${validStores.length} kayıt)`);

        try {
            await api.post('/stores/bulk', { stores: validStores });
            setStatus(`✅ Başarılı! ${validStores.length} mağaza eklendi.`);
            setTimeout(() => navigate('/admin'), 2000);
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || err.message || 'Bilinmeyen Hata';
            setStatus(`❌ Hata: ${errMsg}`);
        }
    };

    return (
        <div className="dashboard">
            <button onClick={() => navigate('/admin')} className="glass-btn" style={{ marginBottom: '1rem' }}>&larr; Geri</button>
            <div className="glass-panel" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
                <h2 style={{ marginTop: 0 }}>Toplu Mağaza Yükleme</h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                            <strong>Nasıl Yapılır?</strong>
                            <ol style={{ paddingLeft: '20px', marginTop: '10px' }}>
                                <li>Excel'den 3 sütunu seçin: <b>KOD</b> | <b>İSİM</b> | <b>ADRES</b></li>
                                <li>Kopyalayın ve buraya yapıştırın.</li>
                            </ol>
                        </div>

                        <textarea
                            className="glass-input"
                            rows="15"
                            placeholder={"A101-001\tA101 Alsancak\tİzmir\n..."}
                            value={csvData}
                            onChange={handleTextChange}
                            style={{ fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre' }}
                        />
                        <button onClick={handleImport} className="glass-btn" style={{ marginTop: '10px', background: 'rgba(76, 175, 80, 0.3)', width: '100%' }}>
                            Yükle ({previewData.length})
                        </button>
                        {status && <p style={{ marginTop: '10px', fontWeight: 'bold' }}>{status}</p>}
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', overflowY: 'auto', maxHeight: '500px' }}>
                        <h4 style={{ marginTop: 0 }}>Önizleme ({previewData.length} Kayıt)</h4>
                        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #555' }}>
                                    <th>Kod</th>
                                    <th>İsim</th>
                                    <th>Adres</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.slice(0, 100).map((row, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <td style={{ color: '#4CAF50' }}>{row.code}</td>
                                        <td>{row.name}</td>
                                        <td style={{ opacity: 0.7 }}>{row.address}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {previewData.length > 100 && <p style={{ textAlign: 'center', opacity: 0.5 }}>... ve {previewData.length - 100} kayıt daha ...</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoreImport;
