import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, FolderOpen, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProjectDashboard = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'
    const navigate = useNavigate();
    const { user } = useAuth();
    const isTech = user?.role === 'technician';

    // Modal for create
    const [showModal, setShowModal] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '', start_date: '', end_date: '' });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects', newProject);
            setShowModal(false);
            fetchProjects();
            setNewProject({ name: '', description: '', start_date: '', end_date: '' });
        } catch (err) {
            console.error(err);
            alert('Hata oluştu: ' + (err.response?.data || err.message));
        }
    };

    const handleComplete = async (id, name) => {
        if (!window.confirm(`"${name}" projesini tamamlandı olarak işaretlemek istiyor musunuz? Bu işlem projeyi Arşiv sekmesine taşıyacaktır.`)) return;

        try {
            // We need to fetch current project data first to preserve other fields, OR if backend supports PATCH.
            // Assuming PUT requires all fields, let's fetch first. Or stick to assume db handles partial?
            // Safer: standard PUT to /projects/:id
            const current = projects.find(p => p.id === id);
            await api.put(`/projects/${id}`, { ...current, status: 'completed' });
            fetchProjects();
        } catch (err) {
            console.error(err);
            alert('Güncelleme başarısız');
        }
    };

    const calculateProgress = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const now = new Date();

        if (now < startDate) return 0;
        if (now > endDate) return 100;

        const total = endDate - startDate;
        const elapsed = now - startDate;
        return Math.min(100, Math.max(0, (elapsed / total) * 100));
    };

    const getProgressColor = (pct) => {
        if (pct >= 100) return '#ef4444'; // Red (Overdue/Done)
        if (pct > 75) return '#f59e0b'; // Yellow/Orange
        return '#10b981'; // Green
    };

    return (
        <div style={{ padding: '20px', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FolderOpen size={32} color="#4facfe" />
                    <span>Şantiye & Proje Yönetimi</span>
                </h1>

                {!isTech && (
                    <button onClick={() => setShowModal(true)} className="glass-btn" style={{ background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', color: '#a5b4fc' }}>
                        <Plus size={18} style={{ marginRight: '5px' }} /> Yeni Proje
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <button
                    onClick={() => setActiveTab('active')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: activeTab === 'active' ? '#6366f1' : '#8b9dc3',
                        borderBottom: activeTab === 'active' ? '2px solid #6366f1' : '2px solid transparent',
                        padding: '10px 20px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        transition: 'color 0.2s ease'
                    }}
                >
                    Devam Edenler
                </button>
                <button
                    onClick={() => setActiveTab('completed')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: activeTab === 'completed' ? '#6366f1' : '#8b9dc3',
                        borderBottom: activeTab === 'completed' ? '2px solid #6366f1' : '2px solid transparent',
                        padding: '10px 20px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        transition: 'color 0.2s ease'
                    }}
                >
                    Tamamlananlar (Arşiv)
                </button>
            </div>

            {loading ? <p>Yükleniyor...</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {projects
                        .filter(p => activeTab === 'active' ? p.status !== 'completed' : p.status === 'completed')
                        .map(project => {
                            const progress = calculateProgress(project.start_date, project.end_date);
                            const progressColor = getProgressColor(progress);
                            const isOverdue = new Date() > new Date(project.end_date) && project.status !== 'completed';

                            // Financials
                            const income = parseFloat(project.progress_payment) || parseFloat(project.tender_price) || 1; // Avoid divide by zero
                            const expense = parseFloat(project.total_expenses) || 0;
                            const profit = income - expense;
                            const expensePct = Math.min(100, (expense / income) * 100);
                            const isProfitable = profit >= 0;

                            // Circular Graph Data
                            const radius = 30;
                            const circumference = 2 * Math.PI * radius;
                            const offset = circumference - (expensePct / 100) * circumference;

                            return (
                                <div
                                    key={project.id}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        backdropFilter: 'blur(12px)',
                                        borderRadius: '14px',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                                        position: 'relative',
                                        color: 'white'
                                    }}
                                    onClick={() => navigate(isTech ? `/tech/projects/${project.id}` : `/admin/projects/${project.id}`)}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between' }}>
                                        <div style={{ flex: 1, paddingRight: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fff', fontWeight: '600' }}>{project.name}</h3>
                                                {isOverdue && <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '600', letterSpacing: '0.5px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>SÜRE BİTTİ</span>}
                                            </div>

                                            <p style={{ color: '#8b9dc3', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '10px', margin: '0 0 10px 0' }}>
                                                {project.description || 'Açıklama yok'}
                                            </p>

                                            <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem', color: '#888' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <Calendar size={14} />
                                                    {new Date(project.start_date).toLocaleDateString('tr-TR')}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <ArrowRight size={14} />
                                                    {new Date(project.end_date).toLocaleDateString('tr-TR')}
                                                </div>
                                            </div>
                                        </div>

                                        {/* DONUT CHART AREA */}
                                        <div style={{ width: '80px', height: '80px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <svg width="80" height="80">
                                                {/* Background Circle (Profit/Income) */}
                                                <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                                                {/* Foreground Circle (Expense) */}
                                                <circle
                                                    cx="40" cy="40" r={radius}
                                                    fill="none"
                                                    stroke={isProfitable ? '#10b981' : '#ef4444'}
                                                    strokeWidth="6"
                                                    strokeDasharray={circumference}
                                                    strokeDashoffset={offset}
                                                    strokeLinecap="round"
                                                    transform="rotate(-90 40 40)"
                                                />
                                            </svg>
                                            <div style={{ position: 'absolute', textAlign: 'center', fontSize: '0.7rem', color: '#aaa' }}>
                                                <div style={{ fontWeight: 'bold', color: isProfitable ? '#10b981' : '#ef4444' }}>
                                                    {isProfitable ? 'KAR' : 'ZARAR'}
                                                </div>
                                                <div>%{Math.round(isProfitable ? (100 - expensePct) : expensePct)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div style={{ background: 'rgba(255,255,255,0.08)', height: '6px', width: '100%' }}>
                                        <div style={{
                                            width: `${progress}%`,
                                            height: '100%',
                                            background: `linear-gradient(90deg, ${progressColor}, ${progressColor}cc)`,
                                            borderRadius: '0 3px 3px 0',
                                            transition: 'width 0.5s ease-in-out'
                                        }} />
                                    </div>

                                    {/* Tamamla Button */}
                                    {activeTab === 'active' && !isTech && (
                                        <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleComplete(project.id, project.name);
                                                }}
                                                className="glass-btn"
                                                style={{
                                                    padding: '5px 12px',
                                                    fontSize: '0.78rem',
                                                    background: 'rgba(16, 185, 129, 0.15)',
                                                    color: '#10b981',
                                                    borderColor: 'rgba(16, 185, 129, 0.3)'
                                                }}
                                            >
                                                ✓ Tamamla
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                </div>
            )
            }

            {/* CREATE MODAL */}
            {
                showModal && (
                    <div onClick={() => setShowModal(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                        <div onClick={e => e.stopPropagation()} className="glass-panel" style={{ padding: '28px', width: '420px', maxWidth: '90vw' }}>
                            <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Yeni Proje / İhale</h2>
                            <form onSubmit={handleCreate}>
                                <div className="form-group">
                                    <label style={{ fontSize: '0.85rem', color: '#8b9dc3', marginBottom: '4px', display: 'block' }}>Proje Adı</label>
                                    <input required type="text" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} className="glass-input" />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '0.85rem', color: '#8b9dc3', marginBottom: '4px', display: 'block' }}>Açıklama</label>
                                    <textarea value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} className="glass-input" style={{ minHeight: '60px', resize: 'vertical' }} />
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.85rem', color: '#8b9dc3', marginBottom: '4px', display: 'block' }}>İhale Bedeli</label>
                                        <input type="number" value={newProject.tender_price || ''} onChange={e => setNewProject({ ...newProject, tender_price: e.target.value })} className="glass-input" />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.85rem', color: '#8b9dc3', marginBottom: '4px', display: 'block' }}>Hakediş (Alınan)</label>
                                        <input type="number" value={newProject.progress_payment || ''} onChange={e => setNewProject({ ...newProject, progress_payment: e.target.value })} className="glass-input" />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label style={{ fontSize: '0.85rem', color: '#8b9dc3', marginBottom: '4px', display: 'block' }}>Başlangıç Tarihi</label>
                                    <input required type="date" value={newProject.start_date} onChange={e => setNewProject({ ...newProject, start_date: e.target.value })} className="glass-input" />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '0.85rem', color: '#8b9dc3', marginBottom: '4px', display: 'block' }}>Bitiş Tarihi</label>
                                    <input required type="date" value={newProject.end_date} onChange={e => setNewProject({ ...newProject, end_date: e.target.value })} className="glass-input" />
                                </div>

                                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                    <button type="button" onClick={() => setShowModal(false)} className="glass-btn">İptal</button>
                                    <button type="submit" className="glass-btn" style={{ background: 'rgba(99, 102, 241, 0.25)', borderColor: 'rgba(99, 102, 241, 0.5)', color: '#a5b4fc' }}>Oluştur</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ProjectDashboard;
