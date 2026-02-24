import React, { useState, useEffect, useCallback } from 'react';
import {
    Package, Plus, Search, AlertTriangle, History,
    ArrowRight, ArrowLeft, Upload, Printer, Edit2,
    TrendingUp, PieChart as PieChartIcon, X, Filter,
    CheckCircle, XCircle, ChevronDown
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../utils/api';
import { useTheme } from '../context/ThemeContext';

// ─── Toast Component ───────────────────────────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
    <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none',
    }}>
        {toasts.map(t => (
            <div key={t.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 18px',
                borderRadius: '12px',
                background: t.type === 'success'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${t.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                color: t.type === 'success' ? '#6ee7b7' : '#fca5a5',
                fontSize: '0.9rem',
                fontWeight: 500,
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                animation: 'slideInRight 0.3s ease-out',
                pointerEvents: 'auto',
                maxWidth: '360px',
                minWidth: '220px',
            }}>
                {t.type === 'success'
                    ? <CheckCircle size={18} style={{ flexShrink: 0 }} />
                    : <XCircle size={18} style={{ flexShrink: 0 }} />
                }
                <span style={{ flex: 1 }}>{t.message}</span>
                <button
                    onClick={() => removeToast(t.id)}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, opacity: 0.7, flexShrink: 0 }}
                >
                    <X size={14} />
                </button>
            </div>
        ))}
    </div>
);

// ─── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color, bg }) => (
    <div style={{
        flex: 1,
        minWidth: '140px',
        padding: '16px 20px',
        borderRadius: '14px',
        background: bg || 'var(--glass-surface)',
        border: `1px solid ${color}33`,
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
    }}>
        <div style={{
            width: '42px', height: '42px', borderRadius: '10px',
            background: `${color}22`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: color, flexShrink: 0,
        }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>{label}</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
        </div>
    </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const StockPage = () => {
    const { isDarkMode } = useTheme();

    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    // Toast
    const [toasts, setToasts] = useState([]);
    const addToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);
    const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

    // Sorting
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    // Modal States
    const [modalOpen, setModalOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [summaryModalOpen, setSummaryModalOpen] = useState(false);

    // Inline State
    const [editingId, setEditingId] = useState(null);
    const [historyId, setHistoryId] = useState(null);
    const [transactionOpenId, setTransactionOpenId] = useState(null);

    // Form Data
    const [currentItem, setCurrentItem] = useState(null);
    const emptyForm = { name: '', unit: 'Adet', quantity: 0, critical_level: 5, category: 'Genel', purchase_price: 0 };
    const [formData, setFormData] = useState(emptyForm);
    const [transactionData, setTransactionData] = useState({ type: 'out', quantity: 1, project_id: '', description: '' });

    // History & Projects
    const [stockHistory, setStockHistory] = useState([]);
    const [projects, setProjects] = useState([]);

    // Summary colors
    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];
    const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0);

    // ── Data fetching ────────────────────────────────────────────
    const fetchStocks = async () => {
        setLoading(true);
        try {
            const res = await api.get('/stock-tracking');
            setStocks(res.data);
        } catch (err) {
            addToast('Stoklar yüklenemedi: ' + (err.response?.data?.message || err.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data);
        } catch { }
    };

    useEffect(() => {
        fetchStocks();
        fetchProjects();
    }, []);

    // ── Derived data ──────────────────────────────────────────────
    const getTotalValue = () =>
        stocks.reduce((sum, item) =>
            sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.purchase_price) || 0), 0);

    const getCriticalCount = () =>
        stocks.filter(s => parseFloat(s.quantity) <= parseFloat(s.critical_level)).length;

    const getCategories = () => {
        const cats = [...new Set(stocks.map(s => s.category || 'Genel'))].filter(Boolean);
        return cats.sort();
    };

    const getCategoryData = () => {
        const catMap = {};
        stocks.forEach(item => {
            const val = (parseFloat(item.quantity) || 0) * (parseFloat(item.purchase_price) || 0);
            const cat = item.category || 'Diğer';
            catMap[cat] = (catMap[cat] || 0) + val;
        });
        return Object.keys(catMap).map(key => ({ name: key, value: catMap[key] })).filter(i => i.value > 0);
    };

    // ── Filtering & Sorting ───────────────────────────────────────
    const filteredStocks = stocks.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.category || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchCat = !categoryFilter || s.category === categoryFilter;
        return matchSearch && matchCat;
    });

    const sortedStocks = [...filteredStocks].sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (sortConfig.key === 'quantity' || sortConfig.key === 'purchase_price') {
            aVal = parseFloat(aVal) || 0;
            bVal = parseFloat(bVal) || 0;
        } else {
            aVal = aVal ? aVal.toString().toLowerCase() : '';
            bVal = bVal ? bVal.toString().toLowerCase() : '';
        }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (key) => {
        setSortConfig(c => ({ key, direction: c.key === key && c.direction === 'asc' ? 'desc' : 'asc' }));
    };

    // ── Handlers ──────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = currentItem ? `/stock-tracking/${currentItem.id}` : '/stock-tracking';
            const method = currentItem ? 'put' : 'post';
            await api[method](url, formData);
            await fetchStocks();
            setModalOpen(false);
            setEditingId(null);
            setFormData(emptyForm);
            setCurrentItem(null);
            addToast(currentItem ? 'Stok güncellendi.' : 'Yeni stok eklendi.');
        } catch (err) {
            addToast('Hata: ' + (err.response?.data?.message || err.message), 'error');
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
            await fetchStocks();
            setTransactionOpenId(null);
            setTransactionData({ type: 'out', quantity: 1, project_id: '', description: '' });
            addToast(transactionData.type === 'in' ? 'Stok girişi kaydedildi.' : 'Stok çıkışı kaydedildi.');
        } catch (err) {
            addToast('Hata: ' + (err.response?.data?.message || err.message), 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu stoğu silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/stock-tracking/${id}`);
            await fetchStocks();
            setEditingId(null);
            addToast('Stok silindi.', 'error');
        } catch (err) {
            addToast('Silme hatası: ' + (err.response?.data?.message || err.message), 'error');
        }
    };

    const toggleHistory = async (stock) => {
        if (historyId === stock.id) {
            setHistoryId(null);
            return;
        }
        setEditingId(null);
        setTransactionOpenId(null);
        setCurrentItem(stock);
        setStockHistory([]);
        setHistoryId(stock.id);
        try {
            const res = await api.get(`/stock-tracking/${stock.id}/history`);
            setStockHistory(res.data);
        } catch { }
    };

    const startInlineEdit = (stock) => {
        setHistoryId(null);
        setTransactionOpenId(null);
        setCurrentItem(stock);
        setFormData({ ...stock });
        setEditingId(stock.id);
    };

    const cancelInlineEdit = () => {
        setEditingId(null);
        setCurrentItem(null);
        setFormData(emptyForm);
    };

    // ── Cost preview for out transaction ─────────────────────────
    const estimatedCost = (() => {
        if (!currentItem || transactionData.type !== 'out') return null;
        const price = parseFloat(currentItem.purchase_price) || 0;
        const qty = parseFloat(transactionData.quantity) || 0;
        return price > 0 && qty > 0 ? price * qty : null;
    })();

    // ── Inline section styles (theme-aware) ───────────────────────
    const inlineSectionStyle = {
        background: isDarkMode ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.04)',
        padding: '15px',
        borderRadius: '10px',
        marginTop: '10px',
        border: '1px solid var(--glass-border)',
        animation: 'slideDown 0.2s ease-out',
    };

    // ── Render ────────────────────────────────────────────────────
    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>

            {/* ── CSS ── */}
            <style>{`
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(30px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                .history-table th {
                    padding: 8px 10px;
                    text-align: left;
                    color: var(--text-secondary);
                    font-weight: 500;
                    font-size: 0.78rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    border-bottom: 1px solid var(--glass-border);
                    background: transparent;
                }
                .history-table td {
                    padding: 9px 10px;
                    border-bottom: 1px solid var(--glass-border);
                    background: transparent;
                    color: var(--text-primary);
                    font-size: 0.88rem;
                    min-width: 0;
                }
                .history-table tr:last-child td { border-bottom: none; }
                .history-table tr:hover td { background: var(--glass-surface); }
                .sort-btn {
                    background: var(--glass-surface);
                    border: 1px solid var(--glass-border);
                    color: var(--text-secondary);
                    padding: 6px 12px;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    white-space: nowrap;
                }
                .sort-btn.active {
                    background: rgba(99,102,241,0.15);
                    border-color: rgba(99,102,241,0.4);
                    color: #818cf8;
                }
                .sort-btn:hover { border-color: var(--primary); color: var(--text-primary); }
                .stock-card {
                    transition: box-shadow 0.2s ease, transform 0.2s ease;
                }
                .stock-card:hover {
                    transform: translateY(-1px);
                }
                .category-pill {
                    font-size: 0.72rem;
                    color: var(--text-secondary);
                    background: var(--glass-surface);
                    border: 1px solid var(--glass-border);
                    padding: 2px 8px;
                    border-radius: 20px;
                    display: inline-block;
                }
                .form-label {
                    display: block;
                    margin-bottom: 5px;
                    color: var(--text-secondary);
                    font-size: 0.82rem;
                    font-weight: 500;
                }
                .cost-preview {
                    background: rgba(245, 158, 11, 0.1);
                    border: 1px solid rgba(245, 158, 11, 0.3);
                    border-radius: 8px;
                    padding: 8px 14px;
                    font-size: 0.85rem;
                    color: #fbbf24;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 8px;
                }
                /* ── PRINT ── */
                @media print {
                    @page { margin: 1cm; size: A4; }
                    .no-print { display: none !important; }
                    .sidebar, .sidebar-container { display: none !important; }
                    html, body, #root, .App, .dashboard, .main-content {
                        background: white !important; color: black !important;
                        height: auto !important; overflow: visible !important;
                        position: static !important; width: 100% !important;
                        margin: 0 !important; padding: 0 !important; display: block !important;
                    }
                    .glass-panel {
                        background: none !important; box-shadow: none !important;
                        border: none !important; border-radius: 0 !important;
                        margin: 0 !important; padding: 0 !important;
                        display: flex !important; flex-direction: row !important;
                        align-items: center !important; justify-content: space-between !important;
                        border-bottom: 1px solid #ccc !important; padding: 4px 0 !important;
                        page-break-inside: avoid;
                    }
                    .glass-panel:nth-of-type(even) {
                        background-color: #f3f3f3 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .glass-panel > div {
                        display: flex !important; flex-direction: row !important;
                        align-items: center !important; width: 100% !important;
                        margin: 0 !important; gap: 10px !important;
                    }
                    .glass-panel > div > div:first-child { flex: 1 !important; }
                    .glass-panel > div > div:nth-child(2)::after {
                        content: "" !important; display: block !important;
                        width: 120px !important; height: 35px !important;
                        border: 2px solid #000 !important; background: white !important;
                    }
                    .glass-panel > div > div:nth-child(2) * { display: none !important; }
                    .glass-panel > div > div:last-child { display: none !important; }
                    .print-header { display: flex !important; justify-content: space-between; align-items: center; border-bottom: 2px solid black; padding-bottom: 5px; margin-bottom: 10px; }
                    .print-header h2 { margin: 0; font-size: 1.2rem; }
                    * { opacity: 1 !important; color: #000 !important; -webkit-text-fill-color: #000 !important; }
                }
                .print-header { display: none; }
            `}</style>

            {/* Toast */}
            <Toast toasts={toasts} removeToast={removeToast} />

            {/* Print Header */}
            <div className="print-header">
                <h2>Stok Listesi Raporu</h2>
                <p>{new Date().toLocaleDateString('tr-TR')}</p>
            </div>

            {/* ── Page Header ── */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Package size={22} /> Stok Takibi
                </h2>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => setSummaryModalOpen(true)} className="glass-btn" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(168,85,247,0.2) 100%)', borderColor: 'rgba(99,102,241,0.3)' }}>
                        <PieChartIcon size={16} /> Envanter
                    </button>
                    <button onClick={() => window.print()} className="glass-btn glass-btn-secondary">
                        <Printer size={16} /> Yazdır
                    </button>
                    <button onClick={() => { setCurrentItem(null); setFormData(emptyForm); setModalOpen(true); }} className="glass-btn glass-btn-success">
                        <Plus size={16} /> Yeni Stok
                    </button>
                    <button onClick={() => setImportModalOpen(true)} className="glass-btn glass-btn-primary">
                        <Upload size={16} /> Excel
                    </button>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="no-print" style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <StatCard
                    icon={<Package size={20} />}
                    label="Toplam Ürün"
                    value={stocks.length}
                    color="#6366f1"
                />
                <StatCard
                    icon={<AlertTriangle size={20} />}
                    label="Kritik Stok"
                    value={getCriticalCount()}
                    color={getCriticalCount() > 0 ? '#ef4444' : '#10b981'}
                />
                <StatCard
                    icon={<TrendingUp size={20} />}
                    label="Toplam Değer"
                    value={formatCurrency(getTotalValue())}
                    color="#10b981"
                />
            </div>

            {/* ── Search & Filter Bar ── */}
            <div className="glass-panel no-print" style={{ padding: '16px 20px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Search */}
                    <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} size={16} />
                        <input
                            type="text"
                            placeholder="Ürün adı veya kategori ara..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="glass-input"
                            style={{ paddingLeft: '38px', paddingTop: '9px', paddingBottom: '9px' }}
                        />
                    </div>
                    {/* Category Filter */}
                    <div style={{ position: 'relative' }}>
                        <Filter style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} size={15} />
                        <ChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} size={14} />
                        <select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            className="glass-input"
                            style={{ paddingLeft: '32px', paddingRight: '30px', paddingTop: '9px', paddingBottom: '9px', minWidth: '160px', appearance: 'none' }}
                        >
                            <option value="">Tüm Kategoriler</option>
                            {getCategories().map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>

                {/* Sort Controls */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', alignSelf: 'center', marginRight: '4px' }}>Sırala:</span>
                    {[
                        { key: 'name', label: 'İsim' },
                        { key: 'quantity', label: 'Adet' },
                        { key: 'category', label: 'Kategori' },
                        { key: 'critical_level', label: 'Kritik' },
                        { key: 'purchase_price', label: 'Fiyat' },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => handleSort(key)}
                            className={`sort-btn ${sortConfig.key === key ? 'active' : ''}`}
                        >
                            {label}
                            {sortConfig.key === key && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Stock List ── */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                    <Package size={40} style={{ opacity: 0.4, marginBottom: '12px' }} />
                    <p>Yükleniyor...</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {sortedStocks.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)', background: 'var(--glass-surface)', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
                            <Package size={44} style={{ opacity: 0.35, marginBottom: '12px' }} />
                            <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {searchTerm || categoryFilter ? 'Arama sonucu bulunamadı' : 'Henüz stok eklenmemiş'}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.85rem' }}>
                                {searchTerm || categoryFilter
                                    ? `"${searchTerm || categoryFilter}" için sonuç yok. Filtrelerinizi temizleyin.`
                                    : 'Sağ üstteki "Yeni Stok" düğmesiyle başlayın.'}
                            </p>
                            {(searchTerm || categoryFilter) && (
                                <button className="glass-btn glass-btn-secondary" style={{ marginTop: '16px', fontSize: '0.83rem' }}
                                    onClick={() => { setSearchTerm(''); setCategoryFilter(''); }}>
                                    <X size={14} /> Filtreleri Temizle
                                </button>
                            )}
                        </div>
                    )}

                    {sortedStocks.map(stock => {
                        const isCritical = parseFloat(stock.quantity) <= parseFloat(stock.critical_level);
                        const isEditOpen = editingId === stock.id;
                        const isHistoryOpen = historyId === stock.id;
                        const isTransOpen = transactionOpenId === stock.id;

                        return (
                            <div key={stock.id} className="glass-panel stock-card" style={{
                                padding: '14px 18px',
                                borderLeft: `4px solid ${isCritical ? '#ef4444' : '#10b981'}`,
                            }}>
                                {/* ── Card Header Row ── */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>

                                    {/* Left: Name + category */}
                                    <div style={{ flex: 1, minWidth: '180px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {stock.name}
                                            </span>
                                            {isCritical && (
                                                <span style={{ fontSize: '0.65rem', color: '#ef4444', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', padding: '1px 7px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                    <AlertTriangle size={9} /> Kritik
                                                </span>
                                            )}
                                        </div>
                                        <span className="category-pill">{stock.category}</span>
                                    </div>

                                    {/* Middle: Quantity */}
                                    <div style={{ textAlign: 'right', minWidth: '90px' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: isCritical ? '#ef4444' : 'var(--text-primary)' }}>
                                            {stock.quantity}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{stock.unit}</div>
                                        {stock.purchase_price > 0 && (
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                {formatCurrency(stock.purchase_price)}/birim
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="no-print" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => startTransaction(stock, 'in')}
                                            className="glass-btn glass-btn-success"
                                            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                                            title="Stok Girişi"
                                        >
                                            + Giriş
                                        </button>
                                        <button
                                            onClick={() => startTransaction(stock, 'out')}
                                            className="glass-btn glass-btn-danger"
                                            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                                            title="Stok Çıkışı"
                                        >
                                            – Çıkış
                                        </button>
                                        <button
                                            onClick={() => toggleHistory(stock)}
                                            className={`glass-btn ${isHistoryOpen ? 'glass-btn-primary' : 'glass-btn-secondary'}`}
                                            style={{ padding: '6px 10px' }}
                                            title="Hareket Geçmişi"
                                        >
                                            <History size={15} />
                                        </button>
                                        <button
                                            onClick={() => startInlineEdit(stock)}
                                            className={`glass-btn ${isEditOpen ? 'glass-btn-primary' : 'glass-btn-secondary'}`}
                                            style={{ padding: '6px 10px' }}
                                            title="Düzenle"
                                        >
                                            <Edit2 size={15} />
                                        </button>
                                    </div>
                                </div>

                                {/* ── Inline: History ── */}
                                {isHistoryOpen && (
                                    <div style={inlineSectionStyle} className="no-print">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                Hareket Geçmişi
                                            </h4>
                                            <button onClick={() => setHistoryId(null)} className="glass-btn glass-btn-secondary" style={{ padding: '3px 10px', fontSize: '0.72rem' }}>
                                                <X size={12} /> Kapat
                                            </button>
                                        </div>
                                        <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                                            <table className="history-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                                                            <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                                                {new Date(h.transaction_date).toLocaleDateString('tr-TR')} {new Date(h.transaction_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                            </td>
                                                            <td data-label="İşlem">
                                                                {h.type === 'in'
                                                                    ? <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}><ArrowLeft size={13} /> Giriş</span>
                                                                    : <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>Çıkış <ArrowRight size={13} /></span>
                                                                }
                                                            </td>
                                                            <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{h.quantity}</td>
                                                            <td style={{ fontSize: '0.8rem' }}>
                                                                {h.project_name && <div style={{ color: '#60a5fa', marginBottom: '2px' }}>📂 {h.project_name}</div>}
                                                                {h.description && <div style={{ color: 'var(--text-secondary)' }}>{h.description}</div>}
                                                                <div style={{ color: 'var(--text-secondary)', opacity: 0.6, fontSize: '0.72rem' }}>👤 {h.username}</div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {stockHistory.length === 0 && (
                                                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Henüz hareket yok.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* ── Inline: Transaction Form ── */}
                                {isTransOpen && (
                                    <div style={inlineSectionStyle} className="no-print">
                                        <div style={{ marginBottom: '12px' }}>
                                            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.92rem', color: transactionData.type === 'in' ? '#86efac' : '#fca5a5' }}>
                                                {transactionData.type === 'in' ? '📥 Stok Girişi' : '📤 Stok Çıkışı'} — {stock.name}
                                            </h4>
                                            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                                Mevcut: <strong style={{ color: 'var(--text-primary)' }}>{stock.quantity} {stock.unit}</strong>
                                            </p>
                                        </div>
                                        <form onSubmit={handleTransaction}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                                                <div>
                                                    <label className="form-label">Miktar ({stock.unit})</label>
                                                    <input
                                                        autoFocus required type="number" step="0.01" min="0.01"
                                                        value={transactionData.quantity}
                                                        onChange={e => setTransactionData({ ...transactionData, quantity: e.target.value })}
                                                        className="glass-input"
                                                        style={{ paddingTop: '8px', paddingBottom: '8px' }}
                                                    />
                                                </div>

                                                {transactionData.type === 'out' && (
                                                    <div>
                                                        <label className="form-label">Proje (opsiyonel)</label>
                                                        <select
                                                            value={transactionData.project_id}
                                                            onChange={e => setTransactionData({ ...transactionData, project_id: e.target.value })}
                                                            className="glass-input"
                                                            style={{ paddingTop: '8px', paddingBottom: '8px' }}
                                                        >
                                                            <option value="">-- Proje Seçin --</option>
                                                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                        </select>
                                                    </div>
                                                )}

                                                <div>
                                                    <label className="form-label">Açıklama</label>
                                                    <input
                                                        type="text"
                                                        value={transactionData.description}
                                                        onChange={e => setTransactionData({ ...transactionData, description: e.target.value })}
                                                        placeholder="Tedarikçi, kullanım yeri…"
                                                        className="glass-input"
                                                        style={{ paddingTop: '8px', paddingBottom: '8px' }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Cost Preview */}
                                            {estimatedCost !== null && (
                                                <div className="cost-preview">
                                                    <TrendingUp size={15} />
                                                    Tahmini maliyet: <strong>{formatCurrency(estimatedCost)}</strong>
                                                    <span style={{ opacity: 0.7, fontSize: '0.78rem' }}>({formatCurrency(parseFloat(currentItem.purchase_price))} × {transactionData.quantity} {stock.unit})</span>
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                                                <button type="button" onClick={cancelTransaction} className="glass-btn glass-btn-secondary">İptal</button>
                                                <button type="submit" className={`glass-btn ${transactionData.type === 'in' ? 'glass-btn-success' : 'glass-btn-danger'}`}>
                                                    {transactionData.type === 'in' ? '+ Onayla' : '– Onayla'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* ── Inline: Edit Form ── */}
                                {isEditOpen && (
                                    <form onSubmit={handleSubmit} style={inlineSectionStyle} className="no-print">
                                        <h4 style={{ margin: '0 0 14px 0', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            ✏️ Düzenle — {stock.name}
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                                            <div>
                                                <label className="form-label">Ürün Adı</label>
                                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="glass-input" style={{ paddingTop: '8px', paddingBottom: '8px' }} />
                                            </div>
                                            <div>
                                                <label className="form-label">Kategori</label>
                                                <input type="text" list="categories-edit" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="glass-input" style={{ paddingTop: '8px', paddingBottom: '8px' }} />
                                                <datalist id="categories-edit">
                                                    {getCategories().map(c => <option key={c} value={c} />)}
                                                </datalist>
                                            </div>
                                            <div>
                                                <label className="form-label">Birim</label>
                                                <select value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} className="glass-input" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
                                                    {['Adet', 'Metre', 'Kg', 'Kutu', 'Top', 'Litre', 'Rulo'].map(u => <option key={u} value={u}>{u}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="form-label">Birim Fiyat (TL)</label>
                                                <input type="number" step="0.01" min="0" value={formData.purchase_price || 0} onChange={e => setFormData({ ...formData, purchase_price: e.target.value })} className="glass-input" style={{ paddingTop: '8px', paddingBottom: '8px' }} />
                                            </div>
                                            <div>
                                                <label className="form-label">Kritik Seviye</label>
                                                <input type="number" min="0" value={formData.critical_level} onChange={e => setFormData({ ...formData, critical_level: e.target.value })} className="glass-input" style={{ paddingTop: '8px', paddingBottom: '8px' }} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <button type="button" onClick={() => handleDelete(stock.id)} className="glass-btn glass-btn-danger" style={{ fontSize: '0.82rem' }}>
                                                🗑 Sil
                                            </button>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button type="button" onClick={cancelInlineEdit} className="glass-btn glass-btn-secondary">İptal</button>
                                                <button type="submit" className="glass-btn glass-btn-primary">Kaydet</button>
                                            </div>
                                        </div>
                                    </form>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── New Stock Modal ── */}
            {modalOpen && (
                <div className="modal-overlay no-print">
                    <div className="modal-content glass-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Yeni Stok Ekle</h3>
                            <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Ürün Adı *</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="glass-input" placeholder="Ör: RG59 Kablo" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Kategori</label>
                                <input type="text" list="categories-new" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="glass-input" placeholder="Genel" />
                                <datalist id="categories-new">
                                    {getCategories().map(c => <option key={c} value={c} />)}
                                    <option value="Kablo" /><option value="Kamera" /><option value="Sarf Malzeme" /><option value="Alet" />
                                </datalist>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Başlangıç Miktarı</label>
                                    <input type="number" step="0.01" min="0" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} className="glass-input" />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Birim</label>
                                    <select value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} className="glass-input">
                                        {['Adet', 'Metre', 'Kg', 'Kutu', 'Top', 'Litre', 'Rulo'].map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Birim Fiyat (TL)</label>
                                    <input type="number" step="0.01" min="0" value={formData.purchase_price || 0} onChange={e => setFormData({ ...formData, purchase_price: e.target.value })} className="glass-input" placeholder="0.00" />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Kritik Seviye</label>
                                    <input type="number" min="0" value={formData.critical_level} onChange={e => setFormData({ ...formData, critical_level: e.target.value })} className="glass-input" placeholder="5" />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                                <button type="button" onClick={() => setModalOpen(false)} className="glass-btn glass-btn-secondary">İptal</button>
                                <button type="submit" className="glass-btn glass-btn-success"><Plus size={15} /> Ekle</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Import Modal ── */}
            {importModalOpen && (
                <div className="modal-overlay no-print">
                    <div className="modal-content glass-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, background: 'none', WebkitTextFillColor: 'unset', color: 'var(--text-primary)' }}>Excel ile Toplu Stok Yükle</h3>
                            <button onClick={() => setImportModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <div style={{ background: 'var(--glass-surface)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            📋 Excel sütunları: <strong style={{ color: 'var(--text-primary)' }}>Ürün Adı, Kategori, Miktar, Birim, Kritik, Fiyat</strong>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const fd = new FormData();
                            const file = e.target.file.files[0];
                            if (!file) return addToast('Dosya seçin.', 'error');
                            fd.append('file', file);
                            try {
                                const res = await api.post('/stock-tracking/bulk', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                                addToast(res.data.message.split('\n')[0]);
                                setImportModalOpen(false);
                                fetchStocks();
                            } catch (err) {
                                addToast('Yükleme hatası: ' + (err.response?.data?.message || err.message), 'error');
                            }
                        }}>
                            <div className="form-group">
                                <label className="form-label">Excel Dosyası (.xlsx)</label>
                                <div style={{ position: 'relative' }}>
                                    <input id="file-upload" name="file" type="file" accept=".xlsx,.xls" required
                                        style={{ opacity: 0, position: 'absolute', width: '100%', height: '100%', cursor: 'pointer' }}
                                        onChange={e => { document.getElementById('file-label-text').innerText = e.target.files[0]?.name || 'Dosya seçilmedi'; }}
                                    />
                                    <label htmlFor="file-upload" className="file-upload-label">
                                        <Upload size={16} /> <span id="file-label-text">Dosya Seçin…</span>
                                    </label>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                                <button type="button" onClick={() => setImportModalOpen(false)} className="glass-btn glass-btn-secondary">İptal</button>
                                <button type="submit" className="glass-btn glass-btn-primary"><Upload size={15} /> Yükle</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Summary Modal ── */}
            {summaryModalOpen && (
                <div className="modal-overlay no-print">
                    <div className="modal-content glass-panel" style={{ maxWidth: '700px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', background: 'none', WebkitTextFillColor: 'unset', color: 'var(--text-primary)' }}>
                                <TrendingUp size={20} /> Envanter Özeti
                            </h3>
                            <button onClick={() => setSummaryModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        {/* Summary Stat Cards */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '140px', padding: '20px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.04) 100%)', border: '1px solid rgba(99,102,241,0.25)', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.78rem', color: '#818cf8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Toplam Değer</div>
                                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(getTotalValue())}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{stocks.length} kalem ürün</div>
                            </div>
                            <div style={{ flex: 1, minWidth: '140px', padding: '20px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.04) 100%)', border: '1px solid rgba(239,68,68,0.25)', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.78rem', color: '#f87171', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kritik Stok</div>
                                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: getCriticalCount() > 0 ? '#ef4444' : 'var(--text-primary)' }}>{getCriticalCount()}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>sipariş gerekebilir</div>
                            </div>
                        </div>

                        {/* Pie Chart */}
                        {getCategoryData().length > 0 && (
                            <div style={{ padding: '20px', background: 'var(--glass-surface)', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
                                <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'none', WebkitTextFillColor: 'unset' }}>
                                    Kategori Bazlı Değer Dağılımı
                                </h4>
                                <div style={{ height: '260px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={getCategoryData()} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                                                {getCategoryData().map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: '#334155', color: 'var(--text-primary)', borderRadius: '10px' }} />
                                            <Legend verticalAlign="bottom" height={36} formatter={(value) => <span style={{ color: 'var(--text-primary)', fontSize: '0.82rem' }}>{value}</span>} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        <button onClick={() => setSummaryModalOpen(false)} className="glass-btn glass-btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>
                            Kapat
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockPage;
