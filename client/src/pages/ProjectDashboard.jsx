import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, FolderOpen, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProjectDashboard = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
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
                    <button onClick={() => setShowModal(true)} className="glass-btn" style={{ background: 'rgba(76, 175, 80, 0.2)', border: '1px solid #4CAF50' }}>
                        <Plus size={18} style={{ marginRight: '5px' }} /> Yeni Proje
                    </button>
                )}
            </div>

            {loading ? <p>Yükleniyor...</p> : (
                {
                    projects.map(project => {
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
                                    background: 'rgba(30, 30, 30, 0.4)', // More transparent
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '15px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    position: 'relative',
                                    color: 'white'
                                }}
                                onClick={() => navigate(isTech ? `/tech/projects/${project.id}` : `/admin/projects/${project.id}`)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.background = 'rgba(30, 30, 30, 0.6)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.background = 'rgba(30, 30, 30, 0.4)';
                                }}
                            >
                                <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between' }}>
                                    <div style={{ flex: 1, paddingRight: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: '600' }}>{project.name}</h3>
                                            {isOverdue && <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>SÜRE BİTTİ</span>}
                                        </div>

                                        <p style={{ color: '#aaa', fontSize: '0.9rem', height: '40px', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '15px' }}>
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
                                                stroke={isProfitable ? '#ef4444' : '#ef4444'} // Expenses usually red
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

                                {/* Progress Bar Container */}
                                <div style={{ background: 'rgba(255,255,255,0.1)', height: '4px', width: '100%' }}>
                                    <div style={{
                                        width: `${progress}%`,
                                        height: '100%',
                                        background: progressColor,
                                        transition: 'width 0.5s ease-in-out'
                                    }} />
                                </div>
                            </div>
                        );
                    })
                }
                </div>
    )
}

{/* CREATE MODAL */ }
{
    showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: '#1e1e1e', padding: '30px', borderRadius: '15px', width: '400px', border: '1px solid #333' }}>
                <h2 style={{ marginTop: 0 }}>Yeni Proje / İhale</h2>
                <form onSubmit={handleCreate}>
                    <div className="form-group">
                        <label>Proje Adı</label>
                        <input required type="text" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} className="dark-input" style={{ width: '100%', padding: '10px', marginTop: '5px', background: '#333', border: 'none', color: 'white', borderRadius: '5px' }} />
                    </div>
                    <div className="form-group" style={{ marginTop: '15px' }}>
                        <label>Açıklama</label>
                        <textarea value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} className="dark-input" style={{ width: '100%', padding: '10px', marginTop: '5px', background: '#333', border: 'none', color: 'white', borderRadius: '5px' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>İhale Bedeli</label>
                            <input type="number" value={newProject.tender_price || ''} onChange={e => setNewProject({ ...newProject, tender_price: e.target.value })} className="dark-input" style={{ width: '100%', padding: '10px', marginTop: '5px', background: '#333', border: 'none', color: 'white', borderRadius: '5px' }} />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Hakediş (Alınan)</label>
                            <input type="number" value={newProject.progress_payment || ''} onChange={e => setNewProject({ ...newProject, progress_payment: e.target.value })} className="dark-input" style={{ width: '100%', padding: '10px', marginTop: '5px', background: '#333', border: 'none', color: 'white', borderRadius: '5px' }} />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '15px' }}>
                        <label>Başlangıç Tarihi</label>
                        <input required type="date" value={newProject.start_date} onChange={e => setNewProject({ ...newProject, start_date: e.target.value })} className="dark-input" style={{ width: '100%', padding: '10px', marginTop: '5px', background: '#333', border: 'none', color: 'white', borderRadius: '5px' }} />
                    </div>
                    <div className="form-group" style={{ marginTop: '15px' }}>
                        <label>Bitiş Tarihi</label>
                        <input required type="date" value={newProject.end_date} onChange={e => setNewProject({ ...newProject, end_date: e.target.value })} className="dark-input" style={{ width: '100%', padding: '10px', marginTop: '5px', background: '#333', border: 'none', color: 'white', borderRadius: '5px' }} />
                    </div>

                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', background: '#444', color: 'white', cursor: 'pointer' }}>İptal</button>
                        <button type="submit" style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', background: '#4facfe', color: 'white', cursor: 'pointer' }}>Oluştur</button>
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
