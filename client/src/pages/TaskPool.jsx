import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import {
    Map,
    Activity,
    FolderArchive,
    Plus,
    FileBarChart,
    Calendar,
    Eye,
    UserPlus,
    Edit2,
    MessageCircle,
    MoreVertical,
    Trash2,
    CheckCircle,
    MapPin,
    Clock,
    AlertTriangle,
    ClipboardList
} from 'lucide-react';
import { getInitials, stringToColor } from '../utils/helpers'; // Assuming helpers exist from previous context

const TaskPool = () => {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Tab State
    const [activeTab, setActiveTab] = useState('pool');

    // Modal States
    const [editingTask, setEditingTask] = useState(null);
    const [viewTask, setViewTask] = useState(null);
    const [modalMode, setModalMode] = useState(null);
    const [menuOpenId, setMenuOpenId] = useState(null);

    // Form Data
    const [editForm, setEditForm] = useState({ title: '', description: '', address: '', maps_link: '', region: 'Diğer', due_date: '' });
    const [editFiles, setEditFiles] = useState([]);
    const [selectedRegion, setSelectedRegion] = useState('Hepsi');
    const [regions, setRegions] = useState([]);
    const [newRegion, setNewRegion] = useState('');
    const [selectedAssignees, setSelectedAssignees] = useState([]);
    const [existingPhotos, setExistingPhotos] = useState([]);

    useEffect(() => {
        fetchTasks();
        fetchUsers();
        fetchRegions();
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setMenuOpenId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/tasks');
            setTasks(res.data.filter(t => t.status !== 'completed'));
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
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

    const handleAddRegion = async () => { /* ... simplified ... */ }; // Keeping logic simple for brevity in rewrite if logic unchanged
    // Re-implementing logic fully to ensure no breaks
    const handleAddRegionFull = async () => {
        if (!newRegion.trim()) return;
        try {
            await api.post('/regions', { name: newRegion });
            setNewRegion('');
            fetchRegions();
        } catch (err) { console.error(err); alert('Hata'); }
    };

    const handleDeleteRegion = async (regionName) => {
        if (!window.confirm(`${regionName} bölgesini silmek istediğinize emin misiniz?`)) return;
        try {
            const res = await api.get('/regions');
            const target = res.data.find(r => r.name === regionName);
            if (target) {
                await api.delete(`/regions/${target.id}`);
                fetchRegions();
            }
        } catch (err) { alert('Bölge silinemedi'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu görevi silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/tasks/${id}`);
            setTasks(tasks.filter(t => t.id !== id));
        } catch (err) { alert('Silme başarısız'); }
    };

    const handleVerify = async (taskId) => {
        if (!window.confirm('Onaylıyor musunuz?')) return;
        try {
            await api.put(`/tasks/${taskId}/verify`);
            fetchTasks();
        } catch (err) { alert('İşlem başarısız'); }
    };

    const openEditModal = async (task) => {
        setEditingTask(task);
        setMenuOpenId(null);
        try {
            const res = await api.get(`/tasks/${task.id}`);
            const fullTask = res.data;
            let formattedDate = '';
            if (fullTask.due_date) {
                const d = new Date(fullTask.due_date);
                const localDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
                formattedDate = localDate.toISOString().slice(0, 16);
            }
            setEditForm({
                title: fullTask.title,
                description: fullTask.description || '',
                address: fullTask.address,
                maps_link: fullTask.maps_link || '',
                region: fullTask.region || 'Diğer',
                due_date: formattedDate
            });
            setExistingPhotos(fullTask.photos || []);
            setEditFiles([]);
            setModalMode('edit');
        } catch (err) {
            console.error(err);
            alert('Hata oluştu');
            setEditingTask(null);
        }
    };

    const handleDeletePhoto = async (photoId) => {
        if (!confirm('Silmek istiyor musunuz?')) return;
        try {
            await api.delete(`/tasks/${editingTask.id}/photos/${photoId}`);
            setExistingPhotos(existingPhotos.filter(p => p.id !== photoId));
        } catch (err) { alert('Hata'); }
    };

    const openAssignModal = (task) => {
        setEditingTask(task);
        setMenuOpenId(null);
        if (task.assigned_users?.length > 0) {
            setSelectedAssignees(task.assigned_users.map(u => u.id));
        } else {
            setSelectedAssignees([]);
        }
        setModalMode('assign');
    };

    const handleAssignCheckboxChange = (userId) => {
        if (selectedAssignees.includes(userId)) {
            setSelectedAssignees(selectedAssignees.filter(id => id !== userId));
        } else {
            setSelectedAssignees([...selectedAssignees, userId]);
        }
    };

    const handleWhatsAppShare = async (task) => {
        try {
            const res = await api.get(`/tasks/${task.id}`);
            const fullTask = res.data;
            let text = `*YENİ GÖREV (Servis)*\n\n` +
                `*Başlık:* ${fullTask.title}\n` +
                `*Adres:* ${fullTask.address}\n` +
                (fullTask.region ? `*Bölge:* ${fullTask.region}\n` : '') +
                (fullTask.due_date ? `*Tarih:* ${new Date(fullTask.due_date).toLocaleString('tr-TR')}\n` : '') +
                (fullTask.description ? `*Açıklama:* ${fullTask.description}\n` : '') +
                (fullTask.maps_link ? `\n*Konum:* ${fullTask.maps_link}` : '');

            if (fullTask.photos && fullTask.photos.length > 0) {
                text += `\n\n*Fotoğraflar:*`;
                fullTask.photos.forEach((p, index) => {
                    text += `\n${index + 1}. ${p.url}`;
                });
            }
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        } catch (err) { alert('Hata'); }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...editForm };
            if (payload.due_date) payload.due_date = new Date(payload.due_date).toISOString();
            await api.put(`/tasks/${editingTask.id}`, payload);

            if (editFiles.length > 0) {
                const fileData = new FormData();
                for (let i = 0; i < editFiles.length; i++) fileData.append('photos', editFiles[i]);
                fileData.append('type', 'before');
                fileData.append('gps_lat', 0);
                fileData.append('gps_lng', 0);
                await api.post(`/tasks/${editingTask.id}/photos`, fileData, { headers: { 'Content-Type': undefined } });
            }
            alert('Güncellendi');
            setEditingTask(null);
            fetchTasks();
        } catch (err) { alert('Hata'); }
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/tasks/${editingTask.id}`, { assigned_to: selectedAssignees });
            alert('Atama yapıldı');
            setEditingTask(null);
            fetchTasks();
        } catch (err) { alert('Hata'); }
    };

    const openViewModal = async (task) => {
        try {
            const res = await api.get(`/tasks/${task.id}`);
            setViewTask(res.data);
            setMenuOpenId(null);
        } catch (err) { alert('Hata'); }
    };

    const filteredTasks = tasks.filter(task => {
        const hasAssignees = task.assigned_users && task.assigned_users.length > 0;
        if (activeTab === 'pool' && hasAssignees) return false;
        if (activeTab === 'active' && !hasAssignees) return false;
        if (selectedRegion === 'Hepsi') return true;
        const r = String(task.region || 'Diğer');
        return r.toLocaleLowerCase('tr-TR') === selectedRegion.toLocaleLowerCase('tr-TR');
    });

    // Daily Plan: group by same personnel combination
    const dailyPlanGroups = React.useMemo(() => {
        try {
            const groups = {};
            tasks.forEach(task => {
                if (task && task.assigned_users && task.assigned_users.length > 0) {
                    // Create a key from sorted usernames
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
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <button onClick={() => navigate('/admin')} className="glass-btn" style={{ borderRadius: '12px', padding: '10px 14px' }}>&larr;</button>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.8rem', background: 'linear-gradient(90deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>İş Yönetimi</h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Servis takibi ve teknisyen atamaları</p>
                    </div>
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

            {/* TAB & FILTER BAR */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div className="tp-tabs">
                    <button
                        onClick={() => setActiveTab('pool')}
                        className={`tp-tab ${activeTab === 'pool' ? 'tp-tab--active' : ''}`}
                    >
                        Havuz <span className="tp-tab-count">({tasks.filter(t => !t.assigned_users?.length).length})</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`tp-tab ${activeTab === 'active' ? 'tp-tab--active-blue' : ''}`}
                    >
                        Saha <span className="tp-tab-count">({tasks.filter(t => t.assigned_users?.length > 0).length})</span>
                    </button>
                </div>

                <select
                    className="glass-input"
                    value={selectedRegion}
                    onChange={e => setSelectedRegion(e.target.value)}
                    style={{ padding: '10px 16px', borderRadius: '12px', minWidth: '180px', width: 'auto' }}
                >
                    <option value="Hepsi">Tüm Bölgeler</option>
                    {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>

            {activeTab === 'active' && (
                <div className="tp-daily-plan">
                    <h3>
                        <ClipboardList size={15} /> Günlük Plan (Atanan İşler)
                    </h3>
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
                                        <span className="tp-daily-user-name">
                                            {group.users.map(u => u?.username).filter(Boolean).join(', ')}
                                        </span>
                                        <span className="tp-daily-user-count">{group.tasks.length}</span>
                                    </div>
                                    <ul className="tp-daily-task-list">
                                        {group.tasks.slice(0, 4).map(t => (
                                            <li key={t.id}>{t.title}</li>
                                        ))}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filteredTasks.length === 0 ? (
                        <div className="tp-empty">
                            <FolderArchive size={48} />
                            <p>Bu filtrede gösterilecek görev bulunamadı.</p>
                        </div>
                    ) : (
                        filteredTasks.map(task => {
                            const isSahada = task.status === 'in_progress';
                            const cardClass = `tp-card ${isSahada ? 'tp-card--active' : 'tp-card--waiting'}`;

                            return (
                                <div key={task.id} className={cardClass} style={{ zIndex: menuOpenId === task.id ? 100 : 1 }}>
                                    {/* LEFT CONTENT */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                                            <span className={`tp-status ${isSahada ? 'tp-status--active' : 'tp-status--waiting'}`}>
                                                {isSahada ? 'SAHADA' : 'BEKLİYOR'}
                                            </span>

                                            {task.region && (
                                                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                    <MapPin size={11} /> {task.region}
                                                </span>
                                            )}
                                        </div>

                                        <h3 style={{ margin: '0 0 3px 0', fontSize: '1rem', fontWeight: '700', color: '#f1f5f9', letterSpacing: '-0.3px', background: 'none', WebkitBackgroundClip: 'unset', WebkitTextFillColor: 'unset' }}>
                                            {task.title}
                                        </h3>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8', fontSize: '0.82rem' }}>
                                            <MapPin size={12} color="#475569" />
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.address}</span>
                                        </div>

                                        {task.source === 'email' && !task.verified_by && (
                                            <div style={{ marginTop: '6px' }}>
                                                <span className="tp-verify-badge">
                                                    <AlertTriangle size={13} /> KONTROL BEKLİYOR
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* RIGHT SIDE: Assignees + Date + Actions */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                                            {task.assigned_users && task.assigned_users.length > 0 ? (
                                                <div className="tp-avatar-stack" title={task.assigned_users.map(u => u?.username).join(', ')}>
                                                    {task.assigned_users.map(u => {
                                                        if (!u) return null;
                                                        return u.photo_url ?
                                                            <img key={u.id} src={u.photo_url} alt={u.username} /> :
                                                            <div key={u.id} className="tp-initials" style={{ backgroundColor: stringToColor(u.username || '?') }}>{getInitials(u.username)}</div>;
                                                    })}
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '0.82rem', color: '#475569', fontStyle: 'italic' }}>Atama Yok</span>
                                            )}

                                            {task.due_date && (
                                                <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={13} /> {new Date(task.due_date).toLocaleDateString('tr-TR')}
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative', flexShrink: 0 }}>
                                            <button
                                                className="tp-action-btn tp-action-btn--whatsapp"
                                                onClick={(e) => { e.stopPropagation(); handleWhatsAppShare(task); }}
                                                title="WhatsApp"
                                            >
                                                <MessageCircle size={16} strokeWidth={2.5} />
                                            </button>

                                            <button
                                                className="tp-action-btn tp-action-btn--assign"
                                                onClick={(e) => { e.stopPropagation(); openAssignModal(task); }}
                                                title="Personel Ata"
                                            >
                                                <UserPlus size={16} strokeWidth={2.5} />
                                            </button>

                                            <div style={{ position: 'relative' }}>
                                                <button
                                                    className="tp-action-btn tp-action-btn--menu"
                                                    onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === task.id ? null : task.id); }}
                                                >
                                                    <MoreVertical size={16} />
                                                </button>

                                                {menuOpenId === task.id && (
                                                    <div className="tp-dropdown">
                                                        <button onClick={() => openViewModal(task)}>
                                                            <Eye size={15} /> Görüntüle
                                                        </button>
                                                        <button onClick={() => openEditModal(task)}>
                                                            <Edit2 size={15} /> Düzenle
                                                        </button>
                                                        {task.source === 'email' && !task.verified_by && (
                                                            <button className="success" onClick={() => handleVerify(task.id)}>
                                                                <CheckCircle size={15} /> Onayla
                                                            </button>
                                                        )}
                                                        <button className="danger" onClick={() => handleDelete(task.id)}>
                                                            <Trash2 size={15} /> Sil
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* MODAL */}
            {(editingTask || viewTask) && (
                <div className="modal-overlay" onClick={() => { setEditingTask(null); setViewTask(null); }}>
                    <div className="glass-panel modal-content" onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(180deg, #1e1e2e, #151520)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <button onClick={() => { setEditingTask(null); setViewTask(null); }} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#94a3b8', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', transition: 'all 0.2s' }}>&times;</button>

                        {viewTask ? (
                            <div>
                                <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px', marginBottom: '20px', fontSize: '1.4rem' }}>{viewTask.title}</h2>
                                <p style={{ color: '#94a3b8', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={16} /> {viewTask.address}</p>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                                    <span className={`tp-status ${viewTask.status === 'in_progress' ? 'tp-status--active' : 'tp-status--waiting'}`}>
                                        {viewTask.status === 'in_progress' ? 'SAHADA' : 'BEKLİYOR'}
                                    </span>
                                </div>
                                <div style={{ marginTop: '24px', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h4 style={{ marginTop: 0, color: '#cbd5e1', fontSize: '0.95rem' }}>Açıklama</h4>
                                    <p style={{ whiteSpace: 'pre-wrap', color: '#94a3b8', lineHeight: '1.7' }}>{viewTask.description || 'Açıklama yok.'}</p>
                                </div>
                                {viewTask.maps_link && <a href={viewTask.maps_link} target="_blank" rel="noopener noreferrer" className="glass-btn glass-btn-primary" style={{ marginTop: '20px', padding: '10px 20px' }}><MapPin size={16} /> Haritada Git</a>}
                                <h4 style={{ marginTop: '28px', color: '#cbd5e1' }}>📸 Fotoğraflar ({viewTask.photos?.length || 0})</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', marginTop: '12px' }}>
                                    {viewTask.photos && viewTask.photos.map(photo => (
                                        <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer">
                                            <img src={photo.url} alt="Task" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }} />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                <h3 style={{ marginBottom: '20px', fontSize: '1.3rem' }}>{modalMode === 'edit' ? 'Görevi Düzenle' : 'Personel Yönetimi'}</h3>
                                {modalMode === 'edit' ? (
                                    <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        <input className="glass-input" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required placeholder="Başlık" />
                                        <input className="glass-input" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} required placeholder="Adres" />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                            <select className="glass-input" value={editForm.region} onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}>{regions.filter(r => r !== 'Hepsi').map(r => <option key={r} value={r}>{r}</option>)}</select>
                                            <input type="datetime-local" className="glass-input" value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} />
                                        </div>
                                        <textarea className="glass-input" rows="4" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Açıklama" />
                                        <label style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Mevcut Fotoğraflar</label>
                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                            {existingPhotos.map(p => (
                                                <div key={p.id} style={{ position: 'relative', width: '64px', height: '64px' }}>
                                                    <img src={p.url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
                                                    <button type="button" onClick={() => handleDeletePhoto(p.id)} style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '11px', border: '2px solid #1e1e2e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '14px', border: '1px dashed rgba(255,255,255,0.15)' }}>
                                            <p style={{ margin: '0 0 10px 0', fontSize: '0.88rem', color: '#64748b' }}>Yeni Fotoğraf Ekle</p>
                                            <input type="file" multiple accept="image/*" className="glass-input" onChange={(e) => setEditFiles(e.target.files)} />
                                        </div>
                                        <button type="submit" className="glass-btn glass-btn-primary" style={{ padding: '14px', fontWeight: '600', marginTop: '6px' }}>Değişiklikleri Kaydet</button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        <p style={{ color: '#94a3b8', margin: '0 0 4px 0' }}>Görevlendirilecek personelleri seçiniz:</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                                            {users.map(u => (
                                                <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 14px', background: selectedAssignees.includes(u.id) ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255,255,255,0.02)', borderRadius: '12px', cursor: 'pointer', border: selectedAssignees.includes(u.id) ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s' }}>
                                                    <input type="checkbox" checked={selectedAssignees.includes(u.id)} onChange={() => handleAssignCheckboxChange(u.id)} style={{ transform: 'scale(1.2)', accentColor: 'var(--primary)' }} />
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {u.photo_url ? <img src={u.photo_url} style={{ width: '34px', height: '34px', borderRadius: '50%' }} /> : <div className="tp-initials" style={{ width: '34px', height: '34px', borderRadius: '50%', background: stringToColor(u.username) }}>{getInitials(u.username)}</div>}
                                                        <span style={{ fontWeight: selectedAssignees.includes(u.id) ? '600' : '400', color: selectedAssignees.includes(u.id) ? '#fff' : '#94a3b8' }}>{u.username}</span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                        <button type="submit" className="glass-btn glass-btn-primary" style={{ padding: '14px', fontWeight: '600', marginTop: '8px' }}>Atamayı Tamamla</button>
                                    </form>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

import ErrorBoundary from '../components/ErrorBoundary';

const SafeTaskPool = (props) => (
    <ErrorBoundary>
        <TaskPool {...props} />
    </ErrorBoundary>
);

export default SafeTaskPool;
