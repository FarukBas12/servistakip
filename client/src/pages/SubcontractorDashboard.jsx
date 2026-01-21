import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, PlusCircle, Wallet, X, DollarSign, FileText } from 'lucide-react';

const SubcontractorDashboard = () => {
    const navigate = useNavigate();
    const [subs, setSubs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedSub, setSelectedSub] = useState(null);
    const [payData, setPayData] = useState({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        fetchSubs();
    }, []);

    const fetchSubs = async () => {
        try {
            const res = await api.get('/definitions/subs');
            setSubs(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleAddPayment = async () => {
        if (!payData.amount) return alert('Tutar giriniz');
        try {
            await api.post('/definitions/subs/transaction', {
                subcontractor_id: selectedSub.id,
                ...payData
            });
            setShowPayModal(false);
            setPayData({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });
            fetchSubs(); // Refresh balances
            alert('Ödeme eklendi');
        } catch (err) {
            alert('Hata oluştu');
        }
    };

    const openPayModal = (sub) => {
        setSelectedSub(sub);
        setShowPayModal(true);
    };

    return (
        <div className="dashboard">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                <button onClick={() => navigate('/admin')} className="glass-btn" style={{ padding: '8px' }}>
                    <ArrowLeft size={20} />
                </button>
                <h2 style={{ margin: 0 }}>Taşeron Cari Hesapları</h2>
            </div>

            {/* Grid Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {loading ? <p>Yükleniyor...</p> : subs.map(sub => (
                    <div key={sub.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {/* Header: Name & Balance */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '50%' }}>
                                    <User size={24} />
                                </div>
                                <h3 style={{ margin: 0 }}>{sub.name}</h3>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <small style={{ opacity: 0.6 }}>Bakiye</small>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: parseFloat(sub.balance) > 0 ? '#ff9800' : '#4caf50' }}>
                                    {parseFloat(sub.balance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: 0 }} />

                        {/* Actions */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/admin/subs/${sub.id}`); }}
                                className="glass-btn"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.9rem' }}
                            >
                                <FileText size={16} /> Detay / Hakediş
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); openPayModal(sub); }}
                                className="glass-btn"
                                style={{ background: 'rgba(76, 175, 80, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.9rem' }}
                            >
                                <DollarSign size={16} /> Ödeme Ekle
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Payment Modal */}
            {showPayModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="glass-panel" style={{ width: '400px', padding: '30px', position: 'relative' }}>
                        <button
                            onClick={() => setShowPayModal(false)}
                            style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>

                        <h3 style={{ marginTop: 0 }}>Ödeme Yap: {selectedSub?.name}</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', opacity: 0.7 }}>Tarih</label>
                                <input
                                    type="date"
                                    className="glass-input"
                                    value={payData.date}
                                    onChange={e => setPayData({ ...payData, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', opacity: 0.7 }}>Tutar (TL)</label>
                                <input
                                    type="number"
                                    className="glass-input"
                                    placeholder="0.00"
                                    value={payData.amount}
                                    onChange={e => setPayData({ ...payData, amount: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', opacity: 0.7 }}>Açıklama</label>
                                <input
                                    className="glass-input"
                                    placeholder="Nakit, Havale vb."
                                    value={payData.description}
                                    onChange={e => setPayData({ ...payData, description: e.target.value })}
                                />
                            </div>
                            <button onClick={handleAddPayment} className="glass-btn" style={{ background: 'rgba(76, 175, 80, 0.4)', marginTop: '10px' }}>
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubcontractorDashboard;
