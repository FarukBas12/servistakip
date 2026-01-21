import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Download, Trash2, CheckSquare, Square, Eye, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'; // Not used here but good to keep imports consistent if needed later

const SubLedger = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [sub, setSub] = useState(null);

    // Selection State
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Detail Modal State
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailData, setDetailData] = useState(null);

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
            setSelectedIds(new Set());
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

    const handleShowDetail = async (trans) => {
        if (trans.type !== 'hakedis') return;
        try {
            const res = await api.get(`/subs/payment/${trans.id}`);
            setDetailData(res.data);
            setShowDetailModal(true);
        } catch (e) { console.error(e); alert('Detay alınamadı'); }
    }

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
                            <th style={{ padding: '10px', width: '50px' }}></th>
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
                                    <td style={{ padding: '10px' }}>
                                        {t.type === 'hakedis' && (
                                            <button onClick={() => handleShowDetail(t)} className="glass-btn" style={{ padding: '5px' }} title="Detay">
                                                <Eye size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Detail Modal */}
            {showDetailModal && detailData && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, overflowY: 'auto', padding: '20px' }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto', background: '#1e1e1e', borderRadius: '10px', padding: '20px', border: '1px solid #333' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                            <h2 style={{ margin: 0 }}>Hakediş Detayı</h2>
                            <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <p><strong>Mağaza:</strong> {detailData.store_name}</p>
                                <p><strong>Başlık:</strong> {detailData.title}</p>
                                <p><strong>Tarih:</strong> {new Date(detailData.payment_date).toLocaleDateString('tr-TR')}</p>
                            </div>
                            <div>
                                <p><strong>İrsaliye Bilgisi:</strong> {detailData.waybill_info || '-'}</p>
                                {detailData.waybill_image && (
                                    <div style={{ marginTop: '10px' }}>
                                        <p><strong>İrsaliye Fotoğrafı:</strong></p>
                                        <a href={api.defaults.baseURL.replace('/api', '') + detailData.waybill_image} target="_blank" rel="noreferrer">
                                            <img
                                                src={api.defaults.baseURL.replace('/api', '') + detailData.waybill_image}
                                                alt="İrsaliye"
                                                style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '5px', border: '1px solid #555' }}
                                            />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        <h3>Kalemler</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #333', textAlign: 'left', color: '#888' }}>
                                    <th style={{ padding: '8px' }}>İş Kalemi</th>
                                    <th style={{ padding: '8px' }}>Birim Fiyat</th>
                                    <th style={{ padding: '8px' }}>Metraj</th>
                                    <th style={{ padding: '8px', textAlign: 'right' }}>Toplam</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detailData.items?.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #333' }}>
                                        <td style={{ padding: '8px' }}>{item.work_item}</td>
                                        <td style={{ padding: '8px' }}>{parseFloat(item.unit_price).toLocaleString('tr-TR')} ₺</td>
                                        <td style={{ padding: '8px' }}>{item.quantity}</td>
                                        <td style={{ padding: '8px', textAlign: 'right' }}>{parseFloat(item.total_price).toLocaleString('tr-TR')} ₺</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ textAlign: 'right', marginTop: '20px', fontSize: '1.2rem', fontWeight: 'bold', color: '#4caf50' }}>
                            TOPLAM: {parseFloat(detailData.total_amount).toLocaleString('tr-TR')} ₺
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubLedger;
