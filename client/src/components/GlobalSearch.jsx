import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Users, Package, FolderOpen, Truck, ClipboardList, ArrowRight } from 'lucide-react';
import api from '../utils/api';

const CATEGORY_META = {
    tasks: { label: 'Görevler', icon: <ClipboardList size={14} />, color: '#6366f1', path: id => `/admin/pool` },
    users: { label: 'Personeller', icon: <Users size={14} />, color: '#10b981', path: id => `/admin/users` },
    projects: { label: 'Projeler', icon: <FolderOpen size={14} />, color: '#f59e0b', path: id => `/admin/projects/${id}` },
    stocks: { label: 'Stok', icon: <Package size={14} />, color: '#06b6d4', path: id => `/admin/stocks` },
    subs: { label: 'Taşeronlar', icon: <Truck size={14} />, color: '#a78bfa', path: id => `/admin/subs` },
};

const GlobalSearch = ({ onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({});
    const [loading, setLoading] = useState(false);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // Focus input on mount
    useEffect(() => { inputRef.current?.focus(); }, []);

    // Flatten results for keyboard navigation
    const flatResults = Object.entries(results).flatMap(([cat, items]) =>
        items.map(item => ({ ...item, _cat: cat }))
    );

    const search = useCallback(async (q) => {
        if (!q || q.trim().length < 2) { setResults({}); return; }
        setLoading(true);
        try {
            const [tasksRes, usersRes, projectsRes] = await Promise.allSettled([
                api.get(`/tasks?search=${encodeURIComponent(q)}&limit=5`),
                api.get(`/auth/users?search=${encodeURIComponent(q)}&limit=5`),
                api.get(`/projects?search=${encodeURIComponent(q)}&limit=5`),
            ]);

            const newResults = {};

            if (tasksRes.status === 'fulfilled') {
                const tasks = Array.isArray(tasksRes.value.data)
                    ? tasksRes.value.data
                    : (tasksRes.value.data?.tasks || []);
                const filtered = tasks.filter(t =>
                    t.title?.toLowerCase().includes(q.toLowerCase()) ||
                    t.customer_name?.toLowerCase().includes(q.toLowerCase())
                ).slice(0, 5);
                if (filtered.length) newResults.tasks = filtered.map(t => ({
                    id: t.id || t._id,
                    title: t.title || t.customer_name || 'Görev',
                    subtitle: t.status || t.region || ''
                }));
            }

            if (usersRes.status === 'fulfilled') {
                const users = Array.isArray(usersRes.value.data) ? usersRes.value.data : [];
                const filtered = users.filter(u =>
                    u.name?.toLowerCase().includes(q.toLowerCase()) ||
                    u.username?.toLowerCase().includes(q.toLowerCase()) ||
                    u.role?.toLowerCase().includes(q.toLowerCase())
                ).slice(0, 5);
                if (filtered.length) newResults.users = filtered.map(u => ({
                    id: u.id || u._id,
                    title: u.name || u.username,
                    subtitle: u.role || ''
                }));
            }

            if (projectsRes.status === 'fulfilled') {
                const projects = Array.isArray(projectsRes.value.data) ? projectsRes.value.data : [];
                const filtered = projects.filter(p =>
                    p.name?.toLowerCase().includes(q.toLowerCase()) ||
                    p.customer?.toLowerCase().includes(q.toLowerCase())
                ).slice(0, 5);
                if (filtered.length) newResults.projects = filtered.map(p => ({
                    id: p.id || p._id,
                    title: p.name || p.customer || 'Proje',
                    subtitle: p.status || ''
                }));
            }

            setResults(newResults);
            setSelectedIdx(0);
        } catch (e) {
            console.error('Search error:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => search(query), 280);
        return () => clearTimeout(t);
    }, [query, search]);

    // Keyboard navigation
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape') { onClose(); }
            if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, flatResults.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
            if (e.key === 'Enter' && flatResults[selectedIdx]) {
                const item = flatResults[selectedIdx];
                navigate(CATEGORY_META[item._cat].path(item.id));
                onClose();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [flatResults, selectedIdx, navigate, onClose]);

    const handleResultClick = (item) => {
        navigate(CATEGORY_META[item._cat].path(item.id));
        onClose();
    };

    const hasResults = Object.keys(results).length > 0;
    let globalIdx = 0;

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 99999,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                paddingTop: '10vh'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: 'min(600px, calc(100vw - 32px))',
                    background: 'var(--glass-bg)', border: 'var(--glass-border)',
                    borderRadius: '20px', overflow: 'hidden',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(20px)'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '18px 20px', borderBottom: 'var(--glass-border)', gap: '12px' }}>
                    {loading
                        ? <div style={{ width: '20px', height: '20px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                        : <Search size={20} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                    }
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Personel, görev, proje ara..."
                        style={{
                            flex: 1, background: 'none', border: 'none', outline: 'none',
                            fontSize: '1.05rem', color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif'
                        }}
                    />
                    {query && (
                        <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
                            <X size={18} />
                        </button>
                    )}
                    <kbd style={{ padding: '3px 7px', borderRadius: '6px', background: 'var(--glass-surface)', border: 'var(--glass-border)', fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0 }}>ESC</kbd>
                </div>

                {/* Results */}
                {hasResults && (
                    <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '12px' }}>
                        {Object.entries(results).map(([cat, items]) => {
                            const meta = CATEGORY_META[cat];
                            return (
                                <div key={cat} style={{ marginBottom: '12px' }}>
                                    <div style={{ padding: '4px 8px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: meta.color, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                        {meta.icon} {meta.label}
                                    </div>
                                    {items.map(item => {
                                        const idx = globalIdx++;
                                        const isSelected = idx === selectedIdx;
                                        return (
                                            <div key={item.id}
                                                onClick={() => handleResultClick({ ...item, _cat: cat })}
                                                style={{
                                                    padding: '10px 14px', borderRadius: '10px',
                                                    background: isSelected ? `${meta.color}18` : 'transparent',
                                                    border: `1px solid ${isSelected ? meta.color + '44' : 'transparent'}`,
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                    justifyContent: 'space-between', gap: '10px',
                                                    transition: 'all 0.12s', marginBottom: '2px'
                                                }}
                                                onMouseEnter={() => setSelectedIdx(idx)}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                                        {highlightText(item.title, query)}
                                                    </div>
                                                    {item.subtitle && (
                                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{item.subtitle}</div>
                                                    )}
                                                </div>
                                                {isSelected && <ArrowRight size={14} color={meta.color} style={{ flexShrink: 0 }} />}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Empty state */}
                {query.length >= 2 && !loading && !hasResults && (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <Search size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                        <div style={{ fontSize: '0.9rem' }}>"{query}" için sonuç bulunamadı</div>
                    </div>
                )}

                {/* Hints */}
                {!query && (
                    <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                        {Object.values(CATEGORY_META).map(m => (
                            <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                                <span style={{ color: m.color }}>{m.icon}</span> {m.label}
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div style={{ padding: '10px 20px', borderTop: 'var(--glass-border)', display: 'flex', gap: '16px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span><kbd style={{ background: 'var(--glass-surface)', padding: '1px 5px', borderRadius: '4px', fontSize: '0.7rem' }}>↑↓</kbd> Seç</span>
                    <span><kbd style={{ background: 'var(--glass-surface)', padding: '1px 5px', borderRadius: '4px', fontSize: '0.7rem' }}>Enter</kbd> Git</span>
                    <span><kbd style={{ background: 'var(--glass-surface)', padding: '1px 5px', borderRadius: '4px', fontSize: '0.7rem' }}>Esc</kbd> Kapat</span>
                </div>
            </div>
        </div>
    );
};

// Highlight matching text
function highlightText(text, query) {
    if (!query || !text) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
        <>
            {text.slice(0, idx)}
            <mark style={{ background: 'rgba(99,102,241,0.25)', color: 'inherit', borderRadius: '2px', padding: '0 1px' }}>
                {text.slice(idx, idx + query.length)}
            </mark>
            {text.slice(idx + query.length)}
        </>
    );
}

export default GlobalSearch;
