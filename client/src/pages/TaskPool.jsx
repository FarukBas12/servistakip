import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const TaskPool = () => {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Tab State: 'pool' (Pending/Unassigned) vs 'active' (Assigned/In Progress)
    const [activeTab, setActiveTab] = useState('pool');

    // Modal States
    const [editingTask, setEditingTask] = useState(null); // For Edit & Assign
    const [modalMode, setModalMode] = useState(null); // 'edit' or 'assign'

    // Form Data
    const [editForm, setEditForm] = useState({ title: '', description: '', address: '', due_date: '' });
    const [assignId, setAssignId] = useState('');

    const [selectedRegion, setSelectedRegion] = useState('Hepsi');
    const regions = ['Hepsi', 'Kemalpaşa', 'Manisa', 'Güzelbahçe', 'Torbalı', 'Menemen', 'Diğer'];

    useEffect(() => {
        fetchTasks();
        fetchUsers();
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

    const handleDelete = async (id) => {
        if (!window.confirm('Bu görevi silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/tasks/${id}`);
            setTasks(tasks.filter(t => t.id !== id));
        } catch (err) {
            alert('Silme işlemi başarısız');
        }
    };

    const openEditModal = (task) => {
        setEditingTask(task);
        setEditForm({
            title: task.title,
            description: task.description || '',
            address: task.address,
            // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
            due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : ''
        });
        setModalMode('edit');
    };

    const openAssignModal = (task) => {
        setEditingTask(task);
        // Pre-select current user if re-assigning
        setAssignId(task.assigned_to || '');
        setModalMode('assign');
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/tasks/${editingTask.id}`, editForm);
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
            await api.put(`/tasks/${editingTask.id}`, { assigned_to: assignId });
            alert(activeTab === 'pool' ? 'Görev atandı' : 'Personel değiştirildi');
            setEditingTask(null);
            fetchTasks();
        } catch (err) {
            alert('İşlem başarısız');
        }
    };

    // Filter Logic
    const filteredTasks = tasks.filter(task => {
        // Tab Filter
        if (activeTab === 'pool') {
            // Pool: Unassigned only
            if (task.assigned_to) return false;
        } else {
            // Active: Assigned only
            if (!task.assigned_to) return false;
        }

        // Region Filter
        if (selectedRegion === 'Hepsi') return true;
        const region = task.region || 'Diğer';
        return region === selectedRegion;
    });

    return (
        <div className="dashboard">
            <button onClick={() => navigate('/admin')} className="glass-btn" style={{ marginBottom: '1rem' }}>&larr; Panela Dön</button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>İş Yönetimi</h2>
                <button onClick={() => navigate('/admin/create-task')} className="glass-btn" style={{ background: 'rgba(76, 175, 80, 0.3)' }}>+ Yeni Görev</button>
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
            </div>

            {/* Region Tabs */}
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '20px' }}>
                {regions.map(region => (
                    <button
                        key={region}
                        onClick={() => setSelectedRegion(region)}
                        className="glass-btn"
                        style={{
                            background: selectedRegion === region ? 'rgba(33, 150, 243, 0.5)' : 'rgba(255, 255, 255, 0.05)',
                            border: selectedRegion === region ? '1px solid #64b5f6' : '1px solid rgba(255,255,255,0.1)',
                            minWidth: '100px'
                        }}
                    >
                        {region}
                    </button>
                ))}
            </div>

            {loading ? <p>Yükleniyor...</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {filteredTasks.length === 0 ? <p style={{ opacity: 0.7 }}>Bu kategoride iş yok.</p> : filteredTasks.map(task => (
                        <div key={task.id} className="glass-panel" style={{
                            padding: '20px',
                            position: 'relative',
                            borderLeft: task.status === 'in_progress' ? '5px solid #2196f3' : '5px solid #ffb300'
                        }}>
                            {/* CANCELLED WARNING BANNER */}
                            {task.cancel_count > 0 && (
                                <div style={{
                                    background: 'rgba(255, 193, 7, 0.9)',
                                    color: '#000',
                                    padding: '5px 10px',
                                    borderRadius: '5px',
                                    marginBottom: '10px',
                                    fontWeight: 'bold',
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}>
                                    ⚠️ {task.cancel_count} kez iade!
                                    <span style={{ fontWeight: 'normal', opacity: 0.8, fontSize: '0.8rem', marginLeft: 'auto' }}>
                                        Son: {task.last_cancel_reason?.substring(0, 10)}...
                                    </span>
                                </div>
                            )}

                            <div style={{ position: 'absolute', top: 15, right: 15, display: 'flex', gap: '5px' }}>
                                <button onClick={() => handleDelete(task.id)} style={{ background: 'rgba(244, 67, 54, 0.3)', border: '1px solid rgba(255,0,0,0.3)', color: 'white', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Sil</button>
                            </div>

                            <span style={{
                                background: task.status === 'in_progress' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(255, 193, 7, 0.2)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                color: 'white',
                                marginBottom: '5px',
                                display: 'inline-block'
                            }}>
                                {task.status === 'in_progress' ? 'SAHADA / DEVAM EDİYOR' : 'BEKLİYOR'}
                            </span>

                            <h3 style={{ marginTop: 5, paddingRight: '50px' }}>{task.title}</h3>
                            <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>{task.address}</p>

                            {activeTab === 'active' && (
                                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '5px', marginBottom: '10px' }}>
                                    👤 <strong>{task.assigned_user}</strong> üzerinde
                                </div>
                            )}

                            {task.description && <p style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '5px' }}>{task.description}</p>}

                            {task.due_date && <div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '10px' }}>📅 {new Date(task.due_date).toLocaleString()}</div>}

                            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                                <button onClick={() => openAssignModal(task)} className="glass-btn" style={{ flex: 1, background: 'rgba(33, 150, 243, 0.3)' }}>
                                    {activeTab === 'pool' ? '👤 Personele Ata' : '🔄 Personel Değiştir'}
                                </button>
                                <button onClick={() => openEditModal(task)} className="glass-btn" style={{ flex: 1, background: 'rgba(255, 193, 7, 0.3)' }}>
                                    ✏️ Düzenle
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Overlay */}
            {editingTask && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '500px', padding: '30px', background: '#1e1e1e' }}>
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
                                <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Tarih ve Saat</label>
                                <input
                                    type="datetime-local"
                                    className="glass-input"
                                    value={editForm.due_date}
                                    onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                                />
                                <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Açıklama</label>
                                <textarea
                                    className="glass-input"
                                    rows="4"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                />
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button type="submit" className="glass-btn" style={{ flex: 1, background: 'rgba(76, 175, 80, 0.3)' }}>Kaydet</button>
                                    <button type="button" onClick={() => setEditingTask(null)} className="glass-btn" style={{ flex: 1, background: 'rgba(255, 0, 0, 0.3)' }}>İptal</button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <p>"{editingTask.title}" görevi için işlem yapıyorsunuz:</p>
                                <select
                                    className="glass-input"
                                    value={assignId}
                                    onChange={(e) => setAssignId(e.target.value)}
                                    required
                                    style={{ color: 'white' }}
                                >
                                    <option value="" style={{ color: 'black' }}>-- Seçiniz --</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id} style={{ color: 'black' }}>{u.username}</option>
                                    ))}
                                </select>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button type="submit" className="glass-btn" style={{ flex: 1, background: 'rgba(33, 150, 243, 0.3)' }}>
                                        {activeTab === 'pool' ? 'Atamayı Yap' : 'Transfer Et'}
                                    </button>
                                    <button type="button" onClick={() => setEditingTask(null)} className="glass-btn" style={{ flex: 1, background: 'rgba(255, 0, 0, 0.3)' }}>İptal</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskPool;
