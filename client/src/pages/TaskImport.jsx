import React, { useState } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

const TaskImport = () => {
    const navigate = useNavigate();
    const [csvData, setCsvData] = useState('');
    const [previewData, setPreviewData] = useState([]);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const parseData = (text) => {
        const rows = text.split('\n').filter(r => r.trim());
        const parsed = [];
        rows.forEach((row) => {
            // Detect delimiter (tab, semicolon, or comma)
            let cols = row.split('\t');
            if (cols.length < 2) cols = row.split(';');
            if (cols.length < 2) cols = row.split(',');

            if (cols.length >= 3) {
                // User Format: Mağaza Kodu | Adı | Adresi | İşin Açıklaması | Servis Talep Tarihi
                const storeCode = cols[0]?.trim() || '';
                const storeName = cols[1]?.trim() || '';
                const address = cols[2]?.trim() || '';
                const description = cols[3]?.trim() || '';
                const dateStr = cols[4]?.trim() || '';

                // Combine Code + Name for Title
                const title = storeCode ? `${storeCode} - ${storeName}` : storeName;

                // Simple Region Detection (Optional: Try to find common city names in address)
                // For now, leave empty, backend defaults to 'Diğer'
                let region = '';
                const cities = ['İzmir', 'Manisa', 'Aydın', 'Denizli', 'Muğla', 'Balıkesir', 'Antalya', 'Uşak', 'Kütahya', 'Bursa', 'İstanbul', 'Ankara'];
                cities.forEach(city => {
                    if (address.toLowerCase().includes(city.toLowerCase())) region = city;
                });

                parsed.push({
                    title: title,
                    address: address,
                    description: description,
                    region: region, // Auto-detected or empty
                    due_date: dateStr
                });
            }
        });
        return parsed;
    };

    const handleTextChange = (e) => {
        setCsvData(e.target.value);
        setPreviewData(parseData(e.target.value));
    };

    const handleImport = async () => {
        if (previewData.length === 0) return alert('Lütfen veri yapıştırın yoksa önizleme tablosu boş mu?');

        setLoading(true);
        setStatus('Yükleniyor...');

        try {
            await api.post('/tasks/bulk', { tasks: previewData });
            setStatus(`✅ Başarılı! ${previewData.length} görev havuza eklendi.`);
            setTimeout(() => {
                navigate('/admin/pool');
            }, 1500);
        } catch (err) {
            console.error(err);
            setStatus('❌ Hata oluştu. Lütfen formatı kontrol edin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                <button onClick={() => navigate('/admin')} className="glass-btn" style={{ padding: '8px' }}>
                    <ArrowLeft size={20} />
                </button>
                <h2 style={{ margin: 0 }}>Toplu Görev Yükle</h2>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>

                    {/* Input Section */}
                    <div>
                        <div style={{ background: 'rgba(33, 150, 243, 0.1)', padding: '15px', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #2196f3' }}>
                            <h4 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <AlertCircle size={18} /> Nasıl Kullanılır?
                            </h4>
                            <p style={{ fontSize: '0.9rem', opacity: 0.8, lineHeight: '1.5' }}>
                                Excel'den verilerinizi kopyalayın ve aşağıdaki kutuya yapıştırın.
                                <br />Excel Sıralamanız:
                                <br /><b>KOD | MAĞAZA ADI | ADRES | AÇIKLAMA | TARİH</b>
                            </p>
                        </div>

                        <textarea
                            className="glass-input"
                            rows="15"
                            placeholder={"Örnek Veri:\n3501\tAlsancak Şb\tAtatürk Cad. No:1 İzmir\tDolap arızası\t2024-05-20"}
                            value={csvData}
                            onChange={handleTextChange}
                            style={{ fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre' }}
                        />

                        <button
                            onClick={handleImport}
                            disabled={loading || previewData.length === 0}
                            className="glass-btn"
                            style={{ width: '100%', marginTop: '15px', background: 'rgba(76, 175, 80, 0.3)', padding: '15px', fontSize: '1.1rem' }}
                        >
                            {loading ? 'Yükleniyor...' : <><Save size={18} style={{ marginRight: '8px' }} /> {previewData.length} Görevi Yükle</>}
                        </button>

                        {status && <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '5px', textAlign: 'center' }}>{status}</div>}
                    </div>

                    {/* Preview Section */}
                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '15px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ marginTop: 0, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Önizleme ({previewData.length})</h3>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', color: 'rgba(255,255,255,0.5)' }}>
                                        <th style={{ padding: '8px' }}>Başlık</th>
                                        <th style={{ padding: '8px' }}>Adres</th>
                                        <th style={{ padding: '8px' }}>Bölge</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.slice(0, 50).map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '8px', fontWeight: 'bold' }}>{row.title}</td>
                                            <td style={{ padding: '8px', opacity: 0.8 }}>{row.address.substring(0, 20)}...</td>
                                            <td style={{ padding: '8px' }}>
                                                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                                    {row.region || '-'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {previewData.length > 50 && (
                                        <tr>
                                            <td colSpan="3" style={{ textAlign: 'center', padding: '10px', fontStyle: 'italic', opacity: 0.5 }}>
                                                ... ve {previewData.length - 50} daha
                                            </td>
                                        </tr>
                                    )}
                                    {previewData.length === 0 && (
                                        <tr>
                                            <td colSpan="3" style={{ textAlign: 'center', padding: '30px', opacity: 0.3 }}>
                                                Veri bekleniyor...
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TaskImport;
