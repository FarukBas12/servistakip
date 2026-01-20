import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const TaskPool = () => {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Modal States
    const [editingTask, setEditingTask] = useState(null); // For Edit & Assign
    const [modalMode, setModalMode] = useState(null); // 'edit' or 'assign'

    // Form Data
    const [editForm, setEditForm] = useState({ title: '', description: '', address: '' });
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
            // Filter only unassigned tasks or completed ones
            // We keep completed ones to show history, but unassigned are the main pool
            setTasks(res.data.filter(t => !t.assigned_to || t.status === 'completed'));
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
            address: task.address
        });
        setModalMode('edit');
    };

    const openAssignModal = (task) => {
        setEditingTask(task);
        setAssignId('');
        setModalMode('assign');
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/tasks/${editingTask.id}`, editForm);
            alert('Görev güncellendi');
            setEditingTask(null);
            fetchTasks(); // Refresh to see changes
        } catch (err) {
            alert('Güncelleme başarısız');
        }
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/tasks/${editingTask.id}`, { assigned_to: assignId });
            alert('Görev atandı');
            setEditingTask(null);
            fetchTasks(); // It will disappear from pool
        } catch (err) {
            alert('Atama başarısız');
        }
    };

    // Filtered tasks
    const filteredTasks = tasks.filter(task => {
        if (selectedRegion === 'Hepsi') return true;
        const region = task.region || 'Diğer';
        return region === selectedRegion;
    });

    return (
        <div className="dashboard">
            <button onClick={() => navigate('/admin')} className="glass-btn" style={{ marginBottom: '1rem' }}>&larr; Panela Dön</button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>İş Havuzu</h2>
                <button onClick={() => navigate('/admin/create-task')} className="glass-btn" style={{ background: 'rgba(76, 175, 80, 0.3)' }}>+ Yeni Görev</button>
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
                    {filteredTasks.length === 0 ? <p style={{ opacity: 0.7 }}>Bu bölgede bekleyen iş yok.</p> : filteredTasks.map(task => (
                        <div key={task.id} className="glass-panel" style={{
                            padding: '20px',
                            position: 'relative',
                            borderLeft: task.status === 'completed' ? '5px solid #4caf50' : '5px solid #2196f3'
                        }}>
                            {/* CANCELLED WARNING BANNER */}
                            {task.cancel_count > 0 && task.status !== 'completed' && (
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
                                    ⚠️ Bu iş {task.cancel_count} kez iade edildi!
                                    <span style={{ fontWeight: 'normal', opacity: 0.8, fontSize: '0.8rem', marginLeft: 'auto' }}>
                                        Son: {task.last_cancel_reason?.substring(0, 15)}...
                                    </span>
                                </div>
                            )}

                            <div style={{ position: 'absolute', top: 15, right: 15, display: 'flex', gap: '5px' }}>
                                <button onClick={() => handleDelete(task.id)} style={{ background: 'rgba(244, 67, 54, 0.3)', border: '1px solid rgba(255,0,0,0.3)', color: 'white', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Sil</button>
                            </div>

                            <span style={{
                                background: task.status === 'completed' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(33, 150, 243, 0.2)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                color: 'white',
                                marginBottom: '5px',
                                display: 'inline-block'
                            }}>
                                {task.status === 'completed' ? 'TAMAMLANDI' : 'BEKLİYOR'}
                            </span>

                            <h3 style={{ marginTop: 5, paddingRight: '50px' }}>{task.title}</h3>
                            <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>{task.address}</p>
                            {task.assigned_user && task.status === 'completed' && (
                                <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Tamamlayan: {task.assigned_user}</p>
                            )}
                            {task.description && <p style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '5px' }}>{task.description}</p>}

                            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                                {task.status !== 'completed' && (
                                    <>
                                        <button onClick={() => openAssignModal(task)} className="glass-btn" style={{ flex: 1, background: 'rgba(33, 150, 243, 0.3)' }}>
                                            👤 Personele Ata
                                        </button>
                                        <button onClick={() => openEditModal(task)} className="glass-btn" style={{ flex: 1, background: 'rgba(255, 193, 7, 0.3)' }}>
                                            ✏️ Düzenle
                                        </button>
                                    </>
                                )}
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
                        <h3>{modalMode === 'edit' ? 'Görevi Düzenle' : 'Personel Ata'}</h3>

                        {modalMode === 'edit' ? (
                            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <input
                                    className="glass-input"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    placeholder="Başlık"
                                    required
                                />
                                <input
                                    className="glass-input"
                                    value={editForm.address}
                                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                    placeholder="Adres"
                                    required
                                />
                                <textarea
                                    className="glass-input"
                                    rows="4"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    placeholder="Açıklama / Detaylar"
                                />
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button type="submit" className="glass-btn" style={{ flex: 1, background: 'rgba(76, 175, 80, 0.3)' }}>Kaydet</button>
                                    <button type="button" onClick={() => setEditingTask(null)} className="glass-btn" style={{ flex: 1, background: 'rgba(255, 0, 0, 0.3)' }}>İptal</button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <p>"{editingTask.title}" görevi için teknisyen seçin:</p>
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
                                    <button type="submit" className="glass-btn" style={{ flex: 1, background: 'rgba(33, 150, 243, 0.3)' }}>Atamayı Yap</button>
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
