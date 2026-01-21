import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, PlusCircle, Edit2, FileText, DollarSign, X } from 'lucide-react';

const SubcontractorDashboard = () => {
    const navigate = useNavigate();
    const [subs, setSubs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedSub, setSelectedSub] = useState(null);
    const [payData, setPayData] = useState({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });

    // Create Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newSub, setNewSub] = useState({ name: '', phone: '' });

    useEffect(() => { fetchSubs(); }, []);

    const fetchSubs = async () => {
        try {
            const res = await api.get('/subs');
            setSubs(res.data);
            setLoading(false);
        } catch (err) { console.error(err); setLoading(false); }
    };

    const handleCashPayload = async () => {
        if (!payData.amount) return alert('Tutar giriniz');
        try {
            await api.post('/subs/cash', { subcontractor_id: selectedSub.id, ...payData });
            alert('Ödeme Kaydedildi');
            setShowPayModal(false);
            setPayData({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });
            fetchSubs();
        } catch (err) { alert('Hata'); }
    };

    const handleCreateSub = async () => {
        if (!newSub.name) return alert('İsim Giriniz');
        try {
            await api.post('/subs', newSub);
            alert('Taşeron Eklendi');
            setShowCreateModal(false);
            setNewSub({ name: '', phone: '' });
            fetchSubs();
        } catch (err) { alert('Hata'); }
    };

    return (
        <div className="dashboard">
            <h2 style={{ marginBottom: '20px' }}>Taşeron Listesi</h2>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {subs.map(sub => (
                    <div key={sub.id} className="glass-panel" style={{ padding: '20px', position: 'relative' }}>
                        {/* Edit Button (Top Right) */}
                        <button style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                            <Edit2 size={18} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '50%' }}>
                                <User size={32} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0 }}>{sub.name}</h3>
                                <p style={{ margin: 0, opacity: 0.6 }}>Bakiye</p>
                                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#ff9800' }}>
                                    {parseFloat(sub.balance).toLocaleString('tr-TR')} ₺
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <button
                                onClick={() => navigate(`/admin/subs/${sub.id}/payment`)}
                                className="glass-btn"
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px' }}
                            >
                                <FileText size={24} style={{ marginBottom: '5px' }} />
                                <span>Hakediş Ekle</span>
                            </button>
                            <button
                                onClick={() => { setSelectedSub(sub); setShowPayModal(true); }}
                                className="glass-btn"
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px', background: 'rgba(76, 175, 80, 0.2)' }}
                            >
                                <DollarSign size={24} style={{ marginBottom: '5px' }} />
                                <span>Ödeme Ekle</span>
                            </button>
                        </div>
                    </div>
                ))}

                {/* New Sub Button */}
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="glass-panel"
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(255,255,255,0.2)', cursor: 'pointer', minHeight: '200px' }}
                >
                    <PlusCircle size={40} style={{ marginBottom: '10px', opacity: 0.5 }} />
                    <span>Yeni Taşeron</span>
                </button>
            </div>

            {/* Cash Modal */}
            {showPayModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-panel" style={{ width: '350px', padding: '25px' }}>
                        <h3>Nakit Ödeme: {selectedSub.name}</h3>
                        <input type="date" className="glass-input" value={payData.date} onChange={e => setPayData({ ...payData, date: e.target.value })} />
                        <input type="number" className="glass-input" placeholder="Tutar" value={payData.amount} onChange={e => setPayData({ ...payData, amount: e.target.value })} style={{ marginTop: '10px' }} />
                        <input className="glass-input" placeholder="Açıklama" value={payData.description} onChange={e => setPayData({ ...payData, description: e.target.value })} style={{ marginTop: '10px' }} />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={handleCashPayload} className="glass-btn" style={{ flex: 1, background: '#4caf50' }}>Kaydet</button>
                            <button onClick={() => setShowPayModal(false)} className="glass-btn" style={{ flex: 1, background: '#f44336' }}>İptal</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Sub Modal */}
            {showCreateModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-panel" style={{ width: '350px', padding: '25px' }}>
                        <h3>Yeni Taşeron Ekle</h3>
                        <input className="glass-input" placeholder="Taşeron Adı ve Soyadı" value={newSub.name} onChange={e => setNewSub({ ...newSub, name: e.target.value })} />
                        <input className="glass-input" placeholder="Telefon (İsteğe bağlı)" value={newSub.phone} onChange={e => setNewSub({ ...newSub, phone: e.target.value })} style={{ marginTop: '10px' }} />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={handleCreateSub} className="glass-btn" style={{ flex: 1, background: '#4caf50' }}>Ekle</button>
                            <button onClick={() => setShowCreateModal(false)} className="glass-btn" style={{ flex: 1, background: '#f44336' }}>İptal</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubcontractorDashboard;
