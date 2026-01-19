import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const TaskCreate = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        address: '',
        due_date: '',
        assigned_to: '',
        address: '',
        due_date: '',
        assigned_to: '',
        maps_link: '',
        lat: '',
        lng: ''
    });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get('/auth/users');
                // Filter only technicians
                setUsers(res.data.filter(u => u.role === 'technician'));
            } catch (err) {
                console.error(err);
            }
        };
        fetchUsers();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tasks', formData);
            navigate('/admin');
        } catch (err) {
            alert('Failed to create task');
        }
    };

    return (
        <div className="dashboard">
            <button onClick={() => navigate('/admin')} className="glass-btn" style={{ marginBottom: '1rem' }}>&larr; Geri</button>
            <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
                <h2 style={{ marginTop: 0 }}>Yeni Görev Oluştur</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input className="glass-input" name="title" placeholder="Görev Başlığı" onChange={handleChange} required />
                    <textarea className="glass-input" name="description" placeholder="Açıklama" onChange={handleChange} rows="3" />
                    <input className="glass-input" name="address" placeholder="Adres (Metin)" onChange={handleChange} required />

                    <label>Konum (Harita Pin'i için)</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input className="glass-input" name="lat" type="number" step="any" placeholder="Enlem (Lat)" onChange={handleChange} />
                        <input className="glass-input" name="lng" type="number" step="any" placeholder="Boylam (Lng)" onChange={handleChange} />
                    </div>
                    <small style={{ opacity: 0.7 }}>Haritada pin olarak gözükmesi için gereklidir (Google Maps Linkinden alabilirsiniz).</small>

                    <input className="glass-input" name="maps_link" placeholder="Google Maps Linki (Opsiyonel)" onChange={handleChange} />

                    <label>Son Tarih</label>
                    <input className="glass-input" name="due_date" type="datetime-local" onChange={handleChange} />

                    <label>Personel Ata (Opsiyonel)</label>
                    <select className="glass-input" name="assigned_to" onChange={handleChange} style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                        <option value="" style={{ color: 'black' }}>-- Havuza Bırak --</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id} style={{ color: 'black' }}>{u.username}</option>
                        ))}
                    </select>

                    <button type="submit" className="glass-btn" style={{ marginTop: '10px', background: 'rgba(76, 175, 80, 0.3)' }}>Görevi Oluştur</button>
                </form>
            </div>
        </div>
    );
};

export default TaskCreate;
