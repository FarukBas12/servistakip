import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Download, Trash2, CheckSquare, Square, Eye, X, Edit2, Plus, Trash } from 'lucide-react';

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

    // Edit Cash Modal
    const [showEditCashModal, setShowEditCashModal] = useState(false);
    const [editCashData, setEditCashData] = useState(null);

    // Edit Payment Modal
    const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
    const [editPaymentData, setEditPaymentData] = useState(null);

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
                Mağaza: t.store_name || '-',
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

    const handleEdit = async (trans) => {
        if (trans.type === 'odeme') {
            setEditCashData({
                id: trans.id,
                amount: trans.amount,
                description: trans.description,
                transaction_date: new Date(trans.date).toISOString().split('T')[0]
            });
            setShowEditCashModal(true);
        } else {
            try {
                const res = await api.get(`/subs/payment/${trans.id}`);
                const data = res.data;
                setEditPaymentData({
                    ...data,
                    payment_date: data.payment_date.split('T')[0],
                    kdv_rate: data.kdv_rate || 0
                });
                setShowEditPaymentModal(true);
            } catch (e) { console.error(e); alert('Hakediş detayları alınamadı'); }
        }
    }

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const subTotal = detailData.items.reduce((acc, item) => acc + (parseFloat(item.total_price) || 0), 0);
        const kdvRate = detailData.kdv_rate || 0;
        const kdvAmount = subTotal * kdvRate / 100;
        const grandTotal = parseFloat(detailData.total_amount);

        printWindow.document.write(`
            <html>
                <head>
                    <title>Hakediş Detayı Yazdır</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                        .header { margin-bottom: 20px; display: flex; justify-content: space-between; }
                        .summary { margin-top: 20px; text-align: right; }
                        .summary div { margin-bottom: 5px; }
                        .total { font-size: 1.2rem; font-weight: bold; }
                        img { max-width: 300px; margin-top: 10px; border: 1px solid #ddd; }
                        @media print {
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <h2>${sub?.name || 'Taşeron'} - Hakediş Detayı</h2>
                            <p><strong>Mağaza:</strong> ${detailData.store_name}</p>
                            <p><strong>Başlık:</strong> ${detailData.title}</p>
                            <p><strong>Tarih:</strong> ${new Date(detailData.payment_date).toLocaleDateString('tr-TR')}</p>
                        </div>
                        <div>
                            <p><strong>İrsaliye:</strong> ${detailData.waybill_info || '-'}</p>
                            ${detailData.waybill_image ? `<img src="${detailData.waybill_image.startsWith('http') ? detailData.waybill_image : api.defaults.baseURL.replace('/api', '') + detailData.waybill_image}" />` : ''}
                        </div>
                    </div>

                    <h3>Kalemler</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>İş Kalemi</th>
                                <th>Birim Fiyat</th>
                                <th>Metraj</th>
                                <th>Toplam</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${detailData.items.map(item => `
                                <tr>
                                    <td>${item.work_item}</td>
                                    <td>${parseFloat(item.unit_price).toLocaleString('tr-TR')} ₺</td>
                                    <td>${item.quantity}</td>
                                    <td style="text-align: right">${parseFloat(item.total_price).toLocaleString('tr-TR')} ₺</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="summary">
                        <div>Ara Toplam: ${subTotal.toLocaleString('tr-TR')} ₺</div>
                        <div>KDV (%${kdvRate}): ${kdvAmount.toLocaleString('tr-TR')} ₺</div>
                        <div class="total">GENEL TOPLAM: ${grandTotal.toLocaleString('tr-TR')} ₺</div>
                    </div>

                    <script>
                        window.onload = function() { window.print(); }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
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
                            <th style={{ padding: '10px' }}>Mağaza</th>
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
                                    <td style={{ padding: '10px' }}>{t.date ? new Date(t.date).toLocaleDateString('tr-TR') : '-'}</td>
                                    <td style={{ padding: '10px' }}>{t.store_name || '-'}</td>
                                    <td style={{ padding: '10px' }}>{t.description} {t.type === 'hakedis' ? '(Hakediş)' : ''}</td>
                                    <td style={{ padding: '10px', color: '#f44336' }}>
                                        {t.type === 'odeme' ? parseFloat(t.amount).toLocaleString('tr-TR') + ' ₺' : '-'}
                                    </td>
                                    <td style={{ padding: '10px', color: '#4caf50' }}>
                                        {t.type === 'hakedis' ? parseFloat(t.amount).toLocaleString('tr-TR') + ' ₺' : '-'}
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <button onClick={() => handleEdit(t)} className="glass-btn" style={{ padding: '5px' }} title="Düzenle">
                                                <Edit2 size={16} />
                                            </button>
                                            {t.type === 'hakedis' && (
                                                <button onClick={() => handleShowDetail(t)} className="glass-btn" style={{ padding: '5px' }} title="Detay">
                                                    <Eye size={16} />
                                                </button>
                                            )}
                                        </div>
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
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <h2 style={{ margin: 0 }}>Hakediş Detayı</h2>
                                <button onClick={handlePrint} className="glass-btn" style={{ fontSize: '0.8rem', padding: '5px 15px' }}>Yazdır</button>
                            </div>
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
                                        <a href={detailData.waybill_image.startsWith('http') ? detailData.waybill_image : api.defaults.baseURL.replace('/api', '') + detailData.waybill_image} target="_blank" rel="noreferrer">
                                            <img
                                                src={detailData.waybill_image.startsWith('http') ? detailData.waybill_image : api.defaults.baseURL.replace('/api', '') + detailData.waybill_image}
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

                        <div style={{ textAlign: 'right', marginTop: '20px', fontSize: '1rem', color: '#ccc' }}>
                            <div style={{ marginBottom: '5px' }}>
                                Ara Toplam: {detailData.items.reduce((acc, i) => acc + parseFloat(i.total_price), 0).toLocaleString('tr-TR')} ₺
                            </div>
                            <div style={{ marginBottom: '5px' }}>
                                KDV (%{detailData.kdv_rate || 0}): {(parseFloat(detailData.total_amount) - detailData.items.reduce((acc, i) => acc + parseFloat(i.total_price), 0)).toLocaleString('tr-TR')} ₺
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4caf50' }}>GENEL TOPLAM: {parseFloat(detailData.total_amount).toLocaleString('tr-TR')} ₺</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Cash Modal */}
            {showEditCashModal && editCashData && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Ödeme Düzenle</h3>
                            <button onClick={() => setShowEditCashModal(false)} style={{ background: 'none', border: 'none', color: '#fff' }}><X size={20} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '5px' }}>Tarih</label>
                                <input type="date" className="glass-input" value={editCashData.transaction_date} onChange={e => setEditCashData({ ...editCashData, transaction_date: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '5px' }}>Açıklama</label>
                                <input type="text" className="glass-input" value={editCashData.description} onChange={e => setEditCashData({ ...editCashData, description: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '5px' }}>Tutar (₺)</label>
                                <input type="number" className="glass-input" value={editCashData.amount} onChange={e => setEditCashData({ ...editCashData, amount: e.target.value })} />
                            </div>
                            <button
                                onClick={async () => {
                                    try {
                                        await api.put(`/subs/cash/${editCashData.id}`, editCashData);
                                        setShowEditCashModal(false);
                                        fetchData();
                                    } catch (e) { alert('Hata oluştu'); }
                                }}
                                className="glass-btn" style={{ background: '#4caf50', marginTop: '10px' }}>Güncelle</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Payment Modal */}
            {showEditPaymentModal && editPaymentData && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1100, overflowY: 'auto', padding: '20px' }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto', background: '#1e1e1e', borderRadius: '10px', padding: '20px', border: '1px solid #333' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                            <h2 style={{ margin: 0 }}>Hakediş Düzenle</h2>
                            <button onClick={() => setShowEditPaymentModal(false)} style={{ background: 'none', border: 'none', color: '#fff' }}><X size={24} /></button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7 }}>Mağaza</label>
                                    <input type="text" className="glass-input" value={editPaymentData.store_name} onChange={e => setEditPaymentData({ ...editPaymentData, store_name: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7 }}>Başlık / Dönem</label>
                                    <input type="text" className="glass-input" value={editPaymentData.title} onChange={e => setEditPaymentData({ ...editPaymentData, title: e.target.value })} />
                                </div>
                                <div>
                                    <input type="date" className="glass-input" value={editPaymentData.payment_date} onChange={e => setEditPaymentData({ ...editPaymentData, payment_date: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7 }}>KDV Oranı (%)</label>
                                    <input type="number" className="glass-input" value={editPaymentData.kdv_rate || 0} onChange={e => setEditPaymentData({ ...editPaymentData, kdv_rate: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7 }}>İrsaliye Bilgisi</label>
                                    <input type="text" className="glass-input" value={editPaymentData.waybill_info || ''} onChange={e => setEditPaymentData({ ...editPaymentData, waybill_info: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7 }}>İrsaliye Fotoğrafı (Değiştirmek için seçin)</label>
                                    <input type="file" className="glass-input" onChange={e => setEditPaymentData({ ...editPaymentData, new_waybill: e.target.files[0] })} />
                                </div>
                            </div>
                        </div>

                        <h3>Kalemler</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #333', textAlign: 'left', color: '#888' }}>
                                    <th style={{ padding: '8px' }}>İş Kalemi</th>
                                    <th style={{ padding: '8px', width: '120px' }}>Birim Fiyat</th>
                                    <th style={{ padding: '8px', width: '100px' }}>Metraj</th>
                                    <th style={{ padding: '8px', width: '50px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {editPaymentData.items?.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #222' }}>
                                        <td style={{ padding: '5px' }}>
                                            <input type="text" className="glass-input" style={{ width: '100%', background: 'transparent' }} value={item.work_item}
                                                onChange={e => {
                                                    const newItems = [...editPaymentData.items];
                                                    newItems[idx].work_item = e.target.value;
                                                    setEditPaymentData({ ...editPaymentData, items: newItems });
                                                }} />
                                        </td>
                                        <td style={{ padding: '5px' }}>
                                            <input type="number" className="glass-input" style={{ width: '100%', background: 'transparent' }} value={item.unit_price}
                                                onChange={e => {
                                                    const newItems = [...editPaymentData.items];
                                                    newItems[idx].unit_price = e.target.value;
                                                    setEditPaymentData({ ...editPaymentData, items: newItems });
                                                }} />
                                        </td>
                                        <td style={{ padding: '5px' }}>
                                            <input type="number" className="glass-input" style={{ width: '100%', background: 'transparent' }} value={item.quantity}
                                                onChange={e => {
                                                    const newItems = [...editPaymentData.items];
                                                    newItems[idx].quantity = e.target.value;
                                                    setEditPaymentData({ ...editPaymentData, items: newItems });
                                                }} />
                                        </td>
                                        <td style={{ padding: '5px' }}>
                                            <button className="glass-btn" style={{ padding: '5px', color: '#f44336' }}
                                                onClick={() => {
                                                    const newItems = editPaymentData.items.filter((_, i) => i !== idx);
                                                    setEditPaymentData({ ...editPaymentData, items: newItems });
                                                }}>
                                                <Trash size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button className="glass-btn" style={{ marginTop: '10px', fontSize: '0.8rem' }}
                            onClick={() => {
                                const newItems = [...(editPaymentData.items || []), { work_item: '', unit_price: 0, quantity: 0 }];
                                setEditPaymentData({ ...editPaymentData, items: newItems });
                            }}>
                            <Plus size={16} style={{ marginRight: '5px' }} /> Yeni Kalem Ekle
                        </button>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '30px' }}>
                            <button onClick={() => setShowEditPaymentModal(false)} className="glass-btn">İptal</button>
                            <button
                                onClick={async () => {
                                    try {
                                        const formData = new FormData();
                                        formData.append('title', editPaymentData.title);
                                        formData.append('store_name', editPaymentData.store_name);
                                        formData.append('waybill_info', editPaymentData.waybill_info);
                                        formData.append('payment_date', editPaymentData.payment_date);
                                        formData.append('kdv_rate', editPaymentData.kdv_rate);
                                        formData.append('items', JSON.stringify(editPaymentData.items));
                                        if (editPaymentData.new_waybill) {
                                            formData.append('waybill', editPaymentData.new_waybill);
                                        }

                                        await api.put(`/subs/payment/${editPaymentData.id}`, formData);
                                        setShowEditPaymentModal(false);
                                        fetchData();
                                    } catch (e) { alert('Hata oluştu'); }
                                }}
                                className="glass-btn" style={{ background: '#4caf50' }}>Güncellemeleri Kaydet</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubLedger;
