import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { ArrowLeft, Upload, Trash2, Search, Save, UserPlus, Users } from 'lucide-react';

const PriceList = () => {
    const navigate = useNavigate();
    const [prices, setPrices] = useState([]);
    const [subcontractors, setSubcontractors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Subcontractor State
    const [newSub, setNewSub] = useState({ name: '', phone: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [priceRes, subRes] = await Promise.all([
                api.get('/definitions/prices'),
                api.get('/definitions/subs')
            ]);
            setPrices(priceRes.data);
            setSubcontractors(subRes.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    // --- Price List Logic ---
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            // Expect columns: "İş Kalemi", "Detay", "Birim Fiyat"

            const items = data.map(row => ({
                work_item: row['İş Kalemi'] || row['iş kalemi'] || row['Work Item'],
                detail: row['Detay'] || row['detay'] || row['Detail'] || '',
                unit_price: row['Birim Fiyat'] || row['birim fiyat'] || row['Unit Price'] || 0
            })).filter(i => i.work_item);

            if (items.length === 0) return alert('Format anlaşılamadı. Lütfen sütun adlarını kontrol edin: "İş Kalemi", "Birim Fiyat"');

            try {
                await api.post('/definitions/prices/import', { items });
                alert(`${items.length} kalem başarıyla aktarıldı/güncellendi.`);
                fetchData();
            } catch (err) {
                alert('Yükleme başarısız');
            }
        };
        reader.readAsBinaryString(file);
    };

    const deletePrice = async (id) => {
        if (!window.confirm('Silinsin mi?')) return;
        try {
            await api.delete(`/definitions/prices/${id}`);
            setPrices(prices.filter(p => p.id !== id));
        } catch (err) {
            alert('Hata');
        }
    };

    const filteredPrices = prices.filter(p =>
        p.work_item.toLowerCase().includes(search.toLowerCase()) ||
        (p.detail && p.detail.toLowerCase().includes(search.toLowerCase()))
    );

    // --- Subcontractor Logic ---
    const handleAddSub = async () => {
        if (!newSub.name) return;
        try {
            const res = await api.post('/definitions/subs', newSub);
            setSubcontractors([...subcontractors, res.data]);
            setNewSub({ name: '', phone: '' });
        } catch (err) {
            alert('Hata');
        }
    };

    const deleteSub = async (id) => {
        if (!window.confirm('Bu personeli silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/definitions/subs/${id}`);
            setSubcontractors(subcontractors.filter(s => s.id !== id));
        } catch (err) {
            alert('Hata');
        }
    };

    return (
        <div className="dashboard">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                <button onClick={() => navigate('/admin')} className="glass-btn" style={{ padding: '8px' }}>
                    <ArrowLeft size={20} />
                </button>
                <h2 style={{ margin: 0 }}>Tanımlamalar (Fiyat & Personel)</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                {/* --- LEFT: PRICE LIST --- */}
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0 }}>📊 Birim Fiyat Listesi</h3>
                        <label className="glass-btn" style={{ cursor: 'pointer', fontSize: '0.9rem', padding: '8px 15px' }}>
                            <Upload size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                            Excel Yükle
                            <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileUpload} />
                        </label>
                    </div>

                    <div style={{ marginBottom: '15px', position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                        <input
                            className="glass-input"
                            style={{ paddingLeft: '35px' }}
                            placeholder="Kalem Ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div style={{ height: '400px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                    <th style={{ padding: '8px' }}>İş Kalemi</th>
                                    <th style={{ padding: '8px' }}>Detay</th>
                                    <th style={{ padding: '8px' }}>Fiyat</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPrices.map(p => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '8px' }}>{p.work_item}</td>
                                        <td style={{ padding: '8px', opacity: 0.7 }}>{p.detail}</td>
                                        <td style={{ padding: '8px', fontWeight: 'bold' }}>{p.unit_price} ₺</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button onClick={() => deletePrice(p.id)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer' }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- RIGHT: SUBCONTRACTORS --- */}
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0 }}>👷 Taşeron / Personel</h3>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                        <input
                            className="glass-input"
                            placeholder="Ad Soyad"
                            value={newSub.name}
                            onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                        />
                        <input
                            className="glass-input"
                            placeholder="Telefon"
                            value={newSub.phone}
                            onChange={(e) => setNewSub({ ...newSub, phone: e.target.value })}
                        />
                        <button onClick={handleAddSub} className="glass-btn" style={{ background: 'rgba(76, 175, 80, 0.3)' }}>
                            <UserPlus size={20} />
                        </button>
                    </div>

                    <div style={{ height: '400px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                    <th style={{ padding: '8px' }}>Ad Soyad</th>
                                    <th style={{ padding: '8px' }}>Telefon</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {subcontractors.map(s => (
                                    <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '8px', fontWeight: 'bold' }}>{s.name}</td>
                                        <td style={{ padding: '8px', opacity: 0.7 }}>{s.phone}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button onClick={() => deleteSub(s.id)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer' }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PriceList;
