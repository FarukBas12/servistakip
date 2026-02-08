import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, PlusCircle, Edit2, FileText, DollarSign, X, Trash2, ScrollText } from 'lucide-react';

const SubcontractorDashboard = () => {
    const navigate = useNavigate();
    const [subs, setSubs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedSub, setSelectedSub] = useState(null);
    const [payData, setPayData] = useState({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });

    // Create/Edit/Delete Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
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

    const handleEditSub = async () => {
        if (!newSub.name) return alert('İsim Giriniz');

        try {
            const payload = {
                name: newSub.name,
                phone: newSub.phone || ''
            };

            await api.put(`/subs/${selectedSub.id}`, payload);
            alert('Güncellendi');
            setShowEditModal(false);
            fetchSubs();
        } catch (err) {
            console.error(err);
            alert('Hata Oluştu');
        }
    };

    const handleDeleteSub = async () => {
        if (!deletePassword) return alert('Şifre Giriniz');
        try {
            await api.post(`/subs/${selectedSub.id}/delete`, { password: deletePassword });
            alert('Taşeron Silindi');
            setShowDeleteModal(false);
            setDeletePassword('');
            fetchSubs();
        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 403) {
                alert('Hatalı Şifre!');
            } else {
                alert('Silme İşlemi Başarısız');
            }
        }
    };

    return (
        <div className="dashboard">
            <h2 style={{ marginBottom: '20px' }}>Taşeron Listesi</h2>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {subs.map(sub => (
                    <div key={sub.id} className="glass-panel" style={{ padding: '20px', position: 'relative' }}>
                        {/* Edit Button (Top Right) */}
                        <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '5px' }}>
                            <button
                                onClick={() => { setSelectedSub(sub); setNewSub({ name: sub.name, phone: sub.phone }); setShowEditModal(true); }}
                                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                                title="Düzenle"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                onClick={() => { setSelectedSub(sub); setShowDeleteModal(true); }}
                                style={{ background: 'none', border: 'none', color: '#f44336', cursor: 'pointer', opacity: 0.7 }}
                                title="Sil"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>



                        <div
                            onClick={() => navigate(`/admin/subs/${sub.id}`)}
                            style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', cursor: 'pointer' }}
                        >
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '50%',
                                background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)'
                            }}>
                                <User size={32} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0 }}>{sub.name}</h3>
                                <div style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '2px' }}>
                                    {sub.phone || 'Telefon Yok'}
                                </div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff9800', marginTop: '5px' }}>
                                    {parseFloat(sub.balance).toLocaleString('tr-TR')} ₺
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                            <button
                                onClick={() => navigate(`/admin/subs/${sub.id}/payment`)}
                                className="glass-btn"
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px', fontSize: '0.8rem' }}
                            >
                                <FileText size={20} style={{ marginBottom: '5px' }} />
                                <span>Hakediş</span>
                            </button>
                            <button
                                onClick={() => navigate(`/admin/subs/${sub.id}/ledger`)}
                                className="glass-btn"
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px', background: 'rgba(33, 150, 243, 0.2)', fontSize: '0.8rem' }}
                            >
                                <ScrollText size={20} style={{ marginBottom: '5px' }} />
                                <span>Ekstre</span>
                            </button>
                            <button
                                onClick={() => { setSelectedSub(sub); setShowPayModal(true); }}
                                className="glass-btn"
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px', background: 'rgba(76, 175, 80, 0.2)', fontSize: '0.8rem' }}
                            >
                                <DollarSign size={20} style={{ marginBottom: '5px' }} />
                                <span>Ödeme</span>
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

            {/* Edit Sub Modal */}
            {showEditModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-panel" style={{ width: '350px', padding: '25px' }}>
                        <h3>Düzenle: {selectedSub?.name}</h3>
                        <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Ad Soyad</label>
                        <input className="glass-input" value={newSub.name} onChange={e => setNewSub({ ...newSub, name: e.target.value })} />

                        <label style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '10px', display: 'block' }}>Telefon</label>
                        <input className="glass-input" value={newSub.phone} onChange={e => setNewSub({ ...newSub, phone: e.target.value })} />

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={handleEditSub} className="glass-btn" style={{ flex: 1, background: '#4caf50' }}>Güncelle</button>
                            <button onClick={() => setShowEditModal(false)} className="glass-btn" style={{ flex: 1, background: '#f44336' }}>İptal</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Sub Modal */}
            {showDeleteModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-panel" style={{ width: '350px', padding: '25px', border: '1px solid #f44336' }}>
                        <h3 style={{ color: '#f44336', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Trash2 /> Siliniyor: {selectedSub?.name}
                        </h3>
                        <p style={{ fontSize: '0.9rem', marginBottom: '15px' }}>Bu işlem geri alınamaz. Bütün hakediş ve ödeme verileri silinecektir.</p>

                        <label>Silme Şifresi</label>
                        <input
                            type="password"
                            className="glass-input"
                            placeholder="Şifreyi giriniz"
                            value={deletePassword}
                            onChange={e => setDeletePassword(e.target.value)}
                            style={{ marginTop: '5px' }}
                        />

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={handleDeleteSub} className="glass-btn" style={{ flex: 1, background: '#f44336' }}>SİL</button>
                            <button onClick={() => { setShowDeleteModal(false); setDeletePassword(''); }} className="glass-btn" style={{ flex: 1, background: '#555' }}>Vazgeç</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubcontractorDashboard;
