import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Archive, AlertTriangle, History, ArrowRight, ArrowLeft, Upload } from 'lucide-react';
import api from '../utils/api'; // Use centralized API wrapper

const StockPage = () => {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debugError, setDebugError] = useState(null);
    const [serverVersion, setServerVersion] = useState('Checking...');

    // Modal States
    const [modalOpen, setModalOpen] = useState(false);
    const [transactionModalOpen, setTransactionModalOpen] = useState(false);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);

    // Form Data
    const [currentItem, setCurrentItem] = useState(null);
    const [formData, setFormData] = useState({ name: '', unit: 'Adet', quantity: 0, critical_level: 5, category: 'Genel' });
    const [transactionData, setTransactionData] = useState({ type: 'out', quantity: 1, project_id: '', description: '' });

    // History Data
    const [stockHistory, setStockHistory] = useState([]);
    const [projects, setProjects] = useState([]);

    const fetchStocks = async () => {
        setLoading(true);
        try {
            const res = await api.get('/stock-tracking');
            setStocks(res.data);
            setDebugError(null);
        } catch (err) {
            console.error(err);
            setDebugError('Fetch Failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data);
        } catch (err) { }
    };

    useEffect(() => {
        fetchStocks();
        fetchProjects();
        // Check Server Version
        api.get('/version')
            .then(res => setServerVersion(res.data.version))
            .catch(() => setServerVersion('Unknown'));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = currentItem ? `/stock-tracking/${currentItem.id}` : '/stock-tracking';
            const method = currentItem ? 'put' : 'post';

            await api[method](url, formData);

            fetchStocks();
            setModalOpen(false);
            setFormData({ name: '', unit: 'Adet', quantity: 0, critical_level: 5, category: 'Genel' });
            setCurrentItem(null);
        } catch (err) {
            console.error(err);
            alert('Hata: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleTransaction = async (e) => {
        e.preventDefault();
        if (!currentItem) return;

        try {
            await api.post('/stock-tracking/transaction', { ...transactionData, stock_id: currentItem.id });

            fetchStocks();
            setTransactionModalOpen(false);
            setTransactionData({ type: 'out', quantity: 1, project_id: '', description: '' });
        } catch (err) {
            console.error(err);
            alert('Hata: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu stoğu silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/stock-tracking/${id}`);
            fetchStocks();
        } catch (err) { console.error(err); }
    };

    const openHistory = async (stock) => {
        setCurrentItem(stock);
        try {
            const res = await api.get(`/stock-tracking/${stock.id}/history`);
            setStockHistory(res.data);
            setHistoryModalOpen(true);
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
                    <Package /> Stok Takibi <span style={{ fontSize: '0.7rem', color: '#aaa', fontWeight: 'normal' }}>v1.3.5 (Fixed)</span>
                </h2>
                <div>
                    <button
                        onClick={() => { setCurrentItem(null); setFormData({ name: '', unit: 'Adet', quantity: 0, critical_level: 5, category: 'Genel' }); setModalOpen(true); }}
                        className="glass-btn glass-btn-success"
                    >
                        <Plus size={18} /> Yeni Stok Ekle
                    </button>
                    <button
                        onClick={() => setImportModalOpen(true)}
                        className="glass-btn glass-btn-primary"
                        style={{ marginLeft: '10px' }}
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
                        className="glass-input"
                        style={{ paddingLeft: '40px' }}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {filteredStocks.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#aaa', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                        <Package size={48} style={{ opacity: 0.5, marginBottom: '10px' }} />
                        <p>Henüz görüntülenecek stok yok veya arama sonucu boş.</p>
                        <p style={{ fontSize: '0.8rem' }}>Yeni stok eklemek için sağ üstteki düğmeyi kullanın.</p>
                    </div>
                )}
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
                                    className="glass-btn glass-btn-success" style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem' }}
                                >
                                    + Giriş
                                </button>
                                <button
                                    onClick={() => { setCurrentItem(stock); setTransactionData({ type: 'out', quantity: 1, description: '', project_id: '' }); setTransactionModalOpen(true); }}
                                    className="glass-btn glass-btn-danger" style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem' }}
                                >
                                    - Çıkış
                                </button>
                                <button
                                    onClick={() => openHistory(stock)}
                                    className="glass-btn glass-btn-secondary" style={{ padding: '10px' }} title="Hareket Geçmişi"
                                >
                                    <History size={18} />
                                </button>
                                <button
                                    onClick={() => { setCurrentItem(stock); setFormData({ ...stock }); setModalOpen(true); }}
                                    className="glass-btn glass-btn-secondary" style={{ padding: '10px', fontSize: '0.8rem' }} title="Düzenle"
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
                                <label style={{ marginBottom: '5px', display: 'block', color: '#ccc', fontSize: '0.9rem' }}>Ürün Adı</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="glass-input"
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ marginBottom: '5px', display: 'block', color: '#ccc', fontSize: '0.9rem' }}>Kategori</label>
                                <input type="text" list="categories" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="glass-input"
                                />
                                <datalist id="categories">
                                    <option value="Genel" />
                                    <option value="Kablo" />
                                    <option value="Kamera" />
                                    <option value="Sarf Malzeme" />
                                </datalist>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label style={{ marginBottom: '5px', display: 'block', color: '#ccc', fontSize: '0.9rem' }}>Miktar</label>
                                    <input type="number" step="0.01" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} disabled={!!currentItem}
                                        className="glass-input"
                                        style={!!currentItem ? { opacity: 0.5 } : {}}
                                    />
                                    {currentItem && <small style={{ color: '#aaa' }}>Miktar sadece giriş/çıkış ile değişir.</small>}
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label style={{ marginBottom: '5px', display: 'block', color: '#ccc', fontSize: '0.9rem' }}>Birim</label>
                                    <select value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} className="glass-input">
                                        <option value="Adet">Adet</option>
                                        <option value="Metre">Metre</option>
                                        <option value="Kg">Kg</option>
                                        <option value="Kutu">Kutu</option>
                                        <option value="Top">Top</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label style={{ marginBottom: '5px', display: 'block', color: '#ccc', fontSize: '0.9rem' }}>Kritik Seviye (Uyarı Limiti)</label>
                                <input type="number" value={formData.critical_level} onChange={e => setFormData({ ...formData, critical_level: e.target.value })}
                                    className="glass-input"
                                />
                            </div>

                            <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setModalOpen(false)} className="glass-btn glass-btn-secondary">İptal</button>
                                <button type="submit" className="glass-btn glass-btn-primary">Kaydet</button>
                                {currentItem && (
                                    <button type="button" onClick={() => handleDelete(currentItem.id)} className="glass-btn glass-btn-danger" style={{ marginLeft: 'auto' }}>Sil</button>
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
                                <label style={{ marginBottom: '5px', display: 'block', color: '#ccc', fontSize: '0.9rem' }}>Miktar ({currentItem?.unit})</label>
                                <input autoFocus required type="number" step="0.01" min="0.01" value={transactionData.quantity} onChange={e => setTransactionData({ ...transactionData, quantity: e.target.value })}
                                    className="glass-input"
                                />
                            </div>

                            {transactionData.type === 'out' && (
                                <div className="form-group">
                                    <label style={{ marginBottom: '5px', display: 'block', color: '#ccc', fontSize: '0.9rem' }}>Kullanılan Proje</label>
                                    <select value={transactionData.project_id} onChange={e => setTransactionData({ ...transactionData, project_id: e.target.value })} className="glass-input">
                                        <option value="">-- Proje Seçin --</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label style={{ marginBottom: '5px', display: 'block', color: '#ccc', fontSize: '0.9rem' }}>Açıklama</label>
                                <textarea value={transactionData.description} onChange={e => setTransactionData({ ...transactionData, description: e.target.value })} rows={3} placeholder="Tedarikçi firma, kullanım yeri vb."
                                    className="glass-input"
                                ></textarea>
                            </div>

                            <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setTransactionModalOpen(false)} className="glass-btn glass-btn-secondary">İptal</button>
                                <button type="submit" className={`glass-btn ${transactionData.type === 'in' ? 'glass-btn-success' : 'glass-btn-danger'}`}>
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
                                const res = await api.post('/stock-tracking/bulk', formData, {
                                    headers: { 'Content-Type': 'multipart/form-data' }
                                });
                                alert(res.data.message);
                                setImportModalOpen(false);
                                fetchStocks();
                            } catch (err) {
                                alert('Yükleme hatası: ' + (err.response?.data?.message || err.message));
                            }
                        }}>
                            <div className="form-group">
                                <label style={{ marginBottom: '5px', display: 'block', color: '#ccc', fontSize: '0.9rem' }}>Excel Dosyası (.xlsx)</label>
                                <div style={{ position: 'relative' }}>
                                    <input id="file-upload" name="file" type="file" accept=".xlsx, .xls" required
                                        style={{ opacity: 0, position: 'absolute', width: '100%', height: '100%', cursor: 'pointer' }}
                                        onChange={(e) => {
                                            const fileName = e.target.files[0]?.name;
                                            document.getElementById('file-label-text').innerText = fileName || 'Dosya seçilmedi';
                                        }}
                                    />
                                    <label htmlFor="file-upload" className="file-upload-label">
                                        <Upload size={18} /> <span id="file-label-text">Dosya Seçin...</span>
                                    </label>
                                </div>
                            </div>
                            <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                                <button type="button" onClick={() => setImportModalOpen(false)} className="glass-btn glass-btn-secondary">İptal</button>
                                <button type="submit" className="glass-btn glass-btn-primary">Yükle</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DEBUG PANEL */}
            <div style={{ marginTop: '50px', padding: '10px', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', fontSize: '0.7rem', color: '#888' }}>
                <p>Debug Info:</p>
                <p>Stocks Loaded: {stocks.length}</p>
                <p>Loading State: {loading ? 'True' : 'False'}</p>
                <p>Search Term: "{searchTerm}"</p>
                <p>Filtered Count: {filteredStocks.length}</p>
                {debugError && <p style={{ color: '#ef4444' }}>Error: {debugError}</p>}
                <p style={{ fontWeight: 'bold' }}>
                    Server Version: {serverVersion}
                </p>
                <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                    <button onClick={fetchStocks} style={{ padding: '5px', cursor: 'pointer' }}>Force Refresh</button>
                </div>
            </div>
        </div>
    );
};

export default StockPage;
