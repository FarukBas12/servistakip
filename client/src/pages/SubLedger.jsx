import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Download, Trash2, CheckSquare, Square } from 'lucide-react';

const SubLedger = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [sub, setSub] = useState(null);

    // Selection State
    const [selectedIds, setSelectedIds] = useState(new Set());

    useEffect(() => {
        fetchData();
        fetchSubInfo();
    }, []);

    const fetchSubInfo = async () => {
        try {
            const res = await api.get('/subs');
            const found = res.data.find(s => s.id === parseInt(id));
            setSub(found);
        } catch (e) { console.error(e); }
    }

    const fetchData = async () => {
        try {
            const res = await api.get(`/subs/${id}/ledger`);
            setTransactions(res.data);
            setSelectedIds(new Set()); // Reset selection on refresh
        } catch (e) { console.error(e); }
    };

    const handleExport = async () => {
        try {
            const XLSX = await import('xlsx');
            const ws = XLSX.utils.json_to_sheet(transactions.map(t => ({
                Tarih: new Date(t.date).toLocaleDateString('tr-TR'),
                Açıklama: t.description,
                Tür: t.type === 'hakedis' ? 'Hakediş (Alacak)' : 'Ödeme (Borç)',
                Tutar: parseFloat(t.amount)
            })));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Ekstre");
            XLSX.writeFile(wb, `${sub?.name || 'Cari'}_Ekstre.xlsx`);
        } catch (err) {
            console.error('Export Error:', err);
            alert('Excel oluşturulurken hata oluştu.');
        }
    };

    const toggleSelect = (uniqId) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(uniqId)) newSet.delete(uniqId);
        else newSet.add(uniqId);
        setSelectedIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === transactions.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(transactions.map(t => `${t.type}-${t.id}`)));
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`${selectedIds.size} adet kaydı silmek istediğinize emin misiniz?`)) return;

        for (const uniqId of selectedIds) {
            const [type, id] = uniqId.split('-');
            try {
                await api.delete(`/subs/transaction/${type}/${id}`);
            } catch (err) { console.error(err); }
        }
        fetchData();
    };

    const totalBalance = transactions.reduce((acc, t) => {
        return acc + (t.type === 'hakedis' ? parseFloat(t.amount) : -parseFloat(t.amount));
    }, 0);

    return (
        <div className="dashboard">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => navigate('/admin/subs')} className="glass-btn"><ArrowLeft size={20} /></button>
                    <div>
                        <h2 style={{ margin: 0 }}>{sub?.name || 'Yükleniyor...'}</h2>
                        <p style={{ margin: 0, opacity: 0.7 }}>Hesap Özeti / Ekstre</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {selectedIds.size > 0 && (
                        <button onClick={handleDelete} className="glass-btn" style={{ background: '#f44336' }}>
                            <Trash2 size={18} style={{ marginRight: '5px' }} /> Seçilenleri Sil ({selectedIds.size})
                        </button>
                    )}
                    <button onClick={handleExport} className="glass-btn" style={{ background: '#4caf50' }}>
                        <Download size={18} style={{ marginRight: '5px' }} /> Excel İndir
                    </button>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ marginBottom: '20px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    Toplam Bakiye: <span style={{ color: totalBalance >= 0 ? '#ff9800' : '#4caf50' }}>{totalBalance.toLocaleString('tr-TR')} ₺</span>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                            <th style={{ padding: '10px', width: '40px' }}>
                                <div onClick={toggleSelectAll} style={{ cursor: 'pointer' }}>
                                    {selectedIds.size === transactions.length && transactions.length > 0
                                        ? <CheckSquare size={20} color="#4caf50" />
                                        : <Square size={20} style={{ opacity: 0.5 }} />}
                                </div>
                            </th>
                            <th style={{ padding: '10px' }}>Tarih</th>
                            <th style={{ padding: '10px' }}>Açıklama</th>
                            <th style={{ padding: '10px' }}>Borç (Ödeme)</th>
                            <th style={{ padding: '10px' }}>Alacak (Hakediş)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(t => {
                            const uniqId = `${t.type}-${t.id}`;
                            const isSelected = selectedIds.has(uniqId);
                            return (
                                <tr key={uniqId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: isSelected ? 'rgba(76, 175, 80, 0.1)' : 'transparent' }}>
                                    <td style={{ padding: '10px' }}>
                                        <div onClick={() => toggleSelect(uniqId)} style={{ cursor: 'pointer' }}>
                                            {isSelected ? <CheckSquare size={20} color="#4caf50" /> : <Square size={20} style={{ opacity: 0.5 }} />}
                                        </div>
                                    </td>
                                    <td style={{ padding: '10px' }}>{new Date(t.date).toLocaleDateString('tr-TR')}</td>
                                    <td style={{ padding: '10px' }}>{t.description} {t.type === 'hakedis' ? '(Hakediş)' : ''}</td>
                                    <td style={{ padding: '10px', color: '#f44336' }}>
                                        {t.type === 'odeme' ? parseFloat(t.amount).toLocaleString('tr-TR') + ' ₺' : '-'}
                                    </td>
                                    <td style={{ padding: '10px', color: '#4caf50' }}>
                                        {t.type === 'hakedis' ? parseFloat(t.amount).toLocaleString('tr-TR') + ' ₺' : '-'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SubLedger;
