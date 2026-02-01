import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ShoppingBag, PlusCircle, TrendingUp, Shield, Lock, Database, Save, Trash2, LayoutDashboard, Settings } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../utils/api';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    // DASHBOARD STATE
    const [stocks, setStocks] = useState([]);
    const [totalValue, setTotalValue] = useState(0);
    const [categoryData, setCategoryData] = useState([]);


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
        fetchDashboardData();
        fetchSettingsData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await api.get('/stock-tracking');
            const data = res.data;
            setStocks(data);

            let sum = 0;
            const catMap = {};
            data.forEach(item => {
                const val = (parseFloat(item.quantity) || 0) * (parseFloat(item.purchase_price) || 0);
                sum += val;
                const cat = item.category || 'Diğer';
                catMap[cat] = (catMap[cat] || 0) + val;
            });

            setTotalValue(sum);
            const chartData = Object.keys(catMap).map(key => ({
                name: key,
                value: catMap[key]
            })).filter(i => i.value > 0);
            setCategoryData(chartData);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

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
            setLoading(true);
            const res = await api.post('/backup');
            alert('Yedek Başarıyla Oluşturuldu! URL: ' + res.data.url);
            window.open(res.data.url, '_blank');
        } catch (err) {
            alert('Yedekleme Başarısız: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
    const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

    return (
        <div className="dashboard">
            <div className="glass-panel" style={{ padding: '2rem' }}>
                {/* TABS HEADER */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                    <button
                        onClick={() => setActiveTab('overview')}
                        style={{
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'overview' ? '2px solid #60a5fa' : 'none',
                            color: activeTab === 'overview' ? '#60a5fa' : '#aaa',
                            padding: '10px 20px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            transition: 'all 0.3s'
                        }}
                    >
                        <LayoutDashboard size={20} /> Genel Bakış
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        style={{
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'settings' ? '2px solid #4ade80' : 'none',
                            color: activeTab === 'settings' ? '#4ade80' : '#aaa',
                            padding: '10px 20px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            transition: 'all 0.3s'
                        }}
                    >
                        <Settings size={20} /> Ayarlar & Yönetim
                    </button>
                </div>

                {/* --- TAB CONTENT: OVERVIEW --- */}
                {activeTab === 'overview' && (
                    <div className="fade-in">
                        <h1 style={{ marginBottom: '10px', textAlign: 'center' }}>Yönetici Paneli & Varlık Raporu</h1>
                        <p style={{ opacity: 0.7, marginBottom: '40px', textAlign: 'center' }}>Şirket envanter durumu ve yönetim kısayolları.</p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', marginBottom: '40px' }}>
                            {/* TOTAL CARD */}
                            <div className="glass-panel" style={{ padding: '20px', minWidth: '300px', flex: 1, background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#818cf8', marginBottom: '10px' }}>
                                    <TrendingUp size={24} />
                                    <h3 style={{ margin: 0, color: '#818cf8' }}>Toplam Stok Değeri</h3>
                                </div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', textShadow: '0 0 20px rgba(99, 102, 241, 0.5)', textAlign: 'center' }}>
                                    {loading ? '...' : formatCurrency(totalValue)}
                                </div>
                                <p style={{ fontSize: '0.9rem', opacity: 0.6, marginTop: '5px', textAlign: 'center' }}>
                                    {stocks.length} Kalem Ürün
                                </p>
                            </div>

                            {/* CHART */}
                            {totalValue > 0 && (
                                <div className="glass-panel" style={{ padding: '20px', minWidth: '300px', flex: 1, height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <h4 style={{ margin: '0 0 10px 0', opacity: 0.8 }}>Kategori Bazlı Değer Dağılımı</h4>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                                                {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: 'white' }} />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>

                        {/* ACTION BUTTONS */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '40px' }}>
                            <Link to="/admin/create-task" className="glass-btn" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '150px', background: 'rgba(76, 175, 80, 0.2)' }}>
                                <PlusCircle size={32} /> <span>Yeni Görev</span>
                            </Link>
                            <Link to="/admin/create-user" className="glass-btn" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '150px', background: 'rgba(33, 150, 243, 0.2)' }}>
                                <Users size={32} /> <span>Personel Ekle</span>
                            </Link>
                            <Link to="/admin/import-stores" className="glass-btn" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '150px', background: 'rgba(255, 193, 7, 0.2)' }}>
                                <ShoppingBag size={32} /> <span>Mağaza Yükle</span>
                            </Link>
                        </div>
                    </div>
                )}

                {/* --- TAB CONTENT: SETTINGS --- */}
                {activeTab === 'settings' && (
                    <div className="fade-in">
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
                                        if (!confirm('Mail kutusu şimdi kontrol edilecek. Devam edilsin mi?')) return;
                                        try {
                                            alert('Kontrol ediliyor, lütfen bekleyin...');
                                            await api.post('/subs/settings/test-email');
                                            alert('✅ Başarılı! Kontrol tamamlandı. Yeni mail varsa havuza düşmüştür.');
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
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
