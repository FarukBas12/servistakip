import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await api.get('/tasks');
                setTasks(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchTasks();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Bu görevi silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/tasks/${id}`);
            // Remove from state
            setTasks(tasks.filter(t => t.id !== id));
        } catch (err) {
            console.error(err);
            alert('Silme işlemi başarısız');
        }
    };

    return (
        <div className="dashboard">
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h1>Yönetici Paneli</h1>
                    <Link to="/admin/create-task" className="glass-btn" style={{ textDecoration: 'none', background: 'rgba(76, 175, 80, 0.3)', borderColor: 'rgba(76, 175, 80, 0.5)' }}>
                        + Yeni Görev
                    </Link>
                </div>

                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead>
                        <tr>
                            <th style={{ color: 'rgba(255,255,255,0.7)' }}>Başlık</th>
                            <th style={{ color: 'rgba(255,255,255,0.7)' }}>Adres</th>
                            <th style={{ color: 'rgba(255,255,255,0.7)' }}>Atanan</th>
                            <th style={{ color: 'rgba(255,255,255,0.7)' }}>Durum</th>
                            <th style={{ color: 'rgba(255,255,255,0.7)' }}>Tarih</th>
                            <th style={{ color: 'rgba(255,255,255,0.7)' }}>İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map(task => (
                            <tr key={task.id} style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '15px', borderRadius: '8px 0 0 8px' }}>{task.title}</td>
                                <td style={{ padding: '15px' }}>{task.address}</td>
                                <td style={{ padding: '15px' }}>{task.assigned_user || '—'}</td>
                                <td style={{ padding: '15px' }}>
                                    <span style={{
                                        padding: '5px 10px',
                                        borderRadius: '20px',
                                        fontSize: '0.8rem',
                                        background: task.status === 'completed' ? 'rgba(244, 67, 54, 0.3)' : // Red (Biten)
                                            task.status === 'in_progress' ? 'rgba(76, 175, 80, 0.3)' : // Green (Aktif)
                                                'rgba(255, 193, 7, 0.3)', // Yellow (Atanan)
                                        color: task.status === 'completed' ? '#ef5350' :
                                            task.status === 'in_progress' ? '#81c784' :
                                                '#ffd54f'
                                    }}>
                                        {task.status === 'pending' ? 'Atandı' :
                                            task.status === 'in_progress' ? 'Aktif' : 'Tamamlandı'}
                                    </span>
                                </td>
                                <td style={{ padding: '15px' }}>{new Date(task.due_date).toLocaleDateString()}</td>
                                <td style={{ padding: '15px', borderRadius: '0 8px 8px 0' }}>
                                    <button
                                        onClick={() => handleDelete(task.id)}
                                        style={{
                                            background: 'rgba(255, 0, 0, 0.3)',
                                            color: '#ff8a80',
                                            border: 'none',
                                            padding: '5px 10px',
                                            borderRadius: '5px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Sil
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {tasks.length === 0 && <p style={{ textAlign: 'center', opacity: 0.6 }}>Henüz görev yok.</p>}
            </div>
        </div>
    );
};

export default AdminDashboard;
