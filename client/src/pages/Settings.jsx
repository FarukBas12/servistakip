import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Save, Lock, Shield, Database, Users, Trash2, PlusCircle } from 'lucide-react';

const Settings = () => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(true);

    // User Management State
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({ username: '', password: '', role: 'technician' });

    useEffect(() => {
        fetchSettings();
        fetchUsers();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/subs/settings/all');
            setPassword(res.data.delete_password);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/auth/users');
            setUsers(res.data);
        } catch (err) { console.error(err); }
    };

    const handleUserChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', formData);
            alert('Kullanıcı oluşturuldu!');
            setFormData({ username: '', password: '', role: 'technician' });
            fetchUsers();
        } catch (err) {
            alert('Hata: Kullanıcı oluşturulamadı.');
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
            try {
                await api.delete(`/auth/${id}`);
                fetchUsers();
            } catch (err) {
                alert('Silme başarısız');
            }
        }
    };

    const handleSave = async () => {
        try {
            await api.put('/subs/settings/all', { delete_password: password });
            alert('Ayarlar Kaydedildi');
        } catch (err) { console.error(err); alert('Hata'); }
    };

    if (loading) return <div>Yükleniyor...</div>;

    return (
        <div className="dashboard">
            <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield size={28} color="#4caf50" />
                Güvenlik Ayarları
            </h2>

            {/* USER MANAGEMENT SECTION */}
            <div className="glass-panel" style={{ padding: '30px', marginBottom: '40px' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users size={20} />
                    Kullanıcı Yönetimi
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
                    {/* Create User */}
                    <div>
                        <h4 style={{ marginBottom: '15px', color: '#aaa' }}>Yeni Kullanıcı Ekle</h4>
                        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input
                                className="glass-input"
                                name="username"
                                placeholder="Kullanıcı Adı"
                                value={formData.username}
                                onChange={handleUserChange}
                                required
                            />
                            <input
                                className="glass-input"
                                name="password"
                                type="password"
                                placeholder="Şifre"
                                value={formData.password}
                                onChange={handleUserChange}
                                required
                            />
                            <select
                                className="glass-input"
                                name="role"
                                value={formData.role}
                                onChange={handleUserChange}
                                style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
                            >
                                <option value="technician" style={{ color: 'black' }}>Teknisyen</option>
                                <option value="depocu" style={{ color: 'black' }}>Depocu</option>
                                <option value="admin" style={{ color: 'black' }}>Admin</option>
                            </select>
                            <button type="submit" className="glass-btn" style={{ background: 'rgba(76, 175, 80, 0.3)', justifyContent: 'center' }}>
                                <PlusCircle size={18} style={{ marginRight: '5px' }} /> Kullanıcı Oluştur
                            </button>
                        </form>
                    </div>

                    {/* User List */}
                    <div>
                        <h4 style={{ marginBottom: '15px', color: '#aaa' }}>Mevcut Kullanıcılar</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                            {users.map(u => (
                                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                            {u.username.substring(0, 1).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{u.username}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{u.role}</div>
                                        </div>
                                    </div>
                                    {u.username !== 'admin' && (
                                        <button onClick={() => handleDeleteUser(u.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }}>
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <h2 style={{ marginBottom: '20px', marginTop: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield size={28} color="#4caf50" />
                Diğer Güvenlik Ayarları
            </h2>

            <div className="glass-panel" style={{ padding: '30px', maxWidth: '500px' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Lock size={20} />
                    Taşeron Silme Şifresi
                </h3>
                <p style={{ opacity: 0.7, marginBottom: '20px' }}>
                    Bu şifre, taşeronları veya kritik verileri silerken sorulacaktır.
                </p>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '10px' }}>Şifre Belirle</label>
                    <input
                        type="text"
                        className="glass-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Örn: 123456"
                    />
                </div>

                <button onClick={handleSave} className="glass-btn" style={{ background: '#4caf50', width: '100%', justifyContent: 'center' }}>
                    <Save size={18} style={{ marginRight: '10px' }} /> Kaydet
                </button>
            </div>

            {/* Backup Section */}
            <h2 style={{ marginBottom: '20px', marginTop: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Database size={28} color="#2196f3" />
                Veri Yönetimi
            </h2>

            <div className="glass-panel" style={{ padding: '30px', maxWidth: '500px' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Database size={20} />
                    Veritabanı Yedekle
                </h3>
                <p style={{ opacity: 0.7, marginBottom: '20px' }}>
                    Tüm verileri (Kullanıcılar, Stoklar, Projeler, Hakedişler vb.) tek bir dosya olarak Cloudinary'e yedekler.
                    Yedekleme her gece 03:00'te otomatik yapılır.
                </p>

                <button
                    onClick={async () => {
                        if (!window.confirm('Şimdi yedek almak istiyor musunuz?')) return;
                        try {
                            setLoading(true);
                            const res = await api.post('/backup');
                            alert('Yedek Başarıyla Oluşturuldu! URL: ' + res.data.url);
                            window.open(res.data.url, '_blank');
                        } catch (err) {
                            alert('Yedekleme Başarısız: ' + (err.response?.data?.message || err.message));
                        } finally {
                            setLoading(false);
                        }
                    }}
                    className="glass-btn"
                    style={{ background: '#2196f3', width: '100%', justifyContent: 'center' }}
                >
                    <Save size={18} style={{ marginRight: '10px' }} /> Şimdi Yedekle
                </button>
            </div>
        </div>
    );
};

export default Settings;
