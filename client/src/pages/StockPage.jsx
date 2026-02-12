import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Archive, AlertTriangle, History, ArrowRight, ArrowLeft, Upload, Printer, Edit2, TrendingUp, PieChart as PieChartIcon, X } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../utils/api'; // Use centralized API wrapper

const StockPage = () => {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debugError, setDebugError] = useState(null);
    const [serverVersion, setServerVersion] = useState('Checking...');

    // Sorting State
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    // Modal States
    const [modalOpen, setModalOpen] = useState(false);
    const [transactionModalOpen, setTransactionModalOpen] = useState(false);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [summaryModalOpen, setSummaryModalOpen] = useState(false);

    // Inline State
    const [editingId, setEditingId] = useState(null);
    const [historyId, setHistoryId] = useState(null);
    const [transactionOpenId, setTransactionOpenId] = useState(null);

    // Form Data
    const [currentItem, setCurrentItem] = useState(null);
    const [formData, setFormData] = useState({ name: '', unit: 'Adet', quantity: 0, critical_level: 5, category: 'Genel', purchase_price: 0 });
    const [transactionData, setTransactionData] = useState({ type: 'out', quantity: 1, project_id: '', description: '' });

    // History Data
    const [stockHistory, setStockHistory] = useState([]);
    const [projects, setProjects] = useState([]);

    // Summary Data
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c43'];
    const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

    const getTotalValue = () => {
        return stocks.reduce((sum, item) => {
            return sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.purchase_price) || 0));
        }, 0);
    };

    const getCategoryData = () => {
        const catMap = {};
        stocks.forEach(item => {
            const val = (parseFloat(item.quantity) || 0) * (parseFloat(item.purchase_price) || 0);
            const cat = item.category || 'Diğer';
            catMap[cat] = (catMap[cat] || 0) + val;
        });
        return Object.keys(catMap).map(key => ({
            name: key,
            value: catMap[key]
        })).filter(i => i.value > 0);
    };

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
            setEditingId(null);
            setFormData({ name: '', unit: 'Adet', quantity: 0, critical_level: 5, category: 'Genel', purchase_price: 0 });
            setCurrentItem(null);
        } catch (err) {
            console.error(err);
            alert('Hata: ' + (err.response?.data?.message || err.message));
        }
    };

    const startTransaction = (stock, type) => {
        setEditingId(null);
        setHistoryId(null);
        setCurrentItem(stock);
        setTransactionData({ type, quantity: 1, project_id: '', description: '' });
        setTransactionOpenId(stock.id);
    };

    const cancelTransaction = () => {
        setTransactionOpenId(null);
        setCurrentItem(null);
    };

    const handleTransaction = async (e) => {
        e.preventDefault();
        if (!currentItem) return;

        try {
            await api.post('/stock-tracking/transaction', { ...transactionData, stock_id: currentItem.id });

            fetchStocks();
            setTransactionOpenId(null);
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

    // Toggle Inline History
    const toggleHistory = async (stock) => {
        if (historyId === stock.id) {
            setHistoryId(null);
            return;
        }

        // Close Edit/Transaction if open
        setEditingId(null);
        setTransactionOpenId(null);
        setCurrentItem(stock);
        setStockHistory([]); // Clear prev
        setHistoryId(stock.id);

        try {
            const res = await api.get(`/stock-tracking/${stock.id}/history`);
            setStockHistory(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const startInlineEdit = (stock) => {
        // Close History/Transaction if open
        setHistoryId(null);
        setTransactionOpenId(null);
        setCurrentItem(stock);
        setFormData({ ...stock });
        setEditingId(stock.id);
    };

    const cancelInlineEdit = () => {
        setEditingId(null);
        setCurrentItem(null);
        setFormData({ name: '', unit: 'Adet', quantity: 0, critical_level: 5, category: 'Genel', purchase_price: 0 });
    };

    // Filtered Stocks
    const filteredStocks = stocks.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sorting Logic
    const sortedStocks = [...filteredStocks].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Numeric handling for quantity and price
        if (sortConfig.key === 'quantity' || sortConfig.key === 'purchase_price') {
            aValue = parseFloat(aValue) || 0;
            bValue = parseFloat(bValue) || 0;
        } else {
            // String handling
            aValue = aValue ? aValue.toString().toLowerCase() : '';
            bValue = bValue ? bValue.toString().toLowerCase() : '';
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <style>{`
                @media print {
                @media print {
                    @page { margin: 1cm; size: A4; }
                    .no-print { display: none !important; }
                    .sidebar { display: none !important; }
                    
                    /* Global Reset for Pagination */
                    html, body, #root, .App, .dashboard, .main-content {
                        background: white !important;
                        color: black !important;
                        height: auto !important;
                        min-height: 0 !important;
                        overflow: visible !important;
                        position: static !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        display: block !important;
                    }

                    /* Reset Container */
                    .glass-panel { 
                        background: none !important; 
                        box-shadow: none !important; 
                        border: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        border-radius: 0 !important;
                        page-break-inside: avoid;
                    }

                    /* Header */
                    .print-header { 
                        display: flex !important; 
                        justify-content: space-between; 
                        align-items: center;
                        border-bottom: 2px solid black; 
                        padding-bottom: 5px; 
                        margin-bottom: 10px; 
                    }
                    .print-header h2 { margin: 0; font-size: 1.2rem; }

                    /* Stock List Container */
                    div[style*="flex-direction: column"] { gap: 0 !important; display: block !important; }

                    /* Individual Stock Item Wrapper */
                    .glass-panel {
                        display: flex !important;
                        flex-direction: row !important;
                        align-items: center !important;
                        justify-content: space-between !important;
                        border-bottom: 1px solid #ccc !important;
                        padding: 4px 0 !important; /* Very small padding */
                        break-inside: avoid;
                        height: auto !important;
                        min-height: 0 !important;
                        border-left: none !important; /* Override inline styles */
                    }

                    /* Inner Flex Container Override */
                    .glass-panel > div {
                        display: flex !important;
                        flex-direction: row !important;
                        flex-wrap: nowrap !important;
                        align-items: center !important;
                        width: 100% !important;
                        margin: 0 !important;
                        gap: 10px !important;
                    }

                    /* Product Name Section */
                    .glass-panel > div > div:first-child {
                        flex: 1 !important;
                        margin: 0 !important;
                    }

                    /* Product Name Text */
                    .glass-panel h3 { 
                        font-size: 0.9rem !important; 
                        margin: 0 !important; 
                        color: black !important; 
                        font-weight: bold !important;
                        display: inline-block !important;
                    }
                    
                    /* Category Pill -> Text */
                    .glass-panel span[style*="background"] {
                        background: none !important;
                        color: black !important;
                        padding: 0 !important;
                        font-size: 0.8rem !important;
                        margin-left: 5px;
                        display: inline-block !important;
                    }
                    /* Add parenthesis or dash before category for cleaner look */
                    .glass-panel span[style*="background"]::before {
                        content: "- ";
                    }

                    /* Critical Badge */
                    .glass-panel span[style*="color: #ef4444"] {
                        display: none !important; /* Hide 'Critical' text to save space */
                    }

                    /* Zebra Striping for easier reading/writing */
                    .glass-panel:nth-of-type(even) {
                        background-color: #f3f3f3 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* Quantity Section - Transformed into Counting Box */
                    .glass-panel > div > div:nth-child(2) {
                        display: flex !important;
                        align-items: center !important;
                        justify-content: flex-end !important;
                        min-width: 100px !important;
                        visibility: visible !important; /* Ensure container is visible */
                    }

                    /* Hide the System Quantity Number (Blind Count) */
                    .glass-panel > div > div:nth-child(2) * {
                        display: none !important;
                    }
                    .glass-panel > div > div:nth-child(2) {
                        font-size: 0 !important; /* Hide direct text nodes */
                        color: transparent !important;
                    }

                    /* The Write-in Box - Enlarged */
                    .glass-panel > div > div:nth-child(2)::after {
                        content: "" !important;
                        display: block !important;
                        width: 120px !important; /* Wider */
                        height: 35px !important; /* Taller */
                        border: 2px solid #000 !important;
                        visibility: visible !important;
                        background: white !important;
                    }

                    /* Hide Actions Column completely */
                    .glass-panel > div > div:last-child {
                        display: none !important;
                    }

                    /* Force ALL text to be high contrast black and opaque */
                    * {
                        opacity: 1 !important;
                        filter: none !important;
                        color: #000000 !important;
                        -webkit-text-fill-color: #000000 !important; /* Critical for some browsers */
                    }

                    .glass-panel h3 {
                        color: #000000 !important;
                        font-weight: 900 !important; /* Extra bold */
                        -webkit-text-stroke: 0.5px black; /* Artificially thicken text */
                    }

                    h2, h3, h4, p, span, div, b, strong, i, em, li, ul { 
                        color: #000000 !important; 
                        text-shadow: none !important; 
                        fill: #000000 !important;
                    }
                }
                .print-header { display: none; }
                .inline-section {
                    background: rgba(0,0,0,0.3);
                    padding: 15px;
                    border-radius: 8px;
                    margin-top: 10px;
                    border: 1px solid rgba(255,255,255,0.1);
                    animation: slideDown 0.2s ease-out;
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .history-table th, .history-table td {
                    padding: 8px;
                    text-align: left;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .history-table th { color: #aaa; font-weight: normal; font-size: 0.8rem; }
            `}</style>

            <div className="print-header">
                <h2>Stok Listesi Raporu</h2>
                <p>{new Date().toLocaleDateString('tr-TR')}</p>
            </div>

            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Package /> Stok Takibi <span style={{ fontSize: '0.7rem', color: '#aaa', fontWeight: 'normal' }}>v1.3.8 (Inline History)</span>
                </h2>
                <div>
                    <button
                        onClick={() => setSummaryModalOpen(true)}
                        className="glass-btn"
                        style={{ marginRight: '10px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(168, 85, 247, 0.3) 100%)' }}
                    >
                        <PieChartIcon size={18} /> Envanter Özeti
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="glass-btn glass-btn-secondary"
                        style={{ marginRight: '10px' }}
                    >
                        <Printer size={18} /> Yazdır
                    </button>
                    <button
                        onClick={() => { setCurrentItem(null); setFormData({ name: '', unit: 'Adet', quantity: 0, critical_level: 5, category: 'Genel', purchase_price: 0 }); setModalOpen(true); }}
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

            <div className="glass-panel no-print" style={{ padding: '20px', marginBottom: '20px' }}>
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
                {/* Sorting Controls */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                    <button
                        onClick={() => handleSort('name')}
                        className={`glass-btn ${sortConfig.key === 'name' ? 'glass-btn-primary' : 'glass-btn-secondary'}`}
                        style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                    >
                        İsim {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                        onClick={() => handleSort('quantity')}
                        className={`glass-btn ${sortConfig.key === 'quantity' ? 'glass-btn-primary' : 'glass-btn-secondary'}`}
                        style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                    >
                        Adet {sortConfig.key === 'quantity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                        onClick={() => handleSort('category')}
                        className={`glass-btn ${sortConfig.key === 'category' ? 'glass-btn-primary' : 'glass-btn-secondary'}`}
                        style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                    >
                        Kategori {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                        onClick={() => handleSort('critical_level')}
                        className={`glass-btn ${sortConfig.key === 'critical_level' ? 'glass-btn-primary' : 'glass-btn-secondary'}`}
                        style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                    >
                        Kritik {sortConfig.key === 'critical_level' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sortedStocks.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#aaa', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                        <Package size={48} style={{ opacity: 0.5, marginBottom: '10px' }} />
                        <p>Henüz görüntülenecek stok yok veya arama sonucu boş.</p>
                        <p style={{ fontSize: '0.8rem' }}>Yeni stok eklemek için sağ üstteki düğmeyi kullanın.</p>
                    </div>
                )}
                {sortedStocks.map(stock => {
                    const isCritical = parseFloat(stock.quantity) <= parseFloat(stock.critical_level);
                    return (
                        <div key={stock.id} className="glass-panel" style={{
                            padding: '12px 20px',
                            borderLeft: isCritical ? '4px solid #ef4444' : '4px solid #22c55e',
                            transition: 'all 0.3s ease'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '15px'
                            }}>
                                {/* Left: Info */}
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <h3 style={{ margin: '0 0 4px 0', color: 'white', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {stock.name}
                                        {isCritical && <span style={{ fontSize: '0.7rem', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}><AlertTriangle size={10} /> Kritik</span>}
                                    </h3>
                                    <span style={{ fontSize: '0.75rem', color: '#aaa', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                                        {stock.category}
                                    </span>
                                </div>

                                {/* Middle: Quantity */}
                                <div style={{ textAlign: 'right', minWidth: '100px' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isCritical ? '#ef4444' : 'white' }}>
                                        {stock.quantity} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#888' }}>{stock.unit}</span>
                                    </div>
                                </div>

                                {/* Right: Actions */}
                                <div className="no-print" style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => startTransaction(stock, 'in')}
                                        className="glass-btn glass-btn-success" style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                        title="Stok Girişi"
                                    >
                                        +
                                    </button>
                                    <button
                                        onClick={() => startTransaction(stock, 'out')}
                                        className="glass-btn glass-btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                        title="Stok Çıkışı"
                                    >
                                        -
                                    </button>
                                    <button
                                        onClick={() => toggleHistory(stock)}
                                        className={`glass-btn ${historyId === stock.id ? 'glass-btn-primary' : 'glass-btn-secondary'}`}
                                        style={{ padding: '6px 10px' }} title="Hareket Geçmişi"
                                    >
                                        <History size={16} />
                                    </button>
                                    <button
                                        onClick={() => startInlineEdit(stock)}
                                        className={`glass-btn ${editingId === stock.id ? 'glass-btn-primary' : 'glass-btn-secondary'}`}
                                        style={{ padding: '6px 12px', fontSize: '0.8rem' }} title="Düzenle"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* INLINE HISTORY VIEW */}
                            {historyId === stock.id && (
                                <div className="inline-section no-print">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <h4 style={{ margin: 0, color: '#aaa' }}>Hareket Geçmişi</h4>
                                        <button onClick={() => setHistoryId(null)} className="glass-btn glass-btn-secondary" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>Kapat</button>
                                    </div>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        <table className="history-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                            <thead>
                                                <tr>
                                                    <th>Tarih</th>
                                                    <th>İşlem</th>
                                                    <th>Miktar</th>
                                                    <th>Detay</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stockHistory.map(h => (
                                                    <tr key={h.id}>
                                                        <td style={{ color: '#aaa' }}>{new Date(h.transaction_date).toLocaleDateString('tr-TR')} {new Date(h.transaction_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</td>
                                                        <td>
                                                            {h.type === 'in'
                                                                ? <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}><ArrowLeft size={14} /> Giriş</span>
                                                                : <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>Çıkış <ArrowRight size={14} /></span>
                                                            }
                                                        </td>
                                                        <td style={{ fontWeight: 'bold' }}>{h.quantity}</td>
                                                        <td style={{ fontSize: '0.8rem' }}>
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
                                </div>
                            )}

                            {/* INLINE TRANSACTION FORM */}
                            {transactionOpenId === stock.id && (
                                <div className="inline-section no-print">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <h4 style={{ margin: 0, color: transactionData.type === 'in' ? '#86efac' : '#fca5a5' }}>
                                            {transactionData.type === 'in' ? 'Stok Ekle (+)' : 'Stok Düş (-)'}
                                        </h4>
                                    </div>
                                    <form onSubmit={handleTransaction}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label style={{ marginBottom: '5px', display: 'block', color: '#ccc', fontSize: '0.8rem' }}>Miktar ({stock.unit})</label>
                                                <input autoFocus required type="number" step="0.01" min="0.01" value={transactionData.quantity} onChange={e => setTransactionData({ ...transactionData, quantity: e.target.value })}
                                                    className="glass-input"
                                                />
                                            </div>

                                            {transactionData.type === 'out' && (
                                                <div className="form-group" style={{ marginBottom: 0 }}>
                                                    <label style={{ marginBottom: '5px', display: 'block', color: '#ccc', fontSize: '0.8rem' }}>Kullanılan Proje</label>
                                                    <select value={transactionData.project_id} onChange={e => setTransactionData({ ...transactionData, project_id: e.target.value })} className="glass-input">
                                                        <option value="">-- Proje Seçin --</option>
                                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                    </select>
                                                </div>
                                            )}

                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label style={{ marginBottom: '5px', display: 'block', color: '#ccc', fontSize: '0.8rem' }}>Açıklama</label>
                                                <input type="text" value={transactionData.description} onChange={e => setTransactionData({ ...transactionData, description: e.target.value })} placeholder="Kullanım yeri, tedarikçi vb."
                                                    className="glass-input"
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                            <button type="button" onClick={cancelTransaction} className="glass-btn glass-btn-secondary">İptal</button>
                                            <button type="submit" className={`glass-btn ${transactionData.type === 'in' ? 'glass-btn-success' : 'glass-btn-danger'}`}>
                                                {transactionData.type === 'in' ? 'Onayla (+)' : 'Onayla (-)'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* INLINE EDIT FORM */}
                            {editingId === stock.id && (
                                <form onSubmit={handleSubmit} className="inline-section no-print">
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={{ marginBottom: '5px', display: 'block', color: '#ccc', fontSize: '0.8rem' }}>Ürün Adı</label>
                                            <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className="glass-input" style={{ width: '100%' }}
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={{ marginBottom: '5px', display: 'block', color: '#ccc', fontSize: '0.8rem' }}>Kategori</label>
                                            <input type="text" list="categories" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                className="glass-input" style={{ width: '100%' }}
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={{ marginBottom: '5px', display: 'block', color: '#ccc', fontSize: '0.8rem' }}>Birim</label>
                                            <select value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                                className="glass-input" style={{ width: '100%' }}
                                            >
                                                <option value="Adet">Adet</option>
                                                <option value="Metre">Metre</option>
                                                <option value="Kg">Kg</option>
                                                <option value="Kutu">Kutu</option>
                                                <option value="Top">Top</option>
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={{ marginBottom: '5px', display: 'block', color: '#ccc', fontSize: '0.8rem' }}>Birim Fiyat (TL)</label>
                                            <input type="number" step="0.01" value={formData.purchase_price || 0} onChange={e => setFormData({ ...formData, purchase_price: e.target.value })}
                                                className="glass-input" style={{ width: '100%' }}
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={{ marginBottom: '5px', display: 'block', color: '#ccc', fontSize: '0.8rem' }}>Kritik Seviye</label>
                                            <input type="number" value={formData.critical_level} onChange={e => setFormData({ ...formData, critical_level: e.target.value })}
                                                className="glass-input" style={{ width: '100%' }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                        <button type="button" onClick={() => handleDelete(stock.id)} className="glass-btn glass-btn-danger" style={{ marginRight: 'auto' }}>
                                            Sil
                                        </button>
                                        <button type="button" onClick={cancelInlineEdit} className="glass-btn glass-btn-secondary">İptal</button>
                                        <button type="submit" className="glass-btn glass-btn-primary">Değişiklikleri Kaydet</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* CREATE MODAL (Only for New Stock now) */}
            {modalOpen && (
                <div className="modal-overlay no-print">
                    <div className="modal-content glass-panel">
                        <h3>Yeni Stok Ekle</h3>
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
                                    <input type="number" step="0.01" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                        className="glass-input"
                                    />
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
                                <label style={{ marginBottom: '5px', display: 'block', color: '#ccc', fontSize: '0.9rem' }}>Birim Fiyat (TL)</label>
                                <input type="number" step="0.01" value={formData.purchase_price || 0} onChange={e => setFormData({ ...formData, purchase_price: e.target.value })}
                                    className="glass-input"
                                />
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
                            </div>
                        </form>
                    </div>
                </div>
            )}



            {/* HISTORY MODAL */}
            {historyModalOpen && (
                <div className="modal-overlay no-print">
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
                <div className="modal-overlay no-print">
                    <div className="modal-content glass-panel">
                        <h3>Excel ile Toplu Stok Yükle</h3>
                        <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '15px' }}>
                            Excel dosyanızda şu sütunlar olmalı: <br />
                            <b>Ürün Adı, Kategori, Miktar, Birim, Kritik, Fiyat</b>
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

            {/* SUMMARY MODAL */}
            {summaryModalOpen && (
                <div className="modal-overlay no-print">
                    <div className="modal-content glass-panel" style={{ maxWidth: '700px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: '#818cf8' }}>
                                <TrendingUp size={24} /> Envanter Özeti
                            </h3>
                            <button onClick={() => setSummaryModalOpen(false)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Total Value Card */}
                        <div style={{
                            padding: '25px',
                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)',
                            borderRadius: '12px',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '0.9rem', color: '#818cf8', marginBottom: '8px' }}>Toplam Stok Değeri</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', textShadow: '0 0 20px rgba(99, 102, 241, 0.5)' }}>
                                {formatCurrency(getTotalValue())}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '8px' }}>
                                {stocks.length} Kalem Ürün
                            </div>
                        </div>

                        {/* Category Chart */}
                        {getCategoryData().length > 0 && (
                            <div style={{
                                padding: '20px',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <h4 style={{ margin: '0 0 15px 0', color: '#aaa', textAlign: 'center' }}>Kategori Bazlı Değer Dağılımı</h4>
                                <div style={{ height: '280px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={getCategoryData()}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                fill="#8884d8"
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {getCategoryData().map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => formatCurrency(value)}
                                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: 'white' }}
                                            />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setSummaryModalOpen(false)}
                            className="glass-btn glass-btn-secondary"
                            style={{ width: '100%', marginTop: '20px', justifyContent: 'center' }}
                        >
                            Kapat
                        </button>
                    </div>
                </div>
            )}


        </div>
    );
};

export default StockPage;
