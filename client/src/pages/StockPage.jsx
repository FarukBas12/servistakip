import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Archive, AlertTriangle, History, ArrowRight, ArrowLeft, Upload } from 'lucide-react';

const StockPage = () => {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [modalOpen, setModalOpen] = useState(false);
    const [transactionModalOpen, setTransactionModalOpen] = useState(false);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false); // NEW

    // Form Data
    const [currentItem, setCurrentItem] = useState(null);
    const [formData, setFormData] = useState({ name: '', unit: 'Adet', quantity: 0, critical_level: 5, category: 'Genel' });
    const [transactionData, setTransactionData] = useState({ type: 'out', quantity: 1, project_id: '', description: '' });

    // History Data
    const [stockHistory, setStockHistory] = useState([]);
    const [projects, setProjects] = useState([]);

    const fetchStocks = async () => {
        try {
            const res = await fetch('/api/stock-tracking');
            if (res.ok) setStocks(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/projects');
            if (res.ok) setProjects(await res.json());
        } catch (err) { }
    };

    useEffect(() => {
        fetchStocks();
        fetchProjects();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = currentItem ? `/api/stock-tracking/${currentItem.id}` : '/api/stock-tracking';
            const method = currentItem ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                fetchStocks();
                setModalOpen(false);
                setFormData({ name: '', unit: 'Adet', quantity: 0, critical_level: 5, category: 'Genel' });
                setCurrentItem(null);
            } else {
                alert('Hata oluştu');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleTransaction = async (e) => {
        e.preventDefault();
        if (!currentItem) return;

        try {
            const res = await fetch('/api/stock-tracking/transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...transactionData, stock_id: currentItem.id })
            });

            if (res.ok) {
                fetchStocks();
                setTransactionModalOpen(false);
                setTransactionData({ type: 'out', quantity: 1, project_id: '', description: '' });
            } else {
                const err = await res.json();
                alert(err.message || 'Hata oluştu');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu stoğu silmek istediğinize emin misiniz?')) return;
        try {
            await fetch(`/api/stock-tracking/${id}`, { method: 'DELETE' });
            fetchStocks();
        } catch (err) { console.error(err); }
    };

    const openHistory = async (stock) => {
        setCurrentItem(stock);
        try {
            const res = await fetch(`/api/stock-tracking/${stock.id}/history`);
            if (res.ok) {
                setStockHistory(await res.json());
                setHistoryModalOpen(true);
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Filtered Stocks
    const filteredStocks = stocks.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Package /> Stok Takibi <span style={{ fontSize: '0.7rem', color: '#aaa', fontWeight: 'normal' }}>v1.2.3</span>
                </h2>
                <div>
                    <button
                        onClick={() => { setCurrentItem(null); setFormData({ name: '', unit: 'Adet', quantity: 0, critical_level: 5, category: 'Genel' }); setModalOpen(true); }}
                        className="action-btn"
                    >
                        <Plus size={18} /> Yeni Stok Ekle
                    </button>
                    <button
                        onClick={() => setImportModalOpen(true)}
                        className="action-btn"
                        style={{ marginLeft: '10px', background: '#2563eb' }}
                    >
                        <Upload size={18} /> Excel Yükle
                    </button>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
                <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '10px', top: '10px', color: '#aaa' }} size={20} />
                    <input
                        type="text"
                        placeholder="Ürün adı veya kategori ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 10px 10px 40px',
                            borderRadius: '8px',
                            border: '1px solid #444',
                            background: 'rgba(0,0,0,0.2)',
                            color: 'white'
                        }}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {filteredStocks.map(stock => {
                    const isCritical = parseFloat(stock.quantity) <= parseFloat(stock.critical_level);
                    return (
                        <div key={stock.id} className="glass-panel" style={{ padding: '15px', borderLeft: isCritical ? '4px solid #ef4444' : '4px solid #22c55e', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '1.1rem' }}>{stock.name}</h3>
                                    <span style={{ fontSize: '0.8rem', color: '#aaa', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                        {stock.category}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: isCritical ? '#ef4444' : 'white' }}>
                                        {stock.quantity} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>{stock.unit}</span>
                                    </div>
                                    {isCritical && <div style={{ fontSize: '0.7rem', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'end', gap: '4px' }}><AlertTriangle size={12} /> Kritik Seviye</div>}
                                </div>
                            </div>

                            <div style={{ marginTop: '15px', display: 'flex', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                                <button
                                    onClick={() => { setCurrentItem(stock); setTransactionData({ type: 'in', quantity: 1, description: '', project_id: '' }); setTransactionModalOpen(true); }}
                                    style={{ flex: 1, background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '5px', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    + Giriş
                                </button>
                                <button
                                    onClick={() => { setCurrentItem(stock); setTransactionData({ type: 'out', quantity: 1, description: '', project_id: '' }); setTransactionModalOpen(true); }}
                                    style={{ flex: 1, background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '5px', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    - Çıkış
                                </button>
                                <button
                                    onClick={() => openHistory(stock)}
                                    style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }} title="Hareket Geçmişi"
                                >
                                    <History size={18} />
                                </button>
                                <button
                                    onClick={() => { setCurrentItem(stock); setFormData({ ...stock }); setModalOpen(true); }}
                                    style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }} title="Düzenle"
                                >
                                    Edit
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* CREATE/EDIT MODAL */}
            {modalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel">
                        <h3>{currentItem ? 'Stoğu Düzenle' : 'Yeni Stok Ekle'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Ürün Adı</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        background: '#333',
                                        color: 'white',
                                        border: '1px solid #555',
                                        borderRadius: '5px'
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Kategori</label>
                                <input type="text" list="categories" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        background: '#333',
                                        color: 'white',
                                        border: '1px solid #555',
                                        borderRadius: '5px'
                                    }}
                                />
                                <datalist id="categories">
                                    <option value="Genel" />
                                    <option value="Kablo" />
                                    <option value="Kamera" />
                                    <option value="Sarf Malzeme" />
                                </datalist>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div className="form-group">
                                    <label>Miktar</label>
                                    <input type="number" step="0.01" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} disabled={!!currentItem}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            background: '#333',
                                            color: '#eee',
                                            border: '1px solid #555',
                                            borderRadius: '5px'
                                        }}
                                    />
                                    {currentItem && <small style={{ color: '#aaa' }}>Miktar sadece giriş/çıkış ile değişir.</small>}
                                </div>
                                <div className="form-group">
                                    <label>Birim</label>
                                    <select value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} style={{ padding: '8px', borderRadius: '5px', background: '#333', color: 'white', border: '1px solid #555' }}>
                                        <option value="Adet">Adet</option>
                                        <option value="Metre">Metre</option>
                                        <option value="Kg">Kg</option>
                                        <option value="Kutu">Kutu</option>
                                        <option value="Top">Top</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Kritik Seviye (Uyarı Limiti)</label>
                                <input type="number" value={formData.critical_level} onChange={e => setFormData({ ...formData, critical_level: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        background: '#333',
                                        color: 'white',
                                        border: '1px solid #555',
                                        borderRadius: '5px'
                                    }}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setModalOpen(false)} style={{ background: '#555' }}>İptal</button>
                                <button type="submit" className="action-btn">Kaydet</button>
                                {currentItem && (
                                    <button type="button" onClick={() => handleDelete(currentItem.id)} style={{ background: '#ef4444', marginLeft: 'auto' }}>Sil</button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* TRANSACTION MODAL */}
            {transactionModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel">
                        <h3>{transactionData.type === 'in' ? 'Stok Girişi' : 'Stok Çıkışı'} - {currentItem?.name}</h3>
                        <form onSubmit={handleTransaction}>
                            <div className="form-group">
                                <label>Miktar ({currentItem?.unit})</label>
                                <input autoFocus required type="number" step="0.01" min="0.01" value={transactionData.quantity} onChange={e => setTransactionData({ ...transactionData, quantity: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        background: '#333',
                                        color: 'white',
                                        border: '1px solid #555',
                                        borderRadius: '5px'
                                    }}
                                />
                            </div>

                            {transactionData.type === 'out' && (
                                <div className="form-group">
                                    <label>Kullanılan Proje (Opsiyonel)</label>
                                    <select value={transactionData.project_id} onChange={e => setTransactionData({ ...transactionData, project_id: e.target.value })} style={{ width: '100%', padding: '8px', background: '#333', color: 'white', border: '1px solid #555' }}>
                                        <option value="">-- Proje Seçin --</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Açıklama</label>
                                <textarea value={transactionData.description} onChange={e => setTransactionData({ ...transactionData, description: e.target.value })} rows={3} placeholder="Tedarikçi firma, kullanım yeri vb."
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        background: '#333',
                                        color: 'white',
                                        border: '1px solid #555',
                                        borderRadius: '5px'
                                    }}
                                ></textarea>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setTransactionModalOpen(false)} style={{ background: '#555' }}>İptal</button>
                                <button type="submit" className="action-btn" style={{ background: transactionData.type === 'out' ? '#ef4444' : '#22c55e' }}>
                                    {transactionData.type === 'in' ? 'Ekle (+)' : 'Düş (-)'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* HISTORY MODAL */}
            {historyModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel" style={{ maxWidth: '600px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <h3>Hareket Geçmişi - {currentItem?.name}</h3>
                            <button onClick={() => setHistoryModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><Archive size={18} /></button>
                        </div>
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                        <th style={{ padding: '8px' }}>Tarih</th>
                                        <th style={{ padding: '8px' }}>İşlem</th>
                                        <th style={{ padding: '8px' }}>Miktar</th>
                                        <th style={{ padding: '8px' }}>Detay</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stockHistory.map(h => (
                                        <tr key={h.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '8px', color: '#aaa' }}>{new Date(h.transaction_date).toLocaleDateString('tr-TR')}</td>
                                            <td style={{ padding: '8px' }}>
                                                {h.type === 'in'
                                                    ? <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}><ArrowLeft size={14} /> Giriş</span>
                                                    : <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>Çıkış <ArrowRight size={14} /></span>
                                                }
                                            </td>
                                            <td style={{ padding: '8px', fontWeight: 'bold' }}>{h.quantity}</td>
                                            <td style={{ padding: '8px', fontSize: '0.8rem' }}>
                                                {h.project_name && <div style={{ color: '#4facfe' }}>📂 {h.project_name}</div>}
                                                <div style={{ color: '#bbb' }}>{h.description}</div>
                                                <div style={{ color: '#666', fontSize: '0.7rem' }}>👤 {h.username}</div>
                                            </td>
                                        </tr>
                                    ))}
                                    {stockHistory.length === 0 && <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Henüz hareket yok.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        <button onClick={() => setHistoryModalOpen(false)} style={{ width: '100%', marginTop: '15px', padding: '10px', background: '#555', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Kapat</button>
                    </div>
                </div>
            )}
            {/* IMPORT MODAL */}
            {importModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel">
                        <h3>Excel ile Toplu Stok Yükle</h3>
                        <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '15px' }}>
                            Excel dosyanızda şu sütunlar olmalı: <br />
                            <b>Ürün Adı, Kategori, Miktar, Birim, Kritik</b>
                        </p>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData();
                            const file = e.target.file.files[0];
                            if (!file) return alert('Dosya seçin.');
                            formData.append('file', file);

                            try {
                                const res = await fetch('/api/stock-tracking/bulk', {
                                    method: 'POST',
                                    body: formData
                                });
                                const data = await res.json();
                                if (res.ok) {
                                    alert(data.message);
                                    setImportModalOpen(false);
                                    fetchStocks();
                                } else {
                                    alert(data.message);
                                }
                            } catch (err) {
                                alert('Yükleme hatası');
                            }
                        }}>
                            <div className="form-group">
                                <label>Excel Dosyası (.xlsx)</label>
                                <input name="file" type="file" accept=".xlsx, .xls" required
                                    style={{ padding: '10px', background: '#333', borderRadius: '5px', width: '100%' }}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setImportModalOpen(false)} style={{ background: '#555' }}>İptal</button>
                                <button type="submit" className="action-btn">Yükle</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockPage;
