import React, { useState, useEffect } from 'react';
import { Users, PlusCircle, Settings, Save, Trash2, Lock, Database } from 'lucide-react';
import api from '../utils/api';

const SettingsPage = () => {
    // SETTINGS STATE
    const [password, setPassword] = useState('');
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({ username: '', password: '', role: 'technician' });

    // EMAIL SETTINGS STATE
    const [emailSettings, setEmailSettings] = useState({
        email_host: 'imap.gmail.com',
        email_port: 993,
        email_user: '',
        email_pass: '',
        email_active: false
    });

    useEffect(() => {
        fetchSettingsData();
    }, []);

    const fetchSettingsData = async () => {
        try {
            const [settingsRes, usersRes] = await Promise.all([
                api.get('/subs/settings/all'),
                api.get('/auth/users')
            ]);
            setPassword(settingsRes.data.delete_password);

            // Set Email Settings from DB
            if (settingsRes.data) {
                setEmailSettings({
                    email_host: settingsRes.data.email_host || 'imap.gmail.com',
                    email_port: settingsRes.data.email_port || 993,
                    email_user: settingsRes.data.email_user || '',
                    email_pass: settingsRes.data.email_pass || '',
                    email_active: settingsRes.data.email_active || false
                });
            }

            setUsers(usersRes.data);
        } catch (err) { console.error(err); }
    };

    // --- SETTINGS HANDLERS ---
    const handleUserChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', formData);
            alert('Kullanıcı oluşturuldu!');
            setFormData({ username: '', password: '', role: 'technician' });
            fetchSettingsData(); // Refresh users
        } catch (err) { alert('Hata: Kullanıcı oluşturulamadı.'); }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
            try {
                await api.delete(`/auth/${id}`);
                fetchSettingsData();
            } catch (err) { alert('Silme başarısız'); }
        }
    };

    const handleSavePassword = async () => {
        try {
            await api.put('/subs/settings/all', { delete_password: password });
            alert('Ayarlar Kaydedildi');
        } catch (err) { alert('Hata'); }
    };

    // EMAIL HANDLERS
    const handleEmailChange = (e) => {
        const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setEmailSettings({ ...emailSettings, [e.target.name]: val });
    };

    const handleSaveEmail = async () => {
        try {
            await api.put('/subs/settings/all', emailSettings);
            alert('E-posta Ayarları Kaydedildi! Sistem belirlenen aralıklarla mail kutusunu kontrol edecektir.');
        } catch (err) { alert('Hata: Ayarlar kaydedilemedi.'); }
    };

    const handleBackup = async () => {
        if (!window.confirm('Şimdi yedek almak istiyor musunuz?')) return;
        try {
            const res = await api.post('/backup');
            alert('Yedek Başarıyla Oluşturuldu! URL: ' + res.data.url);
            window.open(res.data.url, '_blank');
        } catch (err) {
            alert('Yedekleme Başarısız: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="settings-page fade-in">
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h1 style={{ marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                    Ayarlar & Yönetim
                </h1>

                {/* EMAIL INTEGRATION SECTION */}
                <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#c084fc' }}>
                        <Settings size={20} /> E-Posta Entegrasyonu
                    </h3>
                    <div className="glass-panel" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(168, 85, 247, 0.02) 100%)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                        <p style={{ opacity: 0.7, marginBottom: '20px', fontSize: '0.9rem' }}>
                            Bu bölüme şirket mail bilgilerinizi (IMAP) girerek, gelen maillerin otomatik olarak servise/göreve dönüştürülmesini sağlayabilirsiniz.
                            (Gmail için Uygulama Şifresi kullanılması önerilir.)
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '5px', opacity: 0.7 }}>IMAP Sunucusu</label>
                                <input type="text" className="glass-input" name="email_host" value={emailSettings.email_host} onChange={handleEmailChange} placeholder="imap.gmail.com" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '5px', opacity: 0.7 }}>Port</label>
                                <input type="number" className="glass-input" name="email_port" value={emailSettings.email_port} onChange={handleEmailChange} placeholder="993" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '5px', opacity: 0.7 }}>E-Posta Adresi</label>
                                <input type="email" className="glass-input" name="email_user" value={emailSettings.email_user} onChange={handleEmailChange} placeholder="info@ornek.com" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '5px', opacity: 0.7 }}>Şifre (Uygulama Şifresi)</label>
                                <input type="password" className="glass-input" name="email_pass" value={emailSettings.email_pass} onChange={handleEmailChange} placeholder="****" />
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <label className="switch">
                                <input type="checkbox" name="email_active" checked={emailSettings.email_active} onChange={handleEmailChange} />
                                <span className="slider round"></span>
                            </label>
                            <span style={{ fontSize: '0.9rem', color: emailSettings.email_active ? '#4ade80' : '#aaa' }}>{emailSettings.email_active ? 'Otomatik Kontrol Aktif' : 'Devre Dışı'}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleSaveEmail} className="glass-btn" style={{ background: 'rgba(192, 132, 252, 0.3)', width: 'auto', padding: '10px 30px' }}>
                                <Save size={18} style={{ marginRight: '10px' }} /> Ayarları Kaydet
                            </button>

                            <button onClick={async () => {
                                if (!confirm('Mail kutusu şimdi kontrol edilecek. Lütfen mailin OKUNMAMIŞ olduğundan emin olun. Devam edilsin mi?')) return;
                                try {
                                    alert('Kontrol ediliyor, lütfen bekleyin...');
                                    const res = await api.post('/subs/settings/test-email');
                                    const { processed, total, errors } = res.data.details || {};

                                    let msg = `✅ Test Tamamlandı!\n\nBulunan Mail: ${total || 0}\nOluşturulan Görev: ${processed || 0}`;
                                    if (errors && errors.length > 0) {
                                        msg += `\n\nHatalar: ${errors.join(', ')}`;
                                    } else if (total === 0) {
                                        msg += `\n\n⚠️ Hiç mail bulunamadı. Lütfen mailin "Okunmamış" olduğundan ve spam'e düşmediğinden emin olun.`;
                                    }

                                    alert(msg);
                                } catch (e) {
                                    alert('❌ Hata: ' + (e.response?.data?.message || e.message));
                                }
                            }} className="glass-btn" style={{ background: 'rgba(96, 165, 250, 0.2)', width: 'auto', padding: '10px 30px' }}>
                                <Database size={18} style={{ marginRight: '10px' }} /> Bağlantıyı Test Et
                            </button>
                        </div>
                    </div>
                </div>

                {/* USER MANAGEMENT SECTION */}
                <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#4ade80' }}>
                        <Users size={20} /> Kullanıcı Yönetimi

                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
                        {/* Create User */}
                        <div>
                            <h4 style={{ marginBottom: '15px', color: '#aaa', fontSize: '0.9rem' }}>Yeni Kullanıcı</h4>
                            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <input className="glass-input" name="username" placeholder="Kullanıcı Adı" value={formData.username} onChange={handleUserChange} required />
                                <input className="glass-input" name="password" type="password" placeholder="Şifre" value={formData.password} onChange={handleUserChange} required />
                                <select className="glass-input" name="role" value={formData.role} onChange={handleUserChange} style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}>
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
                            <h4 style={{ marginBottom: '15px', color: '#aaa', fontSize: '0.9rem' }}>Kayıtlı Kullanıcılar</h4>
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
                    {/* SECURITY PASSWORD */}
                    <div>
                        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#f59e0b' }}>
                            <Lock size={20} /> Silme Şifresi
                        </h3>
                        <div className="glass-panel" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
                            <p style={{ opacity: 0.7, marginBottom: '15px', fontSize: '0.9rem' }}>Taşeron veya proje silerken sorulan güvenlik şifresi.</p>
                            <input type="text" className="glass-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Örn: 123456" style={{ width: '100%', marginBottom: '15px' }} />
                            <button onClick={handleSavePassword} className="glass-btn" style={{ background: '#f59e0b', width: '100%', justifyContent: 'center', color: 'black' }}>
                                <Save size={18} style={{ marginRight: '10px' }} /> Kaydet
                            </button>
                        </div>
                    </div>

                    {/* BACKUP */}
                    <div>
                        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#3b82f6' }}>
                            <Database size={20} /> Sistem Yedekleme
                        </h3>
                        <div className="glass-panel" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
                            <p style={{ opacity: 0.7, marginBottom: '15px', fontSize: '0.9rem' }}>Tüm veritabanını tek dosya olarak Cloudinary'e yedekle.</p>
                            <button onClick={handleBackup} className="glass-btn" style={{ background: '#3b82f6', width: '100%', justifyContent: 'center' }}>
                                <Save size={18} style={{ marginRight: '10px' }} /> Şimdi Yedekle
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
