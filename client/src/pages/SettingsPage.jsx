import React, { useState, useEffect } from 'react';
import { Settings, Save, Database, Lock, Mail, Shield, Server } from 'lucide-react';
import api from '../utils/api';

const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [password, setPassword] = useState('');

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
            const settingsRes = await api.get('/subs/settings/all');
            setPassword(settingsRes.data.delete_password);

            if (settingsRes.data) {
                setEmailSettings({
                    email_host: settingsRes.data.email_host || 'imap.gmail.com',
                    email_port: settingsRes.data.email_port || 993,
                    email_user: settingsRes.data.email_user || '',
                    email_pass: settingsRes.data.email_pass || '',
                    email_active: settingsRes.data.email_active || false
                });
            }
        } catch (err) { console.error(err); }
    };

    const handleSavePassword = async () => {
        try {
            await api.put('/subs/settings/all', { delete_password: password });
            alert('Ayarlar Kaydedildi');
        } catch (err) { alert('Hata'); }
    };

    const handleEmailChange = (e) => {
        const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setEmailSettings({ ...emailSettings, [e.target.name]: val });
    };

    const handleSaveEmail = async () => {
        try {
            await api.put('/subs/settings/all', emailSettings);
            alert('E-posta Ayarları Kaydedildi!');
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
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }} className="fade-in">
            <h1 style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Settings size={28} /> Ayarlar & Yönetim
            </h1>

            {/* TABS Navigation */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                <button
                    onClick={() => setActiveTab('general')}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        background: activeTab === 'general' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                        color: activeTab === 'general' ? '#60a5fa' : '#aaa',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: activeTab === 'general' ? 'bold' : 'normal',
                        transition: 'all 0.2s'
                    }}
                >
                    <Shield size={18} /> Genel & Güvenlik
                </button>
                <button
                    onClick={() => setActiveTab('email')}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        background: activeTab === 'email' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                        color: activeTab === 'email' ? '#c084fc' : '#aaa',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: activeTab === 'email' ? 'bold' : 'normal',
                        transition: 'all 0.2s'
                    }}
                >
                    <Mail size={18} /> E-Posta Entegrasyonu
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', minHeight: '400px' }}>

                {/* --- TAB CONTENT: GENERAL & SECURITY --- */}
                {activeTab === 'general' && (
                    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
                        {/* SECURITY PASSWORD */}
                        <div>
                            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#f59e0b' }}>
                                <Lock size={20} /> Silme Şifresi
                            </h3>
                            <div className="glass-panel" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
                                <p style={{ opacity: 0.7, marginBottom: '15px', fontSize: '0.9rem' }}>Taşeron veya proje silerken sorulan güvenlik şifresi.</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input type="text" className="glass-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Örn: 123456" style={{ flex: 1 }} />
                                    <button onClick={handleSavePassword} className="glass-btn" style={{ background: '#f59e0b', color: 'black', width: 'auto' }}>
                                        <Save size={18} /> Kaydet
                                    </button>
                                </div>
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
                                    <Database size={18} style={{ marginRight: '10px' }} /> Şimdi Yedekle
                                </button>
                            </div>
                        </div>

                        {/* DATABASE MIGRATION */}
                        <div>
                            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981' }}>
                                <Server size={20} /> Veritabanı Güncelleme
                            </h3>
                            <div className="glass-panel" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
                                <p style={{ opacity: 0.7, marginBottom: '15px', fontSize: '0.9rem' }}>Personel tablosu değişikliklerini uygular. (Gerekirse)</p>
                                <button onClick={async () => {
                                    try {
                                        await api.post('/auth/migrate');
                                        alert('✅ Veritabanı güncellendi! Yeni personel alanları eklendi.');
                                        fetchSettingsData();
                                    } catch (err) {
                                        alert('❌ Hata: ' + (err.response?.data || err.message));
                                    }
                                }} className="glass-btn" style={{ background: '#10b981', width: '100%', justifyContent: 'center' }}>
                                    <Server size={18} style={{ marginRight: '10px' }} /> Migration Çalıştır
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB CONTENT: EMAIL INTEGRATION --- */}
                {activeTab === 'email' && (
                    <div className="fade-in">
                        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ padding: '10px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.2)' }}>
                                <Mail size={24} color="#c084fc" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, color: '#c084fc' }}>E-Posta Entegrasyonu</h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.6 }}>Gelen mailleri otomatik olarak işleyin.</p>
                            </div>
                        </div>

                        <div className="glass-panel" style={{ padding: '25px', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(168, 85, 247, 0.02) 100%)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                            <p style={{ opacity: 0.7, marginBottom: '25px', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                Bu özellik aktif edildiğinde, sistem belirlediğiniz e-posta kutusunu düzenli aralıklarla kontrol eder.
                                Yeni gelen mailleri analiz ederek otomatik olarak servis kaydı veya görev oluşturur.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '25px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '8px', opacity: 0.7 }}>IMAP Sunucusu</label>
                                    <input type="text" className="glass-input" name="email_host" value={emailSettings.email_host} onChange={handleEmailChange} placeholder="imap.gmail.com" style={{ width: '100%', padding: '12px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '8px', opacity: 0.7 }}>Port</label>
                                    <input type="number" className="glass-input" name="email_port" value={emailSettings.email_port} onChange={handleEmailChange} placeholder="993" style={{ width: '100%', padding: '12px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '8px', opacity: 0.7 }}>E-Posta Adresi</label>
                                    <input type="email" className="glass-input" name="email_user" value={emailSettings.email_user} onChange={handleEmailChange} placeholder="info@ornek.com" style={{ width: '100%', padding: '12px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '8px', opacity: 0.7 }}>Şifre (Uygulama Şifresi)</label>
                                    <input type="password" className="glass-input" name="email_pass" value={emailSettings.email_pass} onChange={handleEmailChange} placeholder="****" style={{ width: '100%', padding: '12px' }} />
                                </div>
                            </div>

                            <div style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <label className="switch">
                                        <input type="checkbox" name="email_active" checked={emailSettings.email_active} onChange={handleEmailChange} />
                                        <span className="slider round"></span>
                                    </label>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 'bold', color: emailSettings.email_active ? '#4ade80' : '#aaa' }}>
                                            {emailSettings.email_active ? 'Otomatik Kontrol Aktif' : 'Devre Dışı'}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Pasifken sadece manuel tetikleme ile çalışır.</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                <button onClick={handleSaveEmail} className="glass-btn" style={{ background: 'rgba(192, 132, 252, 0.3)', width: 'auto', padding: '12px 30px', flex: 1 }}>
                                    <Save size={18} style={{ marginRight: '10px' }} /> Ayarları Kaydet
                                </button>

                                <button onClick={async () => {
                                    if (!confirm('Mail kutusu şimdi kontrol edilecek. Devam edilsin mi?')) return;
                                    try {
                                        alert('Kontrol ediliyor...');
                                        const res = await api.post('/subs/settings/test-email');
                                        alert(`✅ Test Tamamlandı!\nBulunan: ${res.data.details?.total || 0}\nİşlenen: ${res.data.details?.processed || 0}`);
                                    } catch (e) {
                                        alert('❌ Hata: ' + (e.response?.data?.message || e.message));
                                    }
                                }} className="glass-btn" style={{ background: 'rgba(96, 165, 250, 0.2)', width: 'auto', padding: '12px 30px', flex: 1 }}>
                                    <Database size={18} style={{ marginRight: '10px' }} /> Bağlantıyı Test Et
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsPage;
