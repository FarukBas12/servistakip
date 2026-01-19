import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const StoreImport = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('list'); // 'list' or 'import'

    // Import State
    const [csvData, setCsvData] = useState('');
    const [status, setStatus] = useState('');
    const [previewData, setPreviewData] = useState([]);

    // List State
    const [stores, setStores] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (activeTab === 'list') fetchStores();
    }, [activeTab]);

    const fetchStores = async () => {
        try {
            const res = await api.get('/stores');
            setStores(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu mağazayı silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/stores/${id}`);
            setStores(stores.filter(s => s.id !== id));
        } catch (err) {
            alert('Silinemedi');
        }
    };

    const handleExport = () => {
        // Convert to CSV
        const header = "Kod,Isim,Adres\n";
        const rows = stores.map(s => `${s.code},"${s.name}","${s.address}"`).join("\n");
        const bom = "\uFEFF"; // UTF-8 BOM for Excel
        const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Magaza_Listesi_${new Date().toLocaleDateString()}.csv`;
        link.click();
    };

    const parseData = (text) => {
        const rows = text.split('\n').filter(r => r.trim());
        const parsed = [];
        rows.forEach((row) => {
            let cols = row.split('\t');
            if (cols.length < 2) cols = row.split(';');
            if (cols.length < 2) cols = row.split(',');
            if (cols.length >= 1) {
                parsed.push({
                    code: cols[0]?.trim() || '',
                    name: cols[1]?.trim() || '',
                    address: cols.slice(2).join(' ').trim() || ''
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
        if (previewData.length === 0) return alert('Lütfen veri yapıştırın');
        const validStores = previewData.filter(s => s.code.length > 0 && !s.code.toLowerCase().includes('kod'));
        setStatus(`Yükleniyor... (${validStores.length} kayıt)`);

        try {
            const res = await api.post('/stores/bulk', { stores: validStores });
            setStatus(`✅ İşlem Tamam! (${validStores.length} veri işlendi)`);
            setTimeout(() => {
                setStatus('');
                setCsvData('');
                setPreviewData([]);
                setActiveTab('list'); // Switch to list view to see results
            }, 1500);
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || err.message || 'Hata';
            setStatus(`❌ Hata: ${errMsg}`);
        }
    };

    const filteredStores = stores.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="dashboard">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 2rem', maxWidth: '1000px', margin: '0 auto' }}>
                <button onClick={() => navigate('/admin')} className="glass-btn">&larr; Geri</button>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setActiveTab('list')} className="glass-btn" style={{ background: activeTab === 'list' ? 'rgba(255,255,255,0.2)' : 'transparent' }}>📋 Liste & Yönet</button>
                    <button onClick={() => setActiveTab('import')} className="glass-btn" style={{ background: activeTab === 'import' ? 'rgba(255,255,255,0.2)' : 'transparent' }}>📥 Toplu Yükle</button>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>

                {activeTab === 'list' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <input
                                className="glass-input"
                                placeholder="🔍 Ara (Kod veya İsim)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '60%' }}
                            />
                            <button onClick={handleExport} className="glass-btn" style={{ background: 'rgba(33, 150, 243, 0.3)' }}>📤 Excel'e Aktar</button>
                        </div>

                        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #555', color: '#aaa' }}>
                                        <th style={{ padding: '10px' }}>Kod</th>
                                        <th>İsim</th>
                                        <th>Adres</th>
                                        <th>İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStores.map(s => (
                                        <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '10px', color: '#4CAF50' }}>{s.code}</td>
                                            <td>{s.name}</td>
                                            <td style={{ opacity: 0.7, fontSize: '0.9em' }}>{s.address}</td>
                                            <td>
                                                <button onClick={() => handleDelete(s.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredStores.length === 0 && <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '20px' }}>Kayıt bulunamadı.</p>}
                        </div>
                    </>
                )}

                {activeTab === 'import' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                                <strong>Çakışma Kontrolü:</strong>
                                <p style={{ fontSize: '0.9rem', margin: '5px 0' }}>
                                    Sistem <b>Mağaza Kodu</b>'na bakar.
                                    <br />🔸 Eğer kod varsa: Bilgileri <b>GÜNCELLER</b>.
                                    <br />🔹 Eğer kod yoksa: Yeni kayıt <b>EKLER</b>.
                                    <br />(Yani aynı listeyi tekrar yüklemekten korkmayın, sadece güncellenir.)
                                </p>
                            </div>

                            <textarea
                                className="glass-input"
                                rows="15"
                                placeholder={"KOD\tİSİM\tADRES\nA101-001\tA101 Şube\tİzmir..."}
                                value={csvData}
                                onChange={handleTextChange}
                                style={{ fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre' }}
                            />
                            <button onClick={handleImport} className="glass-btn" style={{ marginTop: '10px', background: 'rgba(76, 175, 80, 0.3)', width: '100%' }}>
                                {status || `Yükle / Güncelle (${previewData.length})`}
                            </button>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', overflowY: 'auto', maxHeight: '500px' }}>
                            <h4 style={{ marginTop: 0 }}>Önizleme</h4>
                            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #555' }}>
                                        <th>Kod</th>
                                        <th>İsim</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.slice(0, 50).map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                            <td style={{ color: '#4CAF50' }}>{row.code}</td>
                                            <td>{row.name}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StoreImport;
