import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { Map, Activity, FolderArchive, Plus, ClipboardList, FolderOpen, AlertTriangle } from 'lucide-react';
import { getInitials, stringToColor } from '../utils/helpers';

// Sub-components
import TaskCard from '../components/TaskPool/TaskCard';
import TaskEditModal from '../components/TaskPool/TaskEditModal';
import TaskAssignModal from '../components/TaskPool/TaskAssignModal';
import TaskViewModal from '../components/TaskPool/TaskViewModal';

const TaskPool = () => {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Tab State
    const [activeTab, setActiveTab] = useState('pool');

    // Filter State
    const [regions, setRegions] = useState([]);
    const [selectedRegion, setSelectedRegion] = useState('Hepsi');

    // Modal States
    const [editingTask, setEditingTask] = useState(null);
    const [assigningTask, setAssigningTask] = useState(null);
    const [viewTask, setViewTask] = useState(null);

    useEffect(() => {
        fetchTasks();
        fetchUsers();
        fetchRegions();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/tasks');
            setTasks(res.data.filter(t => t.status !== 'completed'));
            setLoading(false);
        } catch (err) { console.error(err); setLoading(false); }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/auth/users');
            setUsers(res.data.filter(u => u.role === 'technician'));
        } catch (err) { console.error(err); }
    };

    const fetchRegions = async () => {
        try {
            const res = await api.get('/regions');
            setRegions(res.data.map(r => r.name));
        } catch (err) { console.error(err); }
    };

    import toast from 'react-hot-toast';

    // ... (imports)

    const TaskPool = () => {
        // ... (state)

        // ... (fetch functions)

        const handleDelete = async (id) => {
            if (!window.confirm('Bu görevi silmek istediğinize emin misiniz?')) return;
            try {
                await api.delete(`/tasks/${id}`);
                setTasks(tasks.filter(t => t.id !== id));
                toast.success('Görev silindi');
            } catch (err) { toast.error('Silme işlemi başarısız'); }
        };

        const handleVerify = async (taskId) => {
            if (!window.confirm('Onaylıyor musunuz?')) return;
            try {
                await api.put(`/tasks/${taskId}/verify`);
                fetchTasks();
                toast.success('Görev onaylandı');
            } catch (err) { toast.error('İşlem başarısız'); }
        };

        const handleWhatsAppShare = async (task) => {
            try {
                // ... (whatsapp logic)
                // ...
            } catch (err) { toast.error('WhatsApp paylaşımı sırasında hata oluştu'); }
        };

        const handleEditSave = async (id, formData, files) => {
            try {
                // ... (save logic)
                toast.success('Görev başarıyla güncellendi');
                setEditingTask(null);
                fetchTasks();
            } catch (err) { toast.error('Güncelleme sırasında hata oluştu'); }
        };

        const handleDeletePhoto = async (taskId, photoId) => {
            if (!confirm('Silmek istiyor musunuz?')) return;
            try {
                await api.delete(`/tasks/${taskId}/photos/${photoId}`);
                toast.success('Fotoğraf silindi');
            } catch (err) { toast.error('Hata oluştu'); }
        };

        const handleAssignSave = async (id, userIds) => {
            try {
                await api.put(`/tasks/${id}`, { assigned_to: userIds });
                toast.success('Personel ataması yapıldı');
                setAssigningTask(null);
                fetchTasks();
            } catch (err) { toast.error('Atama işlemi başarısız'); }
        };

        const handleViewOpen = async (task) => {
            try {
                const res = await api.get(`/tasks/${task.id}`);
                setViewTask(res.data);
            } catch (err) { toast.error('Görev detayları alınamadı'); }
        };

        const handleEditOpen = async (task) => {
            try {
                const res = await api.get(`/tasks/${task.id}`);
                setEditingTask(res.data);
            } catch (err) { toast.error('Görev bilgileri alınamadı'); }
        };


        // Filter Logic
        const filteredTasks = tasks.filter(task => {
            const hasAssignees = task.assigned_users && task.assigned_users.length > 0;
            if (activeTab === 'pool' && hasAssignees) return false;
            if (activeTab === 'active' && !hasAssignees) return false;
            if (selectedRegion === 'Hepsi') return true;
            const r = String(task.region || 'Diğer');
            return r.toLocaleLowerCase('tr-TR') === selectedRegion.toLocaleLowerCase('tr-TR');
        });

        // Daily Plan Groups
        const dailyPlanGroups = React.useMemo(() => {
            try {
                const groups = {};
                tasks.forEach(task => {
                    if (task && task.assigned_users && task.assigned_users.length > 0) {
                        const key = task.assigned_users
                            .map(u => u?.username || '?')
                            .sort()
                            .join('|');
                        if (!groups[key]) {
                            groups[key] = { users: task.assigned_users, tasks: [] };
                        }
                        groups[key].tasks.push(task);
                    }
                });
                return Object.values(groups);
            } catch (e) {
                console.error("Daily Plan error:", e);
                return [];
            }
        }, [tasks]);

        return (
            <div className="dashboard fade-in">
                {/* HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.8rem', background: 'linear-gradient(90deg, #e0e7ff, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>İş Yönetimi</h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#5a6d8a' }}>Servis takibi ve teknisyen atamaları</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button onClick={() => navigate('/admin/create-task')} className="glass-btn glass-btn-primary" style={{ padding: '10px 20px', fontWeight: '600' }}>
                            <Plus size={18} /> Yeni Görev
                        </button>
                        <button onClick={() => navigate('/admin/daily-report')} className="glass-btn" style={{ padding: '10px 20px', fontWeight: '600' }}>
                            <Activity size={18} /> Günlük Plan
                        </button>
                        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <button onClick={() => navigate('/admin/map')} className="icon-btn" title="Harita"><Map size={18} /></button>
                            <button onClick={() => navigate('/admin/archive')} className="icon-btn" title="Arşiv"><FolderArchive size={18} /></button>
                        </div>
                    </div>
                </div>

                {/* TABS & FILTERS */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <div className="tp-tabs">
                        <button onClick={() => setActiveTab('pool')} className={`tp-tab ${activeTab === 'pool' ? 'tp-tab--active' : ''}`}>
                            Havuz <span className="tp-tab-count">({tasks.filter(t => !t.assigned_users?.length).length})</span>
                        </button>
                        <button onClick={() => setActiveTab('active')} className={`tp-tab ${activeTab === 'active' ? 'tp-tab--active-blue' : ''}`}>
                            Saha <span className="tp-tab-count">({tasks.filter(t => t.assigned_users?.length > 0).length})</span>
                        </button>
                    </div>
                    <select className="glass-input" value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)} style={{ padding: '10px 16px', borderRadius: '12px', minWidth: '180px', width: 'auto' }}>
                        <option value="Hepsi">Tüm Bölgeler</option>
                        {regions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>

                {/* DAILY PLAN SUMMARY */}
                {activeTab === 'active' && (
                    <div className="tp-daily-plan">
                        <h3 style={{ fontSize: '1rem' }}><ClipboardList size={16} /> Günlük Plan (Atanan İşler)</h3>
                        <div className="tp-daily-grid">
                            {dailyPlanGroups.length === 0 ? (
                                <p style={{ color: '#555', fontStyle: 'italic', gridColumn: '1 / -1', fontSize: '0.82rem' }}>Henüz atama yapılmamış.</p>
                            ) : (
                                dailyPlanGroups.map((group, idx) => (
                                    <div key={idx} className="tp-daily-user">
                                        <div className="tp-daily-user-header">
                                            {group.users.map(u => (
                                                u && <div key={u.id} className="tp-initials" style={{ width: '24px', height: '24px', borderRadius: '50%', fontSize: '0.6rem', backgroundColor: stringToColor(u.username || '?') }}>{getInitials(u.username)}</div>
                                            ))}
                                            <span className="tp-daily-user-name">{group.users.map(u => u?.username).filter(Boolean).join(', ')}</span>
                                            <span className="tp-daily-user-count">{group.tasks.length}</span>
                                        </div>
                                        <ul className="tp-daily-task-list">
                                            {group.tasks.slice(0, 4).map(t => <li key={t.id}>{t.title}</li>)}
                                            {group.tasks.length > 4 && <li className="more">+ {group.tasks.length - 4} diğer</li>}
                                        </ul>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* TASK LIST */}
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner"></div></div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filteredTasks.length === 0 ? (
                            <div className="tp-empty">
                                <FolderArchive size={48} />
                                <p>Bu filtrede gösterilecek görev bulunamadı.</p>
                            </div>
                        ) : (
                            filteredTasks.map(task => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    isSahada={task.status === 'in_progress'}
                                    onAssign={(t) => setAssigningTask(t)}
                                    onEdit={(t) => handleEditOpen(t)}
                                    onView={(t) => handleViewOpen(t)}
                                    onDelete={handleDelete}
                                    onVerify={handleVerify}
                                    onWhatsApp={handleWhatsAppShare}
                                />
                            ))
                        )}
                    </div>
                )}

                {/* MODALS */}
                {editingTask && (
                    <TaskEditModal
                        task={editingTask}
                        regions={regions}
                        onDeletePhoto={handleDeletePhoto}
                        onSave={handleEditSave}
                        onClose={() => setEditingTask(null)}
                    />
                )}
                {assigningTask && (
                    <TaskAssignModal
                        task={assigningTask}
                        users={users}
                        onAssign={handleAssignSave}
                        onClose={() => setAssigningTask(null)}
                    />
                )}
                {viewTask && (
                    <TaskViewModal
                        task={viewTask}
                        onClose={() => setViewTask(null)}
                    />
                )}
            </div>
        );
    };

    // Safe Export
    import ErrorBoundary from '../components/ErrorBoundary';
    const SafeTaskPool = (props) => (
        <ErrorBoundary>
            <TaskPool {...props} />
        </ErrorBoundary>
    );

    export default SafeTaskPool;
