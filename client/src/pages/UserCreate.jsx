import React, { useState } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const UserCreate = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', password: '', role: 'technician' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', formData);
            alert('Kullanıcı oluşturuldu!');
            navigate('/admin');
        } catch (err) {
            alert('Hata: Kullanıcı oluşturulamadı.');
        }
    };

    const [users, setUsers] = useState([]);

    React.useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/auth/users');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
            try {
                await api.delete(`/auth/${id}`);
                fetchUsers(); // Refresh list
            } catch (err) {
                alert('Silme başarısız');
            }
        }
    };

    return (
        <div className="dashboard">
            <button onClick={() => navigate('/admin')} className="glass-btn" style={{ marginBottom: '1rem' }}>&larr; Geri</button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h2 style={{ marginTop: 0 }}>Yeni Kullanıcı Oluştur</h2>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label>Kullanıcı Adı</label>
                        <input className="glass-input" name="username" onChange={handleChange} required />
                        <label>Şifre</label>
                        <input className="glass-input" name="password" type="password" onChange={handleChange} required />
                        <label>Rol</label>
                        <select className="glass-input" name="role" onChange={handleChange} style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                            <option value="technician" style={{ color: 'black' }}>Teknisyen</option>
                            <option value="admin" style={{ color: 'black' }}>Admin</option>
                        </select>
                        <button type="submit" className="glass-btn" style={{ background: 'rgba(76, 175, 80, 0.3)', marginTop: '10px' }}>Kaydet</button>
                    </form>
                </div>

                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h2 style={{ marginTop: 0 }}>Mevcut Kullanıcılar</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {users.map(u => (
                            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
                                <span><b>{u.username}</b> ({u.role})</span>
                                {u.username !== 'admin' && (
                                    <button onClick={() => handleDelete(u.id)} style={{ background: '#ff5252', border: 'none', borderRadius: '4px', padding: '5px 10px', color: 'white', cursor: 'pointer' }}>Sil</button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserCreate;
