import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, PlusCircle, Upload, Save, Trash2, FileText, CheckCircle, Phone } from 'lucide-react';

const SubcontractorDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [sub, setSub] = useState(null);
    const [prices, setPrices] = useState([]); // The Contract Items
    // Hakediş Creation State (Tab 2)
    const [quantities, setQuantities] = useState({});
    const [paymentHeader, setPaymentHeader] = useState({
        title: '',
        date: new Date().toLocaleDateString('en-CA'),
        kdv_rate: 20
    });

    // UI Tabs
    const [activeTab, setActiveTab] = useState('contract'); // contract | payment | ledger

    useEffect(() => {
        fetchSubData();
    }, [id]);

    const fetchSubData = async () => {
        try {
            const res = await api.get('/definitions/subs');
            const found = res.data.find(s => s.id === parseInt(id));
            setSub(found);

            const pricesRes = await api.get(`/definitions/prices?subId=${id}`);
            setPrices(pricesRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('subId', id); // Link to this sub

        try {
            await api.post('/definitions/prices/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Fiyat listesi yüklendi');
            fetchSubData();
        } catch (err) {
            alert('Hata');
        }
    };

    const handleCreatePayment = async () => {
        if (!paymentHeader.title) return alert('Lütfen Proje/Mağaza Adı giriniz');

        // Filter items with quantity > 0
        const itemsToSave = prices.filter(p => quantities[p.id] && parseFloat(quantities[p.id]) > 0).map(p => ({
            work_item: p.work_item,
            detail: p.detail,
            unit_price: p.unit_price,
            quantity: quantities[p.id]
        }));

        if (itemsToSave.length === 0) return alert('Lütfen en az bir kaleme metraj giriniz');

        try {
            await api.post('/payments', {
                title: paymentHeader.title,
                payment_date: paymentHeader.date,
                subcontractor_id: id,
                kdv_rate: paymentHeader.kdv_rate !== '' ? paymentHeader.kdv_rate : 20,
                items: itemsToSave
            });
            alert('Hakediş oluşturuldu!');
            setQuantities({});
            setPaymentHeader({ title: '', date: new Date().toLocaleDateString('en-CA'), kdv_rate: 20 });
        } catch (err) {
            alert('Hata');
        }
    };

    if (!sub) return <div className="dashboard">Yükleniyor...</div>;

    const calculateTotal = () => {
        return prices.reduce((acc, p) => acc + ((parseFloat(quantities[p.id]) || 0) * parseFloat(p.unit_price)), 0);
    };

    return (
        <div className="dashboard">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                <button onClick={() => navigate('/admin/subs')} className="glass-btn" style={{ padding: '8px' }}>
                    <ArrowLeft size={20} />
                </button>

                {/* Profile Photo */}
                <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)'
                }}>
                    <User size={48} />
                </div>

                <div>
                    <h2 style={{ margin: 0 }}>{sub.name}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', opacity: 0.7 }}>
                        {sub.phone && <Phone size={14} />}
                        <span style={{ fontSize: '0.9rem' }}>{sub.phone || 'Telefon Yok'}</span>
                    </div>
                    <p style={{ margin: '4px 0 0 0', opacity: 0.5, fontSize: '0.85rem' }}>Bakiye: {parseFloat(sub.balance).toLocaleString('tr-TR')} ₺</p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                    onClick={() => setActiveTab('contract')}
                    className={`glass-btn ${activeTab === 'contract' ? 'active' : ''}`}
                    style={{ background: activeTab === 'contract' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
                >
                    📋 Fiyat Listesi (Sözleşme)
                </button>
                <button
                    onClick={() => setActiveTab('payment')}
                    className={`glass-btn ${activeTab === 'payment' ? 'active' : ''}`}
                    style={{ background: activeTab === 'payment' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(0,0,0,0.2)' }}
                >
                    💰 Yeni Hakediş Yap
                </button>
            </div>

            {/* CONTENT: Contract */}
            {activeTab === 'contract' && (
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <div style={{ marginBottom: '20px', border: '1px dashed rgba(255,255,255,0.3)', padding: '20px', borderRadius: '10px' }}>
                        <h4 style={{ margin: '0 0 10px 0' }}><Upload size={16} /> Excel Fiyat Listesi Yükle</h4>
                        <input type="file" onChange={handleImport} />
                        <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Sütunlar: "İş Kalemi", "Detay", "Birim Fiyat"</p>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                <th style={{ padding: '10px' }}>İş Kalemi</th>
                                <th style={{ padding: '10px' }}>Birim Fiyat</th>
                                <th style={{ padding: '10px' }}>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {prices.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '10px' }}>{p.work_item} <br /><small style={{ opacity: 0.6 }}>{p.detail}</small></td>
                                    <td style={{ padding: '10px' }}>{parseFloat(p.unit_price).toLocaleString('tr-TR')} ₺</td>
                                    <td>
                                        <button onClick={async () => {
                                            if (window.confirm('Silinsin mi?')) {
                                                await api.delete(`/definitions/prices/${p.id}`);
                                                fetchSubData();
                                            }
                                        }} style={{ background: 'none', border: 'none', color: '#f44336', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* CONTENT: Create Payment */}
            {activeTab === 'payment' && (
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <label>Proje / Mağaza Adı</label>
                            <input
                                className="glass-input"
                                value={paymentHeader.title}
                                onChange={e => setPaymentHeader({ ...paymentHeader, title: e.target.value })}
                                placeholder="Örn: Erenler Hacıoğlu"
                            />
                        </div>
                        <div>
                            <label>Tarih</label>
                            <input
                                type="date"
                                className="glass-input"
                                value={paymentHeader.date}
                                onChange={e => setPaymentHeader({ ...paymentHeader, date: e.target.value })}
                            />
                        </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                <th style={{ padding: '10px', width: '40%' }}>İş Kalemi</th>
                                <th style={{ padding: '10px', width: '20%' }}>Birim Fiyat</th>
                                <th style={{ padding: '10px', width: '20%' }}>Metraj (Adet/m2)</th>
                                <th style={{ padding: '10px', width: '20%', textAlign: 'right' }}>Tutar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {prices.map(p => {
                                const qty = parseFloat(quantities[p.id]) || 0;
                                const total = qty * parseFloat(p.unit_price);
                                return (
                                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: qty > 0 ? 'rgba(76, 175, 80, 0.1)' : 'transparent' }}>
                                        <td style={{ padding: '10px' }}>{p.work_item}</td>
                                        <td style={{ padding: '10px' }}>{parseFloat(p.unit_price).toLocaleString('tr-TR')} ₺</td>
                                        <td style={{ padding: '5px' }}>
                                            <input
                                                type="number"
                                                className="glass-input"
                                                style={{ textAlign: 'center' }}
                                                placeholder="0"
                                                value={quantities[p.id] || ''}
                                                onChange={e => setQuantities({ ...quantities, [p.id]: e.target.value })}
                                            />
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                                            {total > 0 ? total.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺' : '-'}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                        <tfoot>
                            <tr>
                                 <td colSpan="4" style={{ padding: '0' }}>
                                     <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '30px 0' }}>
                                         <div className="glass-panel" style={{ 
                                             width: '100%', 
                                             maxWidth: '350px', 
                                             padding: '20px', 
                                             borderRadius: '12px', 
                                             background: 'rgba(30,41,59,0.5)',
                                             border: '1px solid rgba(255,255,255,0.1)'
                                         }}>
                                             {/* Subtotal */}
                                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', opacity: 0.8 }}>
                                                 <span>Ara Toplam</span>
                                                 <span style={{ fontWeight: '600' }}>{calculateTotal().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                             </div>

                                             {/* KDV Row */}
                                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                     <span style={{ opacity: 0.8 }}>KDV Oranı</span>
                                                     <div style={{ 
                                                         background: 'rgba(251, 191, 36, 0.1)', 
                                                         borderRadius: '8px', 
                                                         padding: '4px 10px', 
                                                         display: 'flex', 
                                                         alignItems: 'center', 
                                                         border: '1px solid rgba(251, 191, 36, 0.2)' 
                                                     }}>
                                                         <input
                                                             type="number"
                                                             value={paymentHeader.kdv_rate}
                                                             onChange={e => setPaymentHeader({ ...paymentHeader, kdv_rate: e.target.value })}
                                                             style={{ 
                                                                 width: '35px', 
                                                                 background: 'transparent', 
                                                                 border: 'none', 
                                                                 color: '#fbbf24', 
                                                                 fontWeight: '700', 
                                                                 fontSize: '1rem', 
                                                                 textAlign: 'center', 
                                                                 padding: 0,
                                                                 outline: 'none'
                                                             }}
                                                         />
                                                         <span style={{ fontSize: '0.9rem', color: '#fbbf24', fontWeight: 'bold' }}>%</span>
                                                     </div>
                                                 </div>
                                                 <span style={{ color: '#fbbf24', fontWeight: '600' }}>
                                                     {(calculateTotal() * ((paymentHeader.kdv_rate !== '' ? paymentHeader.kdv_rate : 20) / 100)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                 </span>
                                             </div>

                                             <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '15px 0' }} />

                                             {/* Grand Total */}
                                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>GENEL TOPLAM</span>
                                                <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#4caf50' }}>
                                                    {(calculateTotal() * (1 + ((paymentHeader.kdv_rate !== '' ? paymentHeader.kdv_rate : 20) / 100))).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                </span>
                                             </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    <div style={{ textAlign: 'right', marginTop: '20px' }}>
                        <button onClick={handleCreatePayment} className="glass-btn" style={{ background: '#4CAF50', color: 'white' }}>
                            <CheckCircle size={20} style={{ marginRight: '5px' }} /> Hakedişi Onayla ve Kaydet
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubcontractorDetail;
