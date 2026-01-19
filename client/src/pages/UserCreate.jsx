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

    return (
        <div className="dashboard">
            <button onClick={() => navigate('/admin')} className="glass-btn" style={{ marginBottom: '1rem' }}>&larr; Geri</button>
            <div className="glass-panel" style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
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
        </div>
    );
};

export default UserCreate;
