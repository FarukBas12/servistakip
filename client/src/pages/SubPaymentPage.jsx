import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Upload, Plus, Save, FileText, Paperclip, PlusCircle, Camera, Trash2 } from 'lucide-react';

const SubPaymentPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Header Data
    const [header, setHeader] = useState({
        store_name: '',
        title: '',
        date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
        waybill_info: '',
        kdv_rate: 20
    });

    // File
    const [waybillFile, setWaybillFile] = useState(null);

    // Data
    const [prices, setPrices] = useState([]); // Available items
    const [quantities, setQuantities] = useState({}); // Entered metraj
    const [customPrices, setCustomPrices] = useState({}); // Overridden prices
    const [customNames, setCustomNames] = useState({}); // Overridden names
    const [deletedItemIds, setDeletedItemIds] = useState(new Set()); // Hidden items
    const [loading, setLoading] = useState(false);

    // Modals
    const [showDataModal, setShowDataModal] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [showItemModal, setShowItemModal] = useState(false);
    const [newItem, setNewItem] = useState({ work_item: '', unit_price: '' });

    useEffect(() => { loadPrices(); }, []);

    const loadPrices = async () => {
        try {
            const res = await api.get(`/subs/prices?subId=${id}`);
            setPrices(res.data);
            setDeletedItemIds(new Set()); // Reset deletes on reload? Or keep? Reset seems safer.
        } catch (err) { console.error(err); }
    };

    const handleImportSubmit = async () => {
        if (!importFile) return alert('Lütfen bir dosya seçin');

        const formData = new FormData();
        formData.append('file', importFile);
        formData.append('subId', id);

        try {
            await api.post('/subs/prices/import', formData);
            alert('Veriler Yüklendi');
            loadPrices();
            setShowDataModal(false);
            setImportFile(null);
        } catch (err) {
            console.error(err);
            alert('Yükleme Başarısız');
        }
    };

    const handleAddItem = async () => {
        if (!newItem.work_item) return alert('Kalem adı giriniz');
        try {
            await api.post('/subs/prices', { subId: id, ...newItem });
            alert('Kalem Eklendi');
            setNewItem({ work_item: '', unit_price: '' });
            setShowItemModal(false);
            loadPrices();
        } catch (err) { alert('Hata'); }
    }

    const handleSave = async () => {
        if (loading) return;
        if (!header.store_name || !header.title) return alert('Mağaza ve Hakediş Adı giriniz');

        // Filter out deleted items and items with 0 quantity
        const activeItems = prices.filter(p => !deletedItemIds.has(p.id) && quantities[p.id] > 0);

        const items = activeItems.map(p => ({
            work_item: customNames[p.id] !== undefined ? customNames[p.id] : p.work_item, // Use custom name if exists
            unit_price: customPrices[p.id] !== undefined ? customPrices[p.id] : p.unit_price,
            quantity: quantities[p.id]
        }));

        if (items.length === 0) return alert('En az bir kalem giriniz');

        const formData = new FormData();
        formData.append('subcontractor_id', id);
        formData.append('title', header.title);
        formData.append('store_name', header.store_name);
        // Date Validation: Ensure valid date or default to today
        const validDate = header.date ? header.date : new Date().toISOString().split('T')[0];
        formData.append('payment_date', validDate);
        formData.append('waybill_info', header.waybill_info);
        formData.append('kdv_rate', header.kdv_rate || 20);
        if (waybillFile) formData.append('waybill', waybillFile);
        formData.append('items', JSON.stringify(items));

        try {
            setLoading(true);
            await api.post('/subs/payments', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Hakediş Kaydedildi');
            navigate('/admin/subs');
        } catch (err) {
            alert('Hata');
        } finally {
            setLoading(false);
        }
    };

    const deleteItem = async (id) => {
        if (!window.confirm('Bu kalemi KALICI olarak silmek istediğinize emin misiniz?')) return;

        try {
            await api.delete(`/subs/prices/${id}`);
            // Remove from local state immediately for better UX
            setPrices(prev => prev.filter(p => p.id !== id));
            // Also clean up any typed quantities or custom values
            const newQuantities = { ...quantities };
            delete newQuantities[id];
            setQuantities(newQuantities);
        } catch (err) {
            console.error(err);
            alert('Silme işlemi başarısız oldu.');
        }
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

                {/* Actions Row */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    {/* Waybill Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <input
                                className="glass-input"
                                placeholder="İrsaliye No/Bilgi"
                                value={header.waybill_info}
                                onChange={e => setHeader({ ...header, waybill_info: e.target.value })}
                                style={{ width: '150px' }}
                            />
                            <label className="glass-btn" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 10px' }}>
                                <Camera size={18} />
                                <input type="file" onChange={e => setWaybillFile(e.target.files[0])} hidden />
                            </label>
                        </div>
                        {waybillFile && <span style={{ fontSize: '0.8rem', color: '#4caf50' }}>Fotoğraf Seçildi: {waybillFile.name}</span>}
                    </div>

                    <button className="glass-btn" style={{ display: 'flex', gap: '5px', alignItems: 'center' }} onClick={() => setShowItemModal(true)}>
                        <PlusCircle size={18} /> Manuel Kalem Ekle
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
                <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.1)', textAlign: 'left' }}>
                            <th style={{ padding: '12px' }}>Kalem (Düzenlenebilir)</th>
                            <th style={{ padding: '12px' }}>Birim Fiyat</th>
                            <th style={{ padding: '12px' }}>Metraj</th>
                            <th style={{ padding: '12px', textAlign: 'right' }}>Tutar</th>
                            <th style={{ padding: '12px', width: '50px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {prices.filter(p => !deletedItemIds.has(p.id)).map(p => {
                            const qty = parseFloat(quantities[p.id]) || 0;
                            const unitPrice = customPrices[p.id] !== undefined ? parseFloat(customPrices[p.id]) : parseFloat(p.unit_price);
                            const total = qty * unitPrice;
                            return (
                                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: qty > 0 ? 'rgba(76, 175, 80, 0.1)' : 'transparent' }}>
                                    <td style={{ padding: '8px' }} data-label="Kalem">
                                        <input
                                            className="glass-input"
                                            value={customNames[p.id] !== undefined ? customNames[p.id] : p.work_item}
                                            onChange={e => setCustomNames({ ...customNames, [p.id]: e.target.value })}
                                            style={{ width: '100%' }}
                                        />
                                    </td>
                                    <td style={{ padding: '8px' }} data-label="Birim Fiyat">
                                        <input
                                            type="number"
                                            className="glass-input"
                                            value={customPrices[p.id] !== undefined ? customPrices[p.id] : p.unit_price}
                                            onChange={e => setCustomPrices({ ...customPrices, [p.id]: e.target.value })}
                                            style={{ width: '120px' }}
                                        />
                                        <span style={{ marginLeft: '5px', fontSize: '0.8rem', opacity: 0.6 }}>₺</span>
                                    </td>
                                    <td style={{ padding: '8px' }} data-label="Metraj">
                                        <input
                                            type="number"
                                            className="glass-input"
                                            placeholder="0"
                                            style={{ width: '100px', textAlign: 'center' }}
                                            value={quantities[p.id] || ''}
                                            onChange={e => setQuantities({ ...quantities, [p.id]: e.target.value })}
                                        />
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }} data-label="Tutar">
                                        {total > 0 ? total.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺' : '-'}
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'center' }} data-label="İşlem">
                                        <button onClick={() => deleteItem(p.id)} className="glass-btn" style={{ padding: '5px', color: '#f44336' }} title="Listeden Çıkar">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {/* Totals */}
                {/* Totals */}
                {/* Compact Summary Card */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '380px', padding: '25px', borderRadius: '16px', background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>

                        {/* Subtotal */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Ara Toplam</span>
                            <span style={{ fontWeight: '600', fontSize: '1.1rem', color: '#e2e8f0' }}>
                                {prices.filter(p => !deletedItemIds.has(p.id)).reduce((acc, p) => {
                                    const qty = parseFloat(quantities[p.id]) || 0;
                                    const unitPrice = customPrices[p.id] !== undefined ? parseFloat(customPrices[p.id]) : parseFloat(p.unit_price);
                                    return acc + (qty * unitPrice);
                                }, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </span>
                        </div>

                        {/* KDV */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.95rem' }}>KDV</span>
                                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px 6px', display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#fbbf24', marginRight: '2px' }}>%</span>
                                    <input
                                        type="number"
                                        value={header.kdv_rate || 20}
                                        onChange={e => setHeader({ ...header, kdv_rate: e.target.value })}
                                        style={{ width: '24px', background: 'transparent', border: 'none', color: '#fbbf24', fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center', padding: 0 }}
                                    />
                                </div>
                            </div>
                            <span style={{ color: '#fbbf24', fontWeight: '500', fontSize: '1rem' }}>
                                {(prices.filter(p => !deletedItemIds.has(p.id)).reduce((acc, p) => {
                                    const qty = parseFloat(quantities[p.id]) || 0;
                                    const unitPrice = customPrices[p.id] !== undefined ? parseFloat(customPrices[p.id]) : parseFloat(p.unit_price);
                                    return acc + (qty * unitPrice);
                                }, 0) * ((header.kdv_rate || 20) / 100)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </span>
                        </div>

                        {/* Divider */}
                        <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '16px 0 20px 0' }}></div>

                        {/* Grand Total */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc' }}>GENEL TOPLAM</span>
                            <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#4caf50', letterSpacing: '-0.5px' }}>
                                {(prices.filter(p => !deletedItemIds.has(p.id)).reduce((acc, p) => {
                                    const qty = parseFloat(quantities[p.id]) || 0;
                                    const unitPrice = customPrices[p.id] !== undefined ? parseFloat(customPrices[p.id]) : parseFloat(p.unit_price);
                                    return acc + (qty * unitPrice);
                                }, 0) * (1 + ((header.kdv_rate || 20) / 100))).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </span>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="glass-btn"
                            style={{
                                width: '100%',
                                background: loading ? '#64748b' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                border: 'none',
                                padding: '14px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderRadius: '12px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                            }}
                        >
                            <Save size={20} style={{ marginRight: '8px' }} /> {loading ? 'Kaydediliyor...' : 'Hakedişi Kaydet'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Excel Upload Modal */}
            {showDataModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-panel" style={{ width: '400px', padding: '30px' }}>
                        <h3>Excel'den Veri Yükle</h3>
                        <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Format: "Kalem", "Birim Fiyat" sütunları olmalı.</p>
                        <input type="file" onChange={(e) => setImportFile(e.target.files[0])} style={{ display: 'block', margin: '20px 0' }} />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleImportSubmit} className="glass-btn" style={{ flex: 1, background: '#4caf50' }}>Yükle</button>
                            <button onClick={() => setShowDataModal(false)} className="glass-btn" style={{ flex: 1, background: '#f44336' }}>Vazgeç</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Item Modal */}
            {showItemModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-panel" style={{ width: '350px', padding: '25px' }}>
                        <h3>Yeni Kalem Ekle</h3>
                        <input className="glass-input" placeholder="İş Kalemi Adı" value={newItem.work_item} onChange={e => setNewItem({ ...newItem, work_item: e.target.value })} />
                        <input type="number" className="glass-input" placeholder="Birim Fiyat" value={newItem.unit_price} onChange={e => setNewItem({ ...newItem, unit_price: e.target.value })} style={{ marginTop: '10px' }} />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={handleAddItem} className="glass-btn" style={{ flex: 1, background: '#4caf50' }}>Ekle</button>
                            <button onClick={() => setShowItemModal(false)} className="glass-btn" style={{ flex: 1, background: '#f44336' }}>İptal</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubPaymentPage;
