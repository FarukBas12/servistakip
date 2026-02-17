import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Edit2, FileText, DollarSign, Trash2, ScrollText } from 'lucide-react';
import { getInitials, stringToColor } from '../utils/helpers';

const SubcontractorDashboard = () => {
    const navigate = useNavigate();
    const [subs, setSubs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedSub, setSelectedSub] = useState(null);
    const [payData, setPayData] = useState({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });

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
            await api.put(`/subs/${selectedSub.id}`, { name: newSub.name, phone: newSub.phone || '' });
            alert('Güncellendi');
            setShowEditModal(false);
            fetchSubs();
        } catch (err) { console.error(err); alert('Hata Oluştu'); }
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

    const getBalanceColor = (balance) => {
        const val = parseFloat(balance);
        if (val > 0) return '#10b981';
        if (val < 0) return '#ef4444';
        return '#8b9dc3';
    };

    // Reusable modal overlay
    const ModalOverlay = ({ children, onClose }) => (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000
            }}
        >
            <div onClick={e => e.stopPropagation()} className="glass-panel" style={{ width: '400px', maxWidth: '90vw', padding: '28px' }}>
                {children}
            </div>
        </div>
    );

    return (
        <div className="dashboard">
            <h2 style={{ marginBottom: '20px' }}>Taşeron Listesi</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {subs.map(sub => {
                    const balance = parseFloat(sub.balance);
                    const balColor = getBalanceColor(balance);
                    return (
                        <div key={sub.id} className="glass-panel" style={{ padding: '18px', position: 'relative' }}>
                            {/* Edit & Delete Buttons */}
                            <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '2px' }}>
                                <button
                                    onClick={() => { setSelectedSub(sub); setNewSub({ name: sub.name, phone: sub.phone }); setShowEditModal(true); }}
                                    className="icon-btn" title="Düzenle"
                                >
                                    <Edit2 size={15} />
                                </button>
                                <button
                                    onClick={() => { setSelectedSub(sub); setShowDeleteModal(true); }}
                                    className="icon-btn" title="Sil"
                                    style={{ color: '#ef4444' }}
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>

                            {/* Sub Info */}
                            <div
                                onClick={() => navigate(`/admin/subs/${sub.id}`)}
                                style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', cursor: 'pointer' }}
                            >
                                <div className="tp-initials" style={{
                                    width: '48px', height: '48px', borderRadius: '50%',
                                    fontSize: '1rem',
                                    backgroundColor: stringToColor(sub.name || '?'),
                                    border: '2px solid rgba(255,255,255,0.1)'
                                }}>
                                    {getInitials(sub.name)}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <h3 style={{ margin: 0, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.name}</h3>
                                    <div style={{ fontSize: '0.8rem', color: '#8b9dc3', marginTop: '1px' }}>
                                        {sub.phone || 'Telefon Yok'}
                                    </div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: balColor, marginTop: '3px' }}>
                                        {balance.toLocaleString('tr-TR')} ₺
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                <button
                                    onClick={() => navigate(`/admin/subs/${sub.id}/payment`)}
                                    className="glass-btn"
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 4px', fontSize: '0.75rem', gap: '4px' }}
                                >
                                    <FileText size={16} />
                                    <span>Hakediş</span>
                                </button>
                                <button
                                    onClick={() => navigate(`/admin/subs/${sub.id}/ledger`)}
                                    className="glass-btn"
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 4px', fontSize: '0.75rem', gap: '4px', background: 'rgba(99, 102, 241, 0.15)' }}
                                >
                                    <ScrollText size={16} />
                                    <span>Ekstre</span>
                                </button>
                                <button
                                    onClick={() => { setSelectedSub(sub); setShowPayModal(true); }}
                                    className="glass-btn"
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 4px', fontSize: '0.75rem', gap: '4px', background: 'rgba(16, 185, 129, 0.15)' }}
                                >
                                    <DollarSign size={16} />
                                    <span>Ödeme</span>
                                </button>
                            </div>
                        </div>
                    );
                })}

                {/* New Sub Button */}
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="glass-panel"
                    style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        border: '1px dashed rgba(255,255,255,0.12)',
                        cursor: 'pointer', minHeight: '180px',
                        background: 'rgba(255,255,255,0.02)',
                        transition: 'border-color 0.2s ease, background 0.2s ease',
                        color: '#8b9dc3'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.background = 'rgba(99,102,241,0.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                >
                    <PlusCircle size={32} style={{ marginBottom: '8px', opacity: 0.6 }} />
                    <span style={{ fontSize: '0.9rem' }}>Yeni Taşeron</span>
                </button>
            </div>

            {/* Cash Payment Modal */}
            {showPayModal && (
                <ModalOverlay onClose={() => setShowPayModal(false)}>
                    <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Nakit Ödeme: {selectedSub.name}</h3>
                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', color: '#8b9dc3', display: 'block', marginBottom: '4px' }}>Tarih</label>
                        <input type="date" className="glass-input" value={payData.date} onChange={e => setPayData({ ...payData, date: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', color: '#8b9dc3', display: 'block', marginBottom: '4px' }}>Tutar</label>
                        <input type="number" className="glass-input" placeholder="0.00" value={payData.amount} onChange={e => setPayData({ ...payData, amount: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', color: '#8b9dc3', display: 'block', marginBottom: '4px' }}>Açıklama</label>
                        <input className="glass-input" placeholder="İsteğe bağlı" value={payData.description} onChange={e => setPayData({ ...payData, description: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                        <button onClick={handleCashPayload} className="glass-btn" style={{ flex: 1, background: 'rgba(16, 185, 129, 0.2)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#86efac' }}>Kaydet</button>
                        <button onClick={() => setShowPayModal(false)} className="glass-btn" style={{ flex: 1 }}>İptal</button>
                    </div>
                </ModalOverlay>
            )}

            {/* Create Sub Modal */}
            {showCreateModal && (
                <ModalOverlay onClose={() => setShowCreateModal(false)}>
                    <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Yeni Taşeron Ekle</h3>
                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', color: '#8b9dc3', display: 'block', marginBottom: '4px' }}>Taşeron Adı ve Soyadı</label>
                        <input className="glass-input" placeholder="Ad Soyad" value={newSub.name} onChange={e => setNewSub({ ...newSub, name: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', color: '#8b9dc3', display: 'block', marginBottom: '4px' }}>Telefon</label>
                        <input className="glass-input" placeholder="İsteğe bağlı" value={newSub.phone} onChange={e => setNewSub({ ...newSub, phone: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                        <button onClick={handleCreateSub} className="glass-btn" style={{ flex: 1, background: 'rgba(16, 185, 129, 0.2)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#86efac' }}>Ekle</button>
                        <button onClick={() => setShowCreateModal(false)} className="glass-btn" style={{ flex: 1 }}>İptal</button>
                    </div>
                </ModalOverlay>
            )}

            {/* Edit Sub Modal */}
            {showEditModal && (
                <ModalOverlay onClose={() => setShowEditModal(false)}>
                    <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Düzenle: {selectedSub?.name}</h3>
                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', color: '#8b9dc3', display: 'block', marginBottom: '4px' }}>Ad Soyad</label>
                        <input className="glass-input" value={newSub.name} onChange={e => setNewSub({ ...newSub, name: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', color: '#8b9dc3', display: 'block', marginBottom: '4px' }}>Telefon</label>
                        <input className="glass-input" value={newSub.phone} onChange={e => setNewSub({ ...newSub, phone: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                        <button onClick={handleEditSub} className="glass-btn" style={{ flex: 1, background: 'rgba(99, 102, 241, 0.2)', borderColor: 'rgba(99, 102, 241, 0.4)', color: '#a5b4fc' }}>Güncelle</button>
                        <button onClick={() => setShowEditModal(false)} className="glass-btn" style={{ flex: 1 }}>İptal</button>
                    </div>
                </ModalOverlay>
            )}

            {/* Delete Sub Modal */}
            {showDeleteModal && (
                <ModalOverlay onClose={() => { setShowDeleteModal(false); setDeletePassword(''); }}>
                    <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Trash2 size={20} /> Siliniyor: {selectedSub?.name}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#8b9dc3', marginBottom: '16px' }}>Bu işlem geri alınamaz. Bütün hakediş ve ödeme verileri silinecektir.</p>
                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', color: '#8b9dc3', display: 'block', marginBottom: '4px' }}>Silme Şifresi</label>
                        <input
                            type="password"
                            className="glass-input"
                            placeholder="Şifreyi giriniz"
                            value={deletePassword}
                            onChange={e => setDeletePassword(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                        <button onClick={handleDeleteSub} className="glass-btn" style={{ flex: 1, background: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}>SİL</button>
                        <button onClick={() => { setShowDeleteModal(false); setDeletePassword(''); }} className="glass-btn" style={{ flex: 1 }}>Vazgeç</button>
                    </div>
                </ModalOverlay>
            )}
        </div>
    );
};

export default SubcontractorDashboard;
