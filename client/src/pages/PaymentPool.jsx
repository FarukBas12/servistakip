import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Eye, CheckCircle, Clock, Trash2, ArrowLeft } from 'lucide-react';

const PaymentPool = () => {
    const navigate = useNavigate();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const res = await api.get('/payments');
            setPayments(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const toggleStatus = async (id) => {
        try {
            const res = await api.put(`/payments/${id}/toggle-status`);
            // Update local state
            setPayments(payments.map(p => p.id === id ? { ...p, status: res.data.status } : p));
        } catch (err) {
            alert('Durum güncellenemedi');
        }
    };

    const deletePayment = async (id) => {
        if (!window.confirm('Bu hakedişi silmek istiyor musunuz?')) return;
        try {
            await api.delete(`/payments/${id}`);
            setPayments(payments.filter(p => p.id !== id));
        } catch (err) {
            alert('Silinemedi');
        }
    };

    return (
        <div className="dashboard">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: "10px" }}>
                    <button onClick={() => navigate('/admin')} className="glass-btn" style={{ padding: '8px' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h2 style={{ margin: 0 }}>Hakediş Havuzu</h2>
                </div>
                <button onClick={() => navigate('/admin/create-payment')} className="glass-btn" style={{ background: 'rgba(76, 175, 80, 0.3)' }}>
                    <PlusCircle size={20} style={{ marginRight: '8px' }} /> Yeni Hakediş
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ padding: '15px' }}>Proje / Mağaza</th>
                            <th style={{ padding: '15px' }}>Tarih</th>
                            <th style={{ padding: '15px' }}>Tutar</th>
                            <th style={{ padding: '15px' }}>Durum</th>
                            <th style={{ padding: '15px', textAlign: 'right' }}>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>Yükleniyor...</td></tr> :
                            payments.length === 0 ? <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>Henüz hakediş kaydı yok.</td></tr> :
                                payments.map(payment => (
                                    <tr key={payment.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '15px', fontWeight: 'bold' }}>{payment.title}</td>
                                        <td style={{ padding: '15px', opacity: 0.7 }}>{new Date(payment.payment_date).toLocaleDateString()}</td>
                                        <td style={{ padding: '15px', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                            {parseFloat(payment.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                        </td>
                                        <td style={{ padding: '15px' }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                padding: '5px 12px', borderRadius: '20px', fontSize: '0.85rem',
                                                background: payment.status === 'paid' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                                                color: payment.status === 'paid' ? '#4caf50' : '#f44336',
                                                border: payment.status === 'paid' ? '1px solid #4caf50' : '1px solid #f44336'
                                            }}>
                                                {payment.status === 'paid' ? <CheckCircle size={14} /> : <Clock size={14} />}
                                                {payment.status === 'paid' ? 'Ödeme Yapıldı' : 'Ödeme Bekliyor'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px', textAlign: 'right', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => toggleStatus(payment.id)}
                                                title={payment.status === 'paid' ? 'Bekliyor Olarak İşaretle' : 'Ödendi Olarak İşaretle'}
                                                className="glass-btn"
                                                style={{ padding: '8px', background: payment.status === 'paid' ? 'rgba(255,255,255,0.1)' : 'rgba(76, 175, 80, 0.3)' }}
                                            >
                                                {payment.status === 'paid' ? '↩️' : '💰 Öde'}
                                            </button>
                                            <button
                                                onClick={() => deletePayment(payment.id)}
                                                className="glass-btn"
                                                style={{ padding: '8px', background: 'rgba(244, 67, 54, 0.2)', color: '#f44336' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PaymentPool;
