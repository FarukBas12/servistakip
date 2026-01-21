import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Upload, Plus, Save, FileText, Paperclip } from 'lucide-react';

const SubPaymentPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Header Data
    const [header, setHeader] = useState({
        store_name: '',
        title: '',
        date: new Date().toISOString().split('T')[0],
        waybill: '' // Just text/ref for now, could be file
    });

    // Data
    const [prices, setPrices] = useState([]); // Available items
    const [quantities, setQuantities] = useState({}); // Entered metraj

    // Modals
    const [showDataModal, setShowDataModal] = useState(false);

    useEffect(() => { loadPrices(); }, []);

    const loadPrices = async () => {
        const res = await api.get(`/subs/prices?subId=${id}`);
        setPrices(res.data);
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('subId', id);
        await api.post('/subs/prices/import', formData);
        loadPrices();
        setShowDataModal(false);
    };

    const handleSave = async () => {
        if (!header.store_name || !header.title) return alert('Mağaza ve Hakediş Adı giriniz');

        const items = prices.filter(p => quantities[p.id] > 0).map(p => ({
            work_item: p.work_item,
            unit_price: p.unit_price,
            quantity: quantities[p.id]
        }));

        if (items.length === 0) return alert('En az bir kalem giriniz');

        try {
            await api.post('/subs/payments', {
                subcontractor_id: id,
                ...header,
                waybill_info: header.waybill,
                items
            });
            alert('Hakediş Kaydedildi');
            navigate('/admin/subs');
        } catch (err) { alert('Hata'); }
    };

    return (
        <div className="dashboard">
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <button onClick={() => navigate('/admin/subs')} className="glass-btn"><ArrowLeft size={20} /></button>
                <h2>Yeni Hakediş Oluştur</h2>
            </div>

            <div className="glass-panel" style={{ padding: '25px', marginBottom: '20px' }}>
                {/* Header Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                        <label>Mağaza Adı</label>
                        <input className="glass-input" value={header.store_name} onChange={e => setHeader({ ...header, store_name: e.target.value })} placeholder="Örn: Erenler AVM" />
                    </div>
                    <div>
                        <label>Hakediş Adı / No</label>
                        <input className="glass-input" value={header.title} onChange={e => setHeader({ ...header, title: e.target.value })} placeholder="Örn: Hakediş #1" />
                    </div>
                </div>

                {/* Actions Row (Sketch Based) */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                    <button className="glass-btn" style={{ display: 'flex', gap: '5px', alignItems: 'center' }} onClick={() => {
                        const val = prompt('İrsaliye No / Bilgisi Giriniz:');
                        if (val) setHeader({ ...header, waybill: val });
                    }}>
                        <Paperclip size={18} />
                        {header.waybill ? `İrsaliye: ${header.waybill}` : 'İrsaliye Ekle'}
                    </button>

                    <button className="glass-btn" style={{ display: 'flex', gap: '5px', alignItems: 'center' }} onClick={() => setShowDataModal(true)}>
                        <Upload size={18} /> Fiyat/Kalem Data Ekle (Excel)
                    </button>

                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>Tarih:</span>
                        <input type="date" className="glass-input" value={header.date} onChange={e => setHeader({ ...header, date: e.target.value })} />
                    </div>
                </div>

                {/* Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.1)', textAlign: 'left' }}>
                            <th style={{ padding: '12px' }}>Kalem</th>
                            <th style={{ padding: '12px' }}>Datadaki Tutar (Birim)</th>
                            <th style={{ padding: '12px' }}>Metraj</th>
                            <th style={{ padding: '12px', textAlign: 'right' }}>Tutar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {prices.map(p => {
                            const qty = parseFloat(quantities[p.id]) || 0;
                            const total = qty * parseFloat(p.unit_price);
                            return (
                                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: qty > 0 ? 'rgba(76, 175, 80, 0.1)' : 'transparent' }}>
                                    <td style={{ padding: '12px' }}>{p.work_item}</td>
                                    <td style={{ padding: '12px' }}>{parseFloat(p.unit_price).toLocaleString('tr-TR')} ₺</td>
                                    <td style={{ padding: '8px' }}>
                                        <input
                                            type="number"
                                            className="glass-input"
                                            placeholder="0"
                                            style={{ width: '100px', textAlign: 'center' }}
                                            value={quantities[p.id] || ''}
                                            onChange={e => setQuantities({ ...quantities, [p.id]: e.target.value })}
                                        />
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                                        {total > 0 ? total.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺' : '-'}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                <div style={{ marginTop: '30px', textAlign: 'right' }}>
                    <h3 style={{ color: '#4caf50' }}>GENEL TOPLAM: {prices.reduce((acc, p) => acc + ((parseFloat(quantities[p.id]) || 0) * parseFloat(p.unit_price)), 0).toLocaleString('tr-TR')} ₺</h3>
                    <button onClick={handleSave} className="glass-btn" style={{ background: '#4caf50', marginTop: '10px', padding: '10px 30px' }}>Kaydet</button>
                </div>
            </div>

            {/* Excel Upload Modal */}
            {showDataModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-panel" style={{ width: '400px', padding: '30px' }}>
                        <h3>Excel'den Veri Yükle</h3>
                        <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Format: "Kalem", "Birim Fiyat" sütunları olmalı.</p>
                        <input type="file" onChange={handleImport} style={{ display: 'block', margin: '20px 0' }} />
                        <button onClick={() => setShowDataModal(false)} className="glass-btn" style={{ width: '100%', background: '#f44336' }}>Vazgeç</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubPaymentPage;
