import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { Map, Activity, FolderArchive, Plus, FileBarChart, Calendar, Eye, UserPlus, Edit2, MessageCircle, MapPin } from 'lucide-react';
import '../styles/scrollbar.css';

const TaskPool = () => {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Tab State: 'pool' (Pending/Unassigned) vs 'active' (Assigned/In Progress)
    const [activeTab, setActiveTab] = useState('pool');

    // Modal States
    const [editingTask, setEditingTask] = useState(null); // For Edit & Assign
    const [viewTask, setViewTask] = useState(null); // For View Mode
    const [modalMode, setModalMode] = useState(null); // 'edit' or 'assign'

    const openViewModal = async (task) => {
        try {
            // Fetch full details including photos
            const res = await api.get(`/tasks/${task.id}`);
            setViewTask(res.data);
        } catch (err) {
            console.error(err);
            alert('Detaylar alınamadı');
        }
    };

    // Form Data
    const [editForm, setEditForm] = useState({ title: '', description: '', address: '', maps_link: '', region: 'Diğer', due_date: '' });
    const [editFiles, setEditFiles] = useState([]); // New state for edit files
    const [assignId, setAssignId] = useState('');

    const [selectedRegion, setSelectedRegion] = useState('Hepsi');
    // const regions = ... (Removed, fetched from API)

    useEffect(() => {
        fetchTasks();
        fetchUsers();
        fetchRegions();
    }, []);



    const fetchTasks = async () => {
        try {
            const res = await api.get('/tasks');
            // We fetch ALL tasks, excluding completed ones (they go to archive)
            // Filtering happens in render based on activeTab
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
        } catch (err) {
            console.error(err);
        }
    };

    // Region Management
    const [regions, setRegions] = useState([]);
    const [newRegion, setNewRegion] = useState('');

    const fetchRegions = async () => {
        try {
            const res = await api.get('/regions');
            setRegions(res.data.map(r => r.name)); // Simplify to strings for now to match structure
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddRegion = async () => {
        if (!newRegion.trim()) return;
        try {
            await api.post('/regions', { name: newRegion });
            setNewRegion('');
            fetchRegions();
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || err.message || 'Bölge eklenirken hata';
            alert(`Hata: ${msg}`);
        }
    };

    const handleDeleteRegion = async (regionName) => {
        if (!window.confirm(`${regionName} bölgesini silmek istediğinize emin misiniz?`)) return;
        try {
            // Need ID to delete. Re-fetch full objects if needed, but for MVP:
            // We need to store full objects in state, not just names.
            // Let's refactor state to store objects.
            // TEMPORARY FIX: We need to refactor fetchRegions first.
            const res = await api.get('/regions');
            const target = res.data.find(r => r.name === regionName);
            if (target) {
                await api.delete(`/regions/${target.id}`);
                fetchRegions();
            }
        } catch (err) {
            alert('Bölge silinemedi');
        }
    };



    const handleDelete = async (id) => {
        if (!window.confirm('Bu görevi silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/tasks/${id}`);
            setTasks(tasks.filter(t => t.id !== id));
        } catch (err) {
            alert('Silme işlemi başarısız');
        }
    };


    const handleVerify = async (taskId) => {
        if (!window.confirm('Bu görevi kontrol edildi olarak işaretlemek istiyor musunuz?')) return;
        try {
            await api.put(`/tasks/${taskId}/verify`);
            fetchTasks(); // Refresh list
        } catch (err) {
            console.error(err);
            alert('İşlem başarısız');
        }
    };

    const [existingPhotos, setExistingPhotos] = useState([]); // Photos from DB

    const openEditModal = async (task) => {
        // Set basic data first for immediate feedback
        setEditingTask(task);

        try {
            // Fetch Full Details (for photos & latest data)
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
            alert('Detaylar yüklenirken hata oluştu');
            setEditingTask(null);
        }
    };

    const handleDeletePhoto = async (photoId) => {
        if (!window.confirm('Fotoğrafı silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/tasks/${editingTask.id}/photos/${photoId}`);
            setExistingPhotos(existingPhotos.filter(p => p.id !== photoId));
        } catch (err) {
            alert('Fotoğraf silinemedi');
        }
    };

    // State for multiple assignment
    const [selectedAssignees, setSelectedAssignees] = useState([]);

    const openAssignModal = (task) => {
        setEditingTask(task);
        // Pre-select current users
        if (task.assigned_users && task.assigned_users.length > 0) {
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

    const handleWhatsAppShare = async (taskSummary) => {
        try {
            // Fetch full details to get photos
            const res = await api.get(`/tasks/${taskSummary.id}`);
            const task = res.data;

            let text = `*YENİ GÖREV (Servis)*\n\n` +
                `*Başlık:* ${task.title}\n` +
                `*Adres:* ${task.address}\n` +
                (task.region ? `*Bölge:* ${task.region}\n` : '') +
                (task.due_date ? `*Tarih:* ${new Date(task.due_date).toLocaleString('tr-TR')}\n` : '') +
                (task.description ? `*Açıklama:* ${task.description}\n` : '') +
                (task.maps_link ? `\n*Konum:* ${task.maps_link}` : '');

            if (task.photos && task.photos.length > 0) {
                text += `\n\n*Fotoğraflar:*`;
                task.photos.forEach((p, index) => {
                    text += `\n${index + 1}. ${p.url}`;
                });
            }

            const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        } catch (err) {
            console.error(err);
            alert('Detaylar alınırken hata oluştu, lütfen tekrar deneyin.');
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            // Fix Date Timezone: Convert local input string to proper ISO UTC string
            const payload = { ...editForm };
            if (payload.due_date) {
                payload.due_date = new Date(payload.due_date).toISOString();
            }

            await api.put(`/tasks/${editingTask.id}`, payload);
            // 2. Upload New Photos (Bulk)
            if (editFiles && editFiles.length > 0) {
                const fileData = new FormData();
                for (let i = 0; i < editFiles.length; i++) {
                    fileData.append('photos', editFiles[i]);
                }
                fileData.append('type', 'before');
                fileData.append('gps_lat', 0);
                fileData.append('gps_lng', 0);

                await api.post(`/tasks/${editingTask.id}/photos`, fileData, {
                    headers: { 'Content-Type': undefined }
                });
            }

            alert('Görev güncellendi');
            setEditingTask(null);
            fetchTasks(); // Refresh
        } catch (err) {
            alert('Güncelleme başarısız');
        }
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        try {
            // Send array of user IDs
            await api.put(`/tasks/${editingTask.id}`, { assigned_to: selectedAssignees });
            alert(activeTab === 'pool' ? 'Görev atandı' : 'Personel güncellendi');
            setEditingTask(null);
            fetchTasks();
        } catch (err) {
            alert('İşlem başarısız');
        }
    };

    // Filter Logic
    const filteredTasks = tasks.filter(task => {
        const hasAssignees = task.assigned_users && task.assigned_users.length > 0;

        // Tab Filter
        if (activeTab === 'pool') {
            // Pool: Unassigned only
            if (hasAssignees) return false;
        } else {
            // Active: Assigned only
            if (!hasAssignees) return false;
        }

        // Region Filter
        if (selectedRegion === 'Hepsi') return true;

        const region = task.region || 'Diğer';
        // Case-insensitive comparison with Turkish locale support
        return region.toLocaleLowerCase('tr-TR') === selectedRegion.toLocaleLowerCase('tr-TR');
    });

    return (
        <div className="dashboard">
            <button onClick={() => navigate('/admin')} className="glass-btn" style={{ marginBottom: '1rem' }}>&larr; Panela Dön</button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                <h2 style={{ margin: 0 }}>İş Yönetimi</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => navigate('/admin/daily-report')} className="glass-btn" style={{ background: 'rgba(255, 152, 0, 0.3)', border: '1px solid #ffa726' }}>
                        📋 GÜNLÜK PLAN
                    </button>
                    <button onClick={() => navigate('/admin/create-task')} className="glass-btn" style={{ background: 'rgba(76, 175, 80, 0.3)' }}>
                        <Plus size={18} style={{ marginRight: '5px' }} /> Yeni Görev
                    </button>
                </div>
            </div>

            {/* Main Tabs */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <button
                    onClick={() => setActiveTab('pool')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: activeTab === 'pool' ? '#64b5f6' : 'white',
                        borderBottom: activeTab === 'pool' ? '2px solid #64b5f6' : 'none',
                        padding: '10px 20px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                    }}
                >
                    Havuz (Bekleyenler)
                </button>
                <button
                    onClick={() => setActiveTab('active')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: activeTab === 'active' ? '#64b5f6' : 'white',
                        borderBottom: activeTab === 'active' ? '2px solid #64b5f6' : 'none',
                        padding: '10px 20px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                    }}
                >
                    Saha (Atanmış İşler)
                </button>

                {/* Region Management (Top Right) */}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <input
                        className="glass-input"
                        style={{ width: '150px', padding: '8px' }}
                        placeholder="Yeni Bölge Ekle..."
                        value={newRegion}
                        onChange={(e) => setNewRegion(e.target.value)}
                    />
                    <button onClick={handleAddRegion} className="glass-btn" style={{ padding: '8px 12px' }}>+</button>
                </div>
            </div>

            {loading ? <p>Yükleniyor...</p> : (
                /* KANBAN BOARD CONTAINER */
                <div className="custom-scroll" style={{
                    display: 'flex',
                    overflowX: 'auto',
                    paddingBottom: '20px',
                    gap: '15px',
                    height: 'calc(100vh - 160px)', // Optimized height
                    alignItems: 'flex-start'
                }}>
                    {/* Render a Column for EACH Region + 'Diğer' */}
                    {[...regions, 'Diğer'].map(regionName => {
                        // Filter tasks for this column
                        const regionTasks = tasks.filter(task => {
                            // 1. Tab Filter
                            const hasAssignees = task.assigned_users && task.assigned_users.length > 0;
                            if (activeTab === 'pool' && hasAssignees) return false;
                            if (activeTab === 'active' && !hasAssignees) return false;

                            // 2. Region Filter
                            const r = task.region || 'Diğer';
                            return r.toLocaleLowerCase('tr-TR') === regionName.toLocaleLowerCase('tr-TR');
                        });

                        // If 'active' tab and no tasks, maybe hide column?
                        // User wants "regions clicked -> tasks", if I show all empty columns it might be cluttered.
                        // But Kanban usually shows all. Let's show all for now.

                        // Define Column Theme based on Active Tab
                        const isPool = activeTab === 'pool';
                        const colBg = isPool ? 'rgba(255, 152, 0, 0.05)' : 'rgba(33, 150, 243, 0.05)';
                        const colBorder = isPool ? '1px solid rgba(255, 152, 0, 0.1)' : '1px solid rgba(33, 150, 243, 0.1)';
                        const headerColor = isPool ? '#ffb74d' : '#64b5f6';

                        return (
                            <div key={regionName} className="glass-panel" style={{
                                minWidth: '320px',
                                width: '320px',
                                display: 'flex',
                                flexDirection: 'column',
                                maxHeight: '100%',
                                background: colBg,
                                border: colBorder,
                                flexShrink: 0
                            }}>
                                {/* Column Header */}
                                <div style={{
                                    padding: '15px',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '1.1rem',
                                    color: headerColor
                                }}>
                                    <span>{regionName} <span style={{ opacity: 0.5, fontSize: '0.9rem' }}>({regionTasks.length})</span></span>
                                    {regionName !== 'Diğer' && (
                                        <button
                                            onClick={() => handleDeleteRegion(regionName)}
                                            style={{ background: 'transparent', border: 'none', color: '#ef5350', cursor: 'pointer', opacity: 0.5 }}
                                            title="Bölgeyi Sil"
                                        >
                                            &times;
                                        </button>
                                    )}
                                </div>

                                {/* Column Content (Scrollable List) */}
                                <div className="custom-scroll" style={{ padding: '10px', overflowY: 'auto', flex: 1 }}>
                                    {regionTasks.map(task => (
                                        <div key={task.id} className="glass-panel" style={{
                                            padding: '15px',
                                            marginBottom: '10px',
                                            // Standard Colors: Blue for In Progress, Amber/Orange for Pending
                                            borderLeft: task.status === 'in_progress' ? '4px solid #2196f3' : '4px solid #ffb300',
                                            background: 'rgba(255, 255, 255, 0.03)', // Reverted to standard lighter glass
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s',
                                            position: 'relative'
                                        }}
                                            onClick={() => openViewModal(task)}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            {/* Card Top: Title & Status */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'flex-start' }}>
                                                <h4 style={{ margin: 0, fontSize: '1rem', lineHeight: '1.4', flex: 1 }}>{task.title}</h4>
                                                {task.cancel_count > 0 && <span title={task.last_cancel_reason} style={{ fontSize: '0.8rem', color: '#ff9800' }}>⚠️</span>}
                                            </div>

                                            {/* Status Badge - Standard */}
                                            <div style={{ marginBottom: '8px' }}>
                                                <span style={{
                                                    background: task.status === 'in_progress' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(255, 179, 0, 0.2)',
                                                    color: task.status === 'in_progress' ? '#90caf9' : '#ffe082',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {task.status === 'in_progress' ? 'SAHADA' : 'BEKLİYOR'}
                                                </span>
                                            </div>

                                            {/* Card Middle: Address & Info */}
                                            <div style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '10px', display: 'flex', gap: '5px' }}>
                                                <MapPin size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                    {task.address}
                                                </span>
                                            </div>

                                            {/* Card Bottom: Date & Users */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', fontSize: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ccc' }}>
                                                    <Calendar size={14} />
                                                    {task.due_date ? new Date(task.due_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '-'}
                                                </div>

                                                {/* Action Icons Row */}
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <button className="icon-btn" onClick={(e) => { e.stopPropagation(); openEditModal(task); }} title="Düzenle" style={{ padding: '4px' }}>
                                                        <Edit2 size={14} color="#ffb74d" />
                                                    </button>
                                                    <button className="icon-btn" onClick={(e) => { e.stopPropagation(); openAssignModal(task); }} title="Ata" style={{ padding: '4px' }}>
                                                        <UserPlus size={14} color="#4fc3f7" />
                                                    </button>
                                                    <button className="icon-btn" onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }} title="Sil" style={{ padding: '4px' }}>
                                                        <span style={{ color: '#ef5350', fontSize: '14px', fontWeight: 'bold' }}>&times;</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Context Badge (Verified/Email) */}
                                            {task.source === 'email' && !task.verified_by && (
                                                <div style={{ position: 'absolute', top: '-5px', right: '-5px' }}>
                                                    <span className="blinking-badge" style={{ width: '8px', height: '8px', background: '#ff9800', borderRadius: '50%', display: 'block' }}></span>
                                                </div>
                                            )}

                                        </div>
                                    ))}
                                    {regionTasks.length === 0 && <div style={{ textAlign: 'center', opacity: 0.3, padding: '20px', fontStyle: 'italic', fontSize: '0.9rem' }}>Bu bölgede iş yok</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}


            {/* Modal Overlay */}
            {
                (editingTask || viewTask) && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div className="glass-panel" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', background: '#1e1e1e', position: 'relative' }}>
                            <button onClick={() => { setEditingTask(null); setViewTask(null); }} style={{ position: 'absolute', top: 10, right: 10, background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>

                            {/* VIEW MODE */}
                            {viewTask ? (
                                <div>
                                    <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>{viewTask.title}</h2>
                                    <p style={{ color: '#aaa', fontSize: '0.9rem' }}>{viewTask.address}</p>

                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                        <span style={{ background: 'rgba(255,255,255,0.1)', padding: '5px 10px', borderRadius: '5px' }}>
                                            Durum: {viewTask.status === 'in_progress' ? 'Sahada' : 'Bekliyor'}
                                        </span>
                                        {viewTask.due_date && <span style={{ background: 'rgba(255,255,255,0.1)', padding: '5px 10px', borderRadius: '5px' }}>📅 {new Date(viewTask.due_date).toLocaleString()}</span>}
                                    </div>

                                    <div style={{ marginTop: '20px', background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px' }}>
                                        <h4 style={{ marginTop: 0 }}>Açıklama:</h4>
                                        <p style={{ whiteSpace: 'pre-wrap' }}>{viewTask.description || 'Açıklama yok.'}</p>
                                    </div>

                                    {viewTask.maps_link && (
                                        <a href={viewTask.maps_link} target="_blank" rel="noopener noreferrer" className="glass-btn" style={{ display: 'inline-block', marginTop: '10px', background: 'rgba(33, 150, 243, 0.3)' }}>
                                            📍 Haritada Git
                                        </a>
                                    )}

                                    <h4 style={{ marginTop: '20px' }}>📸 Fotoğraflar ({viewTask.photos?.length || 0})</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', marginTop: '10px' }}>
                                        {viewTask.photos && viewTask.photos.map(photo => (
                                            <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer">
                                                <img src={photo.url} alt="Task" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '5px', border: '1px solid #555' }} />
                                            </a>
                                        ))}
                                        {(!viewTask.photos || viewTask.photos.length === 0) && <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>Fotoğraf yok.</p>}
                                    </div>
                                </div>
                            ) : (
                                /* EDIT & ASSIGN MODES */
                                <>
                                    <h3>{modalMode === 'edit' ? 'Görevi Düzenle' : (activeTab === 'pool' ? 'Personel Ata' : 'Personel Transfer Et')}</h3>

                                    {modalMode === 'edit' ? (
                                        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Başlık</label>
                                            <input
                                                className="glass-input"
                                                value={editForm.title}
                                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                required
                                            />
                                            <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Adres</label>
                                            <input
                                                className="glass-input"
                                                value={editForm.address}
                                                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                                required
                                            />

                                            <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Bölge</label>
                                            <select
                                                className="glass-input"
                                                value={editForm.region}
                                                onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
                                                style={{ background: '#333', color: 'white' }}
                                            >
                                                {regions.filter(r => r !== 'Hepsi').map(r => (
                                                    <option key={r} value={r}>{r}</option>
                                                ))}
                                            </select>

                                            <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Tarih ve Saat</label>
                                            <input
                                                type="datetime-local"
                                                className="glass-input"
                                                value={editForm.due_date}
                                                onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                                            />
                                            <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Harita Konum Linki</label>
                                            <input
                                                className="glass-input"
                                                placeholder="https://maps.google.com/..."
                                                value={editForm.maps_link || ''}
                                                onChange={(e) => setEditForm({ ...editForm, maps_link: e.target.value })}
                                            />

                                            <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Açıklama</label>
                                            <textarea
                                                className="glass-input"
                                                rows="4"
                                                value={editForm.description}
                                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            />

                                            <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Mevcut Fotoğraflar</label>
                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                                {existingPhotos.map(p => (
                                                    <div key={p.id} style={{ position: 'relative', width: '80px', height: '80px' }}>
                                                        <img src={p.url} alt="Task" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '5px', border: '1px solid #555' }} />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeletePhoto(p.id)}
                                                            style={{
                                                                position: 'absolute', top: -5, right: -5,
                                                                background: 'red', color: 'white',
                                                                border: 'none', borderRadius: '50%',
                                                                width: '20px', height: '20px',
                                                                cursor: 'pointer', fontSize: '12px',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                            }}>
                                                            &times;
                                                        </button>
                                                    </div>
                                                ))}
                                                {existingPhotos.length === 0 && <span style={{ opacity: 0.5, fontSize: '0.9rem' }}>Fotoğraf yok.</span>}
                                            </div>

                                            <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Yeni Fotoğraf Ekle</label>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                className="glass-input"
                                                onChange={(e) => setEditFiles(e.target.files)}
                                            />
                                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                                <button type="submit" className="glass-btn" style={{ flex: 1, background: 'rgba(76, 175, 80, 0.3)' }}>Kaydet</button>
                                                <button type="button" onClick={() => setEditingTask(null)} className="glass-btn" style={{ flex: 1, background: 'rgba(255, 0, 0, 0.3)' }}>İptal</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <p>"{editingTask.title}" görevi için personelleri seçiniz:</p>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                                                {users.map(u => (
                                                    <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedAssignees.includes(u.id)}
                                                            onChange={() => handleAssignCheckboxChange(u.id)}
                                                            style={{ transform: 'scale(1.2)' }}
                                                        />
                                                        {u.username}
                                                    </label>
                                                ))}
                                            </div>

                                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                                <button type="submit" className="glass-btn" style={{ flex: 1, background: 'rgba(33, 150, 243, 0.3)' }}>
                                                    {activeTab === 'pool' ? 'Seçilenleri Ata' : 'Güncelle'}
                                                </button>
                                                <button type="button" onClick={() => setEditingTask(null)} className="glass-btn" style={{ flex: 1, background: 'rgba(255, 0, 0, 0.3)' }}>İptal</button>
                                            </div>
                                        </form>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default TaskPool;
