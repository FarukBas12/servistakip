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
    CheckCircle
} from 'lucide-react';

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
    const [menuOpenId, setMenuOpenId] = useState(null); // For Dropdown Menu

    const openViewModal = async (task) => {
        try {
            const res = await api.get(`/tasks/${task.id}`);
            setViewTask(res.data);
            setMenuOpenId(null);
        } catch (err) {
            console.error(err);
            alert('Detaylar alınamadı');
        }
    };

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
        } catch (err) {
            console.error(err);
        }
    };

    const fetchRegions = async () => {
        try {
            const res = await api.get('/regions');
            setRegions(res.data.map(r => r.name));
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
            alert('Hata oluştu');
        }
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
            fetchTasks();
        } catch (err) {
            console.error(err);
            alert('İşlem başarısız');
        }
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

    const openAssignModal = (task) => {
        setEditingTask(task);
        setMenuOpenId(null);
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
            const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        } catch (err) {
            alert('Detaylar alınırken hata oluştu');
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...editForm };
            if (payload.due_date) {
                payload.due_date = new Date(payload.due_date).toISOString();
            }
            await api.put(`/tasks/${editingTask.id}`, payload);
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
            fetchTasks();
        } catch (err) {
            alert('Güncelleme başarısız');
        }
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/tasks/${editingTask.id}`, { assigned_to: selectedAssignees });
            alert(activeTab === 'pool' ? 'Görev atandı' : 'Personel güncellendi');
            setEditingTask(null);
            fetchTasks();
        } catch (err) {
            alert('İşlem başarısız');
        }
    };

    const filteredTasks = tasks.filter(task => {
        const hasAssignees = task.assigned_users && task.assigned_users.length > 0;
        if (activeTab === 'pool') {
            if (hasAssignees) return false;
        } else {
            if (!hasAssignees) return false;
        }
        if (selectedRegion === 'Hepsi') return true;
        const region = task.region || 'Diğer';
        return region.toLocaleLowerCase('tr-TR') === selectedRegion.toLocaleLowerCase('tr-TR');
    });

    return (
        <div className="dashboard">
            {/* HEADER - SIMPLIFIED */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button onClick={() => navigate('/admin')} className="glass-btn">&larr;</button>
                    <h2 style={{ margin: 0 }}>İş Yönetimi</h2>
                </div>

                {/* Unified Tools Menu (Potential Future: Dropdown) */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => navigate('/admin/create-task')} className="glass-btn" style={{ background: 'rgba(76, 175, 80, 0.3)', fontWeight: 'bold' }}>
                        <Plus size={18} style={{ marginRight: '5px' }} /> Yeni Görev
                    </button>
                    <button onClick={() => navigate('/admin/daily')} className="glass-btn" title="Günlük Takip"><Activity size={18} /></button>
                    <button onClick={() => navigate('/admin/map')} className="glass-btn" title="Harita"><Map size={18} /></button>
                    <button onClick={() => navigate('/admin/archive')} className="glass-btn" title="Arşiv"><FolderArchive size={18} /></button>
                </div>
            </div>

            {/* TAB MENU */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <button onClick={() => setActiveTab('pool')} style={{ background: 'transparent', border: 'none', color: activeTab === 'pool' ? '#64b5f6' : 'white', borderBottom: activeTab === 'pool' ? '2px solid #64b5f6' : 'none', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Havuz ({tasks.filter(t => !t.assigned_users || t.assigned_users.length === 0).length})
                </button>
                <button onClick={() => setActiveTab('active')} style={{ background: 'transparent', border: 'none', color: activeTab === 'active' ? '#64b5f6' : 'white', borderBottom: activeTab === 'active' ? '2px solid #64b5f6' : 'none', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Saha ({tasks.filter(t => t.assigned_users && t.assigned_users.length > 0).length})
                </button>
            </div>

            {/* COMPACT REGION FILTER */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                <span style={{ color: '#888', fontSize: '0.9rem' }}>Bölge Filtrele:</span>
                <select
                    className="glass-input"
                    value={selectedRegion}
                    onChange={e => setSelectedRegion(e.target.value)}
                    style={{ padding: '5px 10px', width: 'auto', minWidth: '150px' }}
                >
                    <option value="Hepsi">Tüm Bölgeler</option>
                    {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>

                {selectedRegion !== 'Hepsi' && (
                    <button onClick={() => setSelectedRegion('Hepsi')} style={{ background: 'none', border: 'none', color: '#ef5350', cursor: 'pointer' }}>Temizle</button>
                )}
            </div>

            {loading ? <p>Yükleniyor...</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filteredTasks.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Bu kategoride aktif görev bulunmuyor.</div> : filteredTasks.map(task => (
                        <div key={task.id} className="glass-panel" style={{
                            padding: '15px',
                            position: 'relative',
                            borderLeft: task.status === 'in_progress' ? '4px solid #2196f3' : '4px solid #ffb300',
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '15px',
                            zIndex: menuOpenId === task.id ? 100 : 1 // Fix for dropdown stacking
                        }}>
                            {/* CENTER: Title & Address */}
                            <div style={{ flex: 1, minWidth: '250px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>{task.title}</h3>
                                    {task.region && <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#ccc' }}>{task.region}</span>}
                                </div>
                                <p style={{ margin: 0, opacity: 0.7, fontSize: '0.9rem', color: '#ccc' }}>{task.address}</p>

                                {task.source === 'email' && !task.verified_by && (
                                    <div style={{ marginTop: '5px' }}>
                                        <span className="blinking-badge" style={{ background: '#ff9800', color: 'black', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>⚠️ KONTROL BEKLİYOR</span>
                                    </div>
                                )}
                            </div>

                            {/* RIGHT: Actions */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {/* ASSIGNEES (If Active) */}
                                {activeTab === 'active' && task.assigned_users && (
                                    <div style={{ fontSize: '0.8rem', marginRight: '10px', color: '#90caf9', fontWeight: '500' }}>
                                        {task.assigned_users.map(u => u.username).join(', ')}
                                    </div>
                                )}

                                {/* PRIMARY ACTIONS */}
                                <button className="glass-btn" onClick={() => handleWhatsAppShare(task)} style={{ padding: '8px', color: '#25D366', background: 'rgba(37, 211, 102, 0.1)' }} title="WhatsApp">
                                    <MessageCircle size={20} />
                                </button>

                                <button className="glass-btn" onClick={() => openAssignModal(task)} style={{ padding: '8px', color: '#4fc3f7', background: 'rgba(79, 195, 247, 0.1)' }} title="Personel Ata">
                                    <UserPlus size={20} />
                                </button>

                                {/* MORE MENU (Dropdown) */}
                                <div style={{ position: 'relative' }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === task.id ? null : task.id); }}
                                        className="glass-btn"
                                        style={{ padding: '8px', color: '#ccc' }}
                                    >
                                        <MoreVertical size={20} />
                                    </button>

                                    {menuOpenId === task.id && (
                                        <div style={{
                                            position: 'absolute', top: '100%', right: 0, zIndex: 10,
                                            background: '#333', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                                            display: 'flex', flexDirection: 'column', minWidth: '150px', boxShadow: '0 5px 15px rgba(0,0,0,0.5)'
                                        }}>
                                            <button onClick={() => openViewModal(task)} style={{ padding: '10px', textAlign: 'left', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <Eye size={16} /> Görüntüle
                                            </button>
                                            <button onClick={() => openEditModal(task)} style={{ padding: '10px', textAlign: 'left', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <Edit2 size={16} /> Düzenle
                                            </button>
                                            {task.source === 'email' && !task.verified_by && (
                                                <button onClick={() => handleVerify(task.id)} style={{ padding: '10px', textAlign: 'left', background: 'transparent', border: 'none', color: '#81c784', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <CheckCircle size={16} /> Onayla
                                                </button>
                                            )}
                                            <button onClick={() => handleDelete(task.id)} style={{ padding: '10px', textAlign: 'left', background: 'transparent', border: 'none', color: '#ef5350', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Trash2 size={16} /> Sil
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL - SAME AS BEFORE, JUST VISIBLE */}
            {(editingTask || viewTask) && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', background: '#1e1e1e', position: 'relative' }}>
                        <button onClick={() => { setEditingTask(null); setViewTask(null); }} style={{ position: 'absolute', top: 10, right: 10, background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>

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
                                {viewTask.maps_link && <a href={viewTask.maps_link} target="_blank" rel="noopener noreferrer" className="glass-btn" style={{ display: 'inline-block', marginTop: '10px', background: 'rgba(33, 150, 243, 0.3)' }}>📍 Haritada Git</a>}
                                {viewTask.last_editor && <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>Son düzenleyen: {viewTask.last_editor}</div>}
                                <h4 style={{ marginTop: '20px' }}>📸 Fotoğraflar ({viewTask.photos?.length || 0})</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', marginTop: '10px' }}>
                                    {viewTask.photos && viewTask.photos.map(photo => (
                                        <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer">
                                            <img src={photo.url} alt="Task" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '5px', border: '1px solid #555' }} />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                <h3>{modalMode === 'edit' ? 'Görevi Düzenle' : 'Personel Yönetimi'}</h3>
                                {modalMode === 'edit' ? (
                                    <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        <input className="glass-input" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required placeholder="Başlık" />
                                        <input className="glass-input" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} required placeholder="Adres" />
                                        <select className="glass-input" value={editForm.region} onChange={(e) => setEditForm({ ...editForm, region: e.target.value })} style={{ background: '#333', color: 'white' }}>{regions.filter(r => r !== 'Hepsi').map(r => <option key={r} value={r}>{r}</option>)}</select>
                                        <input type="datetime-local" className="glass-input" value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} />
                                        <textarea className="glass-input" rows="4" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Açıklama" />
                                        <label>Fotoğraflar</label>
                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                            {existingPhotos.map(p => (
                                                <div key={p.id} style={{ position: 'relative', width: '60px', height: '60px' }}>
                                                    <img src={p.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <button type="button" onClick={() => handleDeletePhoto(p.id)} style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: '15px', height: '15px', fontSize: '10px', border: 'none', cursor: 'pointer' }}>x</button>
                                                </div>
                                            ))}
                                        </div>
                                        <input type="file" multiple accept="image/*" className="glass-input" onChange={(e) => setEditFiles(e.target.files)} />
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}><button type="submit" className="glass-btn" style={{ flex: 1, background: '#4CAF50' }}>Kaydet</button></div>
                                    </form>
                                ) : (
                                    <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        <p>Personel Seçimi:</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                                            {users.map(u => (
                                                <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={selectedAssignees.includes(u.id)} onChange={() => handleAssignCheckboxChange(u.id)} />
                                                    {u.username}
                                                </label>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}><button type="submit" className="glass-btn" style={{ flex: 1, background: '#2196F3' }}>Kaydet</button></div>
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

export default TaskPool;
