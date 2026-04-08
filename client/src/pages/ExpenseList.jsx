import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Check, X, Eye, Calendar, User, Tag, ArrowRight, Wallet, Image as ImageIcon } from 'lucide-react';

const ExpenseList = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);

    const fetchExpenses = async () => {
        try {
            const res = await api.get('/expenses');
            setExpenses(res.data);
        } catch (err) {
            toast.error('Harcamalar yüklenemedi!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.put(`/expenses/${id}/status`, { status });
            toast.success(status === 'approved' ? 'Harcama onaylandı' : 'Harcama reddedildi');
            fetchExpenses();
        } catch (err) {
            toast.error('Durum güncellenemedi!');
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'rgba(255,255,255,0.5)' }}>
            <div className="spinner"></div>
            <span style={{ marginLeft: '10px' }}>Masraflar yükleniyor...</span>
        </div>
    );

    return (
        <div className="dashboard" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', background: 'linear-gradient(90deg, #e0e7ff, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Harcama Yönetimi</h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', margin: '5px 0 0 0' }}>Saha ekibi tarafından gönderilen tüm harcamaları denetleyin.</p>
                </div>
                <div className="glass-panel" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Toplam Harcama</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#818cf8' }}>
                            ₺{expenses.filter(e => e.status === 'approved').reduce((acc, curr) => acc + parseFloat(curr.amount), 0).toLocaleString('tr-TR')}
                        </div>
                    </div>
                    <Wallet size={24} color="#818cf8" />
                </div>
            </div>

            {/* Expenses Table */}
            <div className="glass-panel" style={{ padding: '10px', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                        <thead>
                            <tr style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                                <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: '500' }}>Tarih</th>
                                <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: '500' }}>Personel</th>
                                <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: '500' }}>Kategori</th>
                                <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: '500' }}>Açıklama</th>
                                <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: '500' }}>Tutar</th>
                                <th style={{ padding: '12px 20px', textAlign: 'center', fontWeight: '500' }}>Fiş</th>
                                <th style={{ padding: '12px 20px', textAlign: 'center', fontWeight: '500' }}>Durum</th>
                                <th style={{ padding: '12px 20px', textAlign: 'right', fontWeight: '500' }}>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '50px', color: 'rgba(255,255,255,0.3)' }}>
                                        Henüz kaydedilmiş harcama bulunmuyor.
                                    </td>
                                </tr>
                            ) : expenses.map((exp) => (
                                <tr key={exp.id} className="table-row-hover" style={{ background: 'rgba(255,255,255,0.02)', transition: 'all 0.2s' }}>
                                    <td style={{ padding: '15px 20px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                                        <div style={{ fontSize: '0.9rem', color: 'white' }}>{new Date(exp.created_at).toLocaleDateString('tr-TR')}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>{new Date(exp.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
                                    </td>
                                    <td style={{ padding: '15px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                                {exp.username.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: '500', color: 'rgba(255,255,255,0.9)' }}>{exp.full_name || exp.username}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '15px 20px' }}>
                                        <span style={{ 
                                            padding: '4px 10px', 
                                            borderRadius: '8px', 
                                            fontSize: '0.75rem', 
                                            background: 'rgba(255,255,255,0.05)', 
                                            color: 'rgba(255,255,255,0.7)',
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            {exp.category === 'Fuel' ? '⛽ Yakıt' : exp.category === 'Food' ? '🍔 Yemek' : exp.category === 'Material' ? '🛠️ Malzeme' : '➕ Diğer'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px 20px', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                                        {exp.description || '-'}
                                    </td>
                                    <td style={{ padding: '15px 20px', fontWeight: 'bold', color: 'white', fontSize: '1rem' }}>
                                        ₺{parseFloat(exp.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                                        {exp.receipt_url && (
                                            <button 
                                                onClick={() => setSelectedImage(exp.receipt_url)}
                                                style={{ border: 'none', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', padding: '8px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
                                                className="action-btn-hover"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        )}
                                    </td>
                                    <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                                        <span style={{ 
                                            padding: '5px 12px', 
                                            borderRadius: '10px', 
                                            fontSize: '0.7rem', 
                                            fontWeight: 'bold', 
                                            textTransform: 'uppercase',
                                            background: exp.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : exp.status === 'rejected' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            color: exp.status === 'approved' ? '#10b981' : exp.status === 'rejected' ? '#f43f5e' : '#f59e0b',
                                            border: exp.status === 'approved' ? '1px solid rgba(16, 185, 129, 0.2)' : exp.status === 'rejected' ? '1px solid rgba(244, 63, 94, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)'
                                        }}>
                                            {exp.status === 'approved' ? 'Onaylandı' : exp.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px 20px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px', textAlign: 'right' }}>
                                        {exp.status === 'pending' && (
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                <button 
                                                    onClick={() => handleStatusUpdate(exp.id, 'approved')}
                                                    style={{ border: 'none', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}
                                                    title="Onayla"
                                                    className="action-btn-hover"
                                                >
                                                    <Check size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleStatusUpdate(exp.id, 'rejected')}
                                                    style={{ border: 'none', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}
                                                    title="Reddet"
                                                    className="action-btn-hover"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        )}
                                        {exp.status !== 'pending' && <span style={{ color: 'rgba(255,255,255,0.1)' }}><Check size={16} /></span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Image Preview Modal (Ultra Modern) */}
            {selectedImage && (
                <div 
                    style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                    onClick={() => setSelectedImage(null)}
                >
                    <div 
                        style={{ position: 'relative', maxWidth: '900px', width: '100%', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setSelectedImage(null)}
                            style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', padding: '10px', borderRadius: '12px', cursor: 'pointer', zIndex: 10 }}
                        >
                            <X size={24} />
                        </button>
                        <img src={selectedImage} alt="Fiş Fotoğrafı" style={{ width: '100%', height: 'auto', display: 'block' }} />
                        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'white', fontWeight: '500' }}>Fiş Fotoğrafı</span>
                            <a href={selectedImage} target="_blank" rel="noreferrer" style={{ color: '#818cf8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold' }}>Tam Boyut Görüntüle <ArrowRight size={14} /></a>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .table-row-hover:hover {
                    background: rgba(255,255,255,0.05) !important;
                    transform: translateX(5px);
                }
                .action-btn-hover:hover {
                    transform: scale(1.1);
                    filter: brightness(1.2);
                }
                .spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255,255,255,0.1);
                    border-top-color: #818cf8;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default ExpenseList;

