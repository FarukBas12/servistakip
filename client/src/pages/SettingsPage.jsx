import React, { useState, useEffect, useRef } from 'react';
import { Settings, Save, Database, Lock, Mail, Shield, Server, Building2, Palette, Upload, X, Check } from 'lucide-react';
import api from '../utils/api';
import { useTheme, ACCENT_COLORS } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState('branding');
    const [password, setPassword] = useState('');
    const { accentColor, setAccentColor, companyLogo, setCompanyLogo, companyName, setCompanyName } = useTheme();
    const [localName, setLocalName] = useState(companyName);
    const [logoPreview, setLogoPreview] = useState(companyLogo);
    const fileRef = useRef(null);

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
            toast.success('Ayarlar kaydedildi');
        } catch (err) { toast.error('Hata oluştu'); }
    };

    const handleEmailChange = (e) => {
        const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setEmailSettings({ ...emailSettings, [e.target.name]: val });
    };

    const handleSaveEmail = async () => {
        try {
            await api.put('/subs/settings/all', emailSettings);
            toast.success('E-posta ayarları kaydedildi');
        } catch (err) { toast.error('Ayarlar kaydedilemedi'); }
    };

    const handleBackup = async () => {
        if (!window.confirm('Şimdi yedek almak istiyor musunuz?')) return;
        try {
            const res = await api.post('/backup');
            toast.success('Yedek oluşturuldu');
            window.open(res.data.url, '_blank');
        } catch (err) {
            toast.error('Yedekleme başarısız: ' + (err.response?.data?.message || err.message));
        }
    };

    // LOGO UPLOAD
    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Logo 2MB'den küçük olmalı"); return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            setLogoPreview(ev.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSaveBranding = () => {
        setCompanyLogo(logoPreview);
        setCompanyName(localName);
        toast.success('Şirket kimliği kaydedildi ✓');
    };

    const handleRemoveLogo = () => {
        setLogoPreview(null);
    };

    // TAB STYLES
    const tabStyle = (tab, color) => ({
        padding: '10px 20px',
        borderRadius: '8px',
        border: 'none',
        background: activeTab === tab ? `rgba(${color}, 0.2)` : 'transparent',
        color: activeTab === tab ? `rgb(${color})` : 'var(--text-secondary)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: activeTab === tab ? '600' : 'normal',
        transition: 'all 0.2s',
        fontSize: '0.9rem',
        whiteSpace: 'nowrap'
    });

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }} className="fade-in">
            <h1 style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Settings size={28} /> Ayarlar &amp; Yönetim
            </h1>

            {/* TABS */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '30px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', overflowX: 'auto' }}>
                <button onClick={() => setActiveTab('branding')} style={tabStyle('branding', '99,102,241')}>
                    <Building2 size={18} /> Şirket Kimliği
                </button>
                <button onClick={() => setActiveTab('appearance')} style={tabStyle('appearance', '168,85,247')}>
                    <Palette size={18} /> Görünüm
                </button>
                <button onClick={() => setActiveTab('general')} style={tabStyle('general', '245,158,11')}>
                    <Shield size={18} /> Güvenlik
                </button>
                <button onClick={() => setActiveTab('email')} style={tabStyle('email', '192,132,252')}>
                    <Mail size={18} /> E-Posta
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', minHeight: '400px' }}>

                {/* ── TAB: ŞİRKET KİMLİĞİ ── */}
                {activeTab === 'branding' && (
                    <div className="fade-in">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
                            {/* LOGO */}
                            <div>
                                <h3 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Şirket Logosu</h3>
                                <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
                                    <div style={{
                                        width: '140px', height: '140px', borderRadius: '20px',
                                        background: 'var(--glass-surface)', border: '2px dashed var(--glass-border)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 20px', overflow: 'hidden', position: 'relative'
                                    }}>
                                        {logoPreview ? (
                                            <>
                                                <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                <button onClick={handleRemoveLogo} style={{
                                                    position: 'absolute', top: '6px', right: '6px',
                                                    background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: '50%',
                                                    width: '24px', height: '24px', cursor: 'pointer', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center', color: 'white'
                                                }}>
                                                    <X size={14} />
                                                </button>
                                            </>
                                        ) : (
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                                <Building2 size={40} style={{ marginBottom: '8px', opacity: 0.4 }} />
                                                <div>Logo yok</div>
                                            </div>
                                        )}
                                    </div>
                                    <input type="file" ref={fileRef} accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                                    <button className="glass-btn glass-btn-primary" onClick={() => fileRef.current?.click()}
                                        style={{ marginBottom: '10px', width: '100%', justifyContent: 'center' }}>
                                        <Upload size={16} /> Logo Yükle
                                    </button>
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>PNG, JPG, SVG · Max 2MB</p>
                                </div>
                            </div>

                            {/* ŞİRKET ADI */}
                            <div>
                                <h3 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Şirket Adı</h3>
                                <div className="glass-panel" style={{ padding: '24px' }}>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                                        Sidebar ve giriş ekranında görünecek şirket adı.
                                    </p>
                                    <input
                                        type="text"
                                        className="glass-input"
                                        value={localName}
                                        onChange={e => setLocalName(e.target.value)}
                                        placeholder="Şirket Adı"
                                        style={{ marginBottom: '16px' }}
                                    />
                                    {/* ÖNIZLEME */}
                                    <div style={{
                                        padding: '16px', borderRadius: '12px',
                                        background: 'var(--glass-surface)', border: 'var(--glass-border)',
                                        display: 'flex', alignItems: 'center', gap: '12px'
                                    }}>
                                        {logoPreview
                                            ? <img src={logoPreview} alt="logo" style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '8px' }} />
                                            : <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                                                {localName.charAt(0).toUpperCase()}
                                            </div>
                                        }
                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{localName}</span>
                                    </div>
                                </div>

                                <button onClick={handleSaveBranding} className="glass-btn glass-btn-success"
                                    style={{ marginTop: '24px', width: '100%', justifyContent: 'center' }}>
                                    <Check size={18} /> Kaydet
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TAB: GÖRÜNÜM (RENK TEMASI) ── */}
                {activeTab === 'appearance' && (
                    <div className="fade-in">
                        <h3 style={{ marginBottom: '8px', color: 'var(--primary)' }}>Aksan Rengi</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '28px' }}>
                            Butonlar, aktif menü öğeleri ve vurgular için kullanılacak rengi seçin.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', marginBottom: '40px' }}>
                            {ACCENT_COLORS.map(color => {
                                const isActive = accentColor.id === color.id;
                                return (
                                    <button key={color.id} onClick={() => setAccentColor(color)}
                                        style={{
                                            padding: '16px 12px', borderRadius: '14px', border: '2px solid',
                                            borderColor: isActive ? color.primary : 'transparent',
                                            background: isActive ? `${color.primary}22` : 'var(--glass-surface)',
                                            cursor: 'pointer', display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', gap: '10px', transition: 'all 0.2s',
                                            boxShadow: isActive ? `0 0 16px ${color.primary}55` : 'none'
                                        }}>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: color.primary }} />
                                            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: color.secondary }} />
                                        </div>
                                        <span style={{ fontSize: '0.8rem', fontWeight: isActive ? 700 : 500, color: isActive ? color.primary : 'var(--text-secondary)' }}>
                                            {color.label}
                                        </span>
                                        {isActive && <Check size={14} color={color.primary} />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* ÖNIZLEME */}
                        <div className="glass-panel" style={{ padding: '24px', border: `1px solid ${accentColor.primary}44` }}>
                            <h4 style={{ marginBottom: '16px', color: accentColor.primary }}>Önizleme</h4>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                                <button className="glass-btn glass-btn-primary">Birincil Buton</button>
                                <button className="glass-btn glass-btn-secondary">İkincil Buton</button>
                                <div style={{ padding: '8px 16px', borderRadius: '20px', background: `${accentColor.primary}22`, color: accentColor.primary, fontSize: '0.85rem', fontWeight: 600, border: `1px solid ${accentColor.primary}44` }}>
                                    Aktif Badge
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TAB: GÜVENLİK ── */}
                {activeTab === 'general' && (
                    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
                        <div>
                            <h3 style={{ marginBottom: '20px', color: '#f59e0b' }}>🔒 Silme Şifresi</h3>
                            <div className="glass-panel" style={{ padding: '20px' }}>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '15px', fontSize: '0.9rem' }}>
                                    Taşeron veya proje silerken sorulan güvenlik şifresi.
                                </p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input type="text" className="glass-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Örn: 123456" style={{ flex: 1 }} />
                                    <button onClick={handleSavePassword} className="glass-btn" style={{ background: '#f59e0b', color: 'black', width: 'auto' }}>
                                        <Save size={18} /> Kaydet
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 style={{ marginBottom: '20px', color: '#3b82f6' }}>💾 Sistem Yedekleme</h3>
                            <div className="glass-panel" style={{ padding: '20px' }}>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '15px', fontSize: '0.9rem' }}>
                                    Tüm veritabanını tek dosya olarak Cloudinary'e yedekle.
                                </p>
                                <button onClick={handleBackup} className="glass-btn" style={{ background: '#3b82f6', width: '100%', justifyContent: 'center' }}>
                                    <Database size={18} /> Şimdi Yedekle
                                </button>
                            </div>
                        </div>
                        <div>
                            <h3 style={{ marginBottom: '20px', color: '#10b981' }}>🛠 Veritabanı Güncelleme</h3>
                            <div className="glass-panel" style={{ padding: '20px' }}>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '15px', fontSize: '0.9rem' }}>
                                    Personel tablosu değişikliklerini uygular. (Gerekirse)
                                </p>
                                <button onClick={async () => {
                                    try {
                                        await api.post('/auth/migrate');
                                        toast.success('Veritabanı güncellendi!');
                                    } catch (err) {
                                        toast.error('Hata: ' + (err.response?.data || err.message));
                                    }
                                }} className="glass-btn" style={{ background: '#10b981', width: '100%', justifyContent: 'center' }}>
                                    <Server size={18} /> Migration Çalıştır
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TAB: E-POSTA ── */}
                {activeTab === 'email' && (
                    <div className="fade-in">
                        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ padding: '10px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.2)' }}>
                                <Mail size={24} color="#c084fc" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, color: '#c084fc' }}>E-Posta Entegrasyonu</h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Gelen mailleri otomatik olarak işleyin.</p>
                            </div>
                        </div>
                        <div className="glass-panel" style={{ padding: '25px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '25px', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                Bu özellik aktif edildiğinde sistem belirlediğiniz e-posta kutusunu düzenli aralıklarla kontrol eder.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '25px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>IMAP Sunucusu</label>
                                    <input type="text" className="glass-input" name="email_host" value={emailSettings.email_host} onChange={handleEmailChange} placeholder="imap.gmail.com" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Port</label>
                                    <input type="number" className="glass-input" name="email_port" value={emailSettings.email_port} onChange={handleEmailChange} placeholder="993" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>E-Posta Adresi</label>
                                    <input type="email" className="glass-input" name="email_user" value={emailSettings.email_user} onChange={handleEmailChange} placeholder="info@ornek.com" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Şifre (Uygulama Şifresi)</label>
                                    <input type="password" className="glass-input" name="email_pass" value={emailSettings.email_pass} onChange={handleEmailChange} placeholder="****" />
                                </div>
                            </div>
                            <div style={{ padding: '15px', background: 'var(--glass-surface)', borderRadius: '8px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <label className="switch">
                                    <input type="checkbox" name="email_active" checked={emailSettings.email_active} onChange={handleEmailChange} />
                                    <span className="slider round"></span>
                                </label>
                                <div>
                                    <span style={{ display: 'block', fontWeight: 'bold', color: emailSettings.email_active ? '#4ade80' : 'var(--text-secondary)' }}>
                                        {emailSettings.email_active ? 'Otomatik Kontrol Aktif' : 'Devre Dışı'}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pasifken sadece manuel tetikleme ile çalışır.</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                <button onClick={handleSaveEmail} className="glass-btn glass-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                                    <Save size={18} /> Ayarları Kaydet
                                </button>
                                <button onClick={async () => {
                                    if (!confirm('Mail kutusu şimdi kontrol edilecek. Devam edilsin mi?')) return;
                                    try {
                                        const res = await api.post('/subs/settings/test-email');
                                        toast.success(`Test tamamlandı — Bulunan: ${res.data.details?.total || 0}`);
                                    } catch (e) {
                                        toast.error('Hata: ' + (e.response?.data?.message || e.message));
                                    }
                                }} className="glass-btn glass-btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                                    <Database size={18} /> Bağlantıyı Test Et
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
