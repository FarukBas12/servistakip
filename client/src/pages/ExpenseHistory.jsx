import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Wallet, Clock, CheckCircle, XCircle, FileText, Calendar, Plus } from 'lucide-react';

const ExpenseHistory = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchMyExpenses = async () => {
        try {
            const res = await api.get('/expenses');
            setExpenses(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyExpenses();
    }, []);

    const getStatusInfo = (status) => {
        switch (status) {
            case 'approved': return { icon: <CheckCircle size={14} />, color: '#10b981', label: 'Onaylandı', bg: 'rgba(16,185,129,0.1)' };
            case 'rejected': return { icon: <XCircle size={14} />, color: '#f43f5e', label: 'Reddedildi', bg: 'rgba(244,63,94,0.1)' };
            default: return { icon: <Clock size={14} />, color: '#f59e0b', label: 'Bekliyor', bg: 'rgba(245,158,11,0.1)' };
        }
    };

    return (
        <div className="dashboard" style={{ paddingBottom: '100px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px', padding: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button 
                        onClick={() => navigate(-1)} 
                        style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'white' }}>Harcamalarım</h1>
                </div>
                <button 
                    onClick={() => navigate('/tech/expenses/create')}
                    className="glass-btn glass-btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                    <Plus size={18} /> Ekle
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px', color: 'rgba(255,255,255,0.5)' }}>Yükleniyor...</div>
            ) : expenses.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>
                    <Wallet size={48} style={{ marginBottom: '15px', opacity: 0.3 }} />
                    <p>Henüz harcama kaydınız bulunmuyor.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '10px' }}>
                    {expenses.map((exp) => {
                        const status = getStatusInfo(exp.status);
                        return (
                            <div key={exp.id} className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>₺{parseFloat(exp.amount).toLocaleString('tr-TR')}</span>
                                        <span style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '5px', 
                                            fontSize: '0.7rem', 
                                            fontWeight: 'bold', 
                                            padding: '4px 8px', 
                                            borderRadius: '8px',
                                            background: status.bg,
                                            color: status.color
                                        }}>
                                            {status.icon} {status.label}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {new Date(exp.created_at).toLocaleDateString('tr-TR')}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={12} /> {exp.category === 'Fuel' ? 'Yakıt' : exp.category === 'Food' ? 'Yemek' : exp.category === 'Material' ? 'Malzeme' : 'Diğer'}</span>
                                    </div>
                                    {exp.description && <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{exp.description}</p>}
                                </div>
                                {exp.receipt_url && (
                                    <div style={{ width: '50px', height: '50px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <img src={exp.receipt_url} alt="Receipt" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ExpenseHistory;
