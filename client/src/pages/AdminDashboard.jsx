import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ShoppingBag, TrendingUp, Lock, Database, Save, Trash2, LayoutDashboard, Settings, Cloud, Sun, CloudRain, CloudSnow, Wind, Calendar, Plus, Check, X, Bell, ChevronLeft, ChevronRight, Camera, Edit2, Phone, User } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../utils/api';

// Weather code mapping
const getWeatherIcon = (code) => {
    if (code === 0) return <Sun size={24} color="#fbbf24" />;
    if (code >= 1 && code <= 3) return <Cloud size={24} color="#94a3b8" />;
    if (code >= 51 && code <= 67) return <CloudRain size={24} color="#60a5fa" />;
    if (code >= 71 && code <= 77) return <CloudSnow size={24} color="#e2e8f0" />;
    if (code >= 80 && code <= 99) return <CloudRain size={24} color="#3b82f6" />;
    return <Wind size={24} color="#94a3b8" />;
};

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    // DASHBOARD STATE
    const [stocks, setStocks] = useState([]);
    const [totalValue, setTotalValue] = useState(0);
    const [categoryData, setCategoryData] = useState([]);

    // WEATHER STATE
    const [weather, setWeather] = useState(null);
    const [cityName, setCityName] = useState('Konum alınıyor...');
    const [weatherLoading, setWeatherLoading] = useState(true);

    // CALENDAR STATE
    const [currentDate, setCurrentDate] = useState(new Date());
    const [notes, setNotes] = useState([]);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [noteForm, setNoteForm] = useState({ title: '', description: '' });
    const [alerts, setAlerts] = useState([]);

    // SETTINGS STATE
    const [password, setPassword] = useState('');
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({ username: '', password: '', role: 'technician', full_name: '', phone: '', start_date: new Date().toISOString().split('T')[0], photo_url: '' });
    const [photoUploading, setPhotoUploading] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

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
        fetchWeather();
        loadNotes();
    }, []);

    useEffect(() => {
        checkAlerts();
    }, [notes]);

    // WEATHER FUNCTIONS
    const fetchWeatherByCoords = async (latitude, longitude) => {
        try {
            // Get city name from coordinates
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const geoData = await geoRes.json();
            setCityName(geoData.address?.city || geoData.address?.town || geoData.address?.county || 'Bilinmeyen');
        } catch { setCityName('Konum'); }

        // Get 5-day weather
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`);
        const weatherData = await weatherRes.json();
        setWeather(weatherData.daily);
        setWeatherLoading(false);
    };

    const fetchWeatherByIP = async () => {
        try {
            // Get location from IP
            const ipRes = await fetch('https://ipapi.co/json/');
            const ipData = await ipRes.json();
            if (ipData.latitude && ipData.longitude) {
                setCityName(ipData.city || 'Bilinmeyen');
                await fetchWeatherByCoords(ipData.latitude, ipData.longitude);
            } else {
                // Fallback: Istanbul
                setCityName('İstanbul (varsayılan)');
                await fetchWeatherByCoords(41.0082, 28.9784);
            }
        } catch {
            // Fallback: Istanbul
            setCityName('İstanbul (varsayılan)');
            await fetchWeatherByCoords(41.0082, 28.9784);
        }
    };

    const fetchWeather = async () => {
        try {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        await fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
                    },
                    async () => {
                        // Location denied - try IP-based
                        await fetchWeatherByIP();
                    },
                    { timeout: 5000 }
                );
            } else {
                await fetchWeatherByIP();
            }
        } catch (err) {
            console.error('Weather error:', err);
            setWeatherLoading(false);
        }
    };

    // CALENDAR FUNCTIONS
    const loadNotes = () => {
        const saved = localStorage.getItem('dashboard_notes');
        if (saved) setNotes(JSON.parse(saved));
    };

    const saveNotes = (newNotes) => {
        localStorage.setItem('dashboard_notes', JSON.stringify(newNotes));
        setNotes(newNotes);
    };

    const checkAlerts = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const activeAlerts = notes.filter(note => {
            if (note.completed) return false;
            const noteDate = new Date(note.date);
            noteDate.setHours(0, 0, 0, 0);
            return noteDate <= tomorrow;
        }).map(note => {
            const noteDate = new Date(note.date);
            noteDate.setHours(0, 0, 0, 0);
            const isToday = noteDate.getTime() === today.getTime();
            const isPast = noteDate < today;
            return { ...note, isToday: isToday || isPast, isTomorrow: noteDate.getTime() === tomorrow.getTime() };
        });

        setAlerts(activeAlerts);
    };

    const handleAddNote = () => {
        if (!noteForm.title || !selectedDate) return;
        const newNote = {
            id: Date.now(),
            date: selectedDate,
            title: noteForm.title,
            description: noteForm.description,
            completed: false
        };
        saveNotes([...notes, newNote]);
        setNoteForm({ title: '', description: '' });
        setShowNoteModal(false);
    };

    const toggleNoteComplete = (id) => {
        const updated = notes.map(n => n.id === id ? { ...n, completed: !n.completed } : n);
        saveNotes(updated);
    };

    const deleteNote = (id) => {
        saveNotes(notes.filter(n => n.id !== id));
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        return { firstDay: firstDay === 0 ? 6 : firstDay - 1, daysInMonth };
    };

    const hasNote = (day) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return notes.some(n => n.date === dateStr && !n.completed);
    };

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

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

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setPhotoUploading(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('photo', file);
            const res = await api.post('/auth/upload-photo', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData({ ...formData, photo_url: res.data.url });
        } catch (err) {
            alert('Fotoğraf yüklenemedi: ' + (err.response?.data?.message || err.message));
        }
        setPhotoUploading(false);
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', formData);
            alert('Kullanıcı oluşturuldu!');
            setFormData({ username: '', password: '', role: 'technician', full_name: '', phone: '', start_date: new Date().toISOString().split('T')[0], photo_url: '' });
            fetchSettingsData();
        } catch (err) { alert('Hata: Kullanıcı oluşturulamadı.'); }
    };

    const calculateWorkDuration = (startDate) => {
        if (!startDate) return '-';
        const start = new Date(startDate);
        const now = new Date();
        const diffTime = Math.abs(now - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const years = Math.floor(diffDays / 365);
        const months = Math.floor((diffDays % 365) / 30);
        if (years > 0) return `${years} yıl ${months} ay`;
        if (months > 0) return `${months} ay`;
        return `${diffDays} gün`;
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
    const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

    const { firstDay, daysInMonth } = getDaysInMonth(currentDate);
    const today = new Date();

    return (
        <div className="dashboard">
            {/* ALERTS */}
            {alerts.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    {alerts.map(alert => (
                        <div key={alert.id} style={{
                            padding: '12px 20px',
                            marginBottom: '10px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: alert.isToday ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                            border: `1px solid ${alert.isToday ? 'rgba(239, 68, 68, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Bell size={20} color={alert.isToday ? '#ef4444' : '#eab308'} />
                                <div>
                                    <div style={{ fontWeight: 'bold', color: alert.isToday ? '#ef4444' : '#eab308' }}>
                                        {alert.isToday ? '🔴 BUGÜN' : '🟡 YARIN'}: {alert.title}
                                    </div>
                                    {alert.description && <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>{alert.description}</div>}
                                </div>
                            </div>
                            <button onClick={() => toggleNoteComplete(alert.id)} style={{
                                background: 'rgba(34, 197, 94, 0.2)',
                                border: '1px solid rgba(34, 197, 94, 0.4)',
                                borderRadius: '8px',
                                padding: '8px 16px',
                                color: '#22c55e',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <Check size={16} /> Tamamlandı
                            </button>
                        </div>
                    ))}
                </div>
            )}

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

                        {/* WEATHER & CALENDAR ROW */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                            {/* 5-DAY WEATHER */}
                            <div className="glass-panel" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.02) 100%)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                    <Cloud size={20} color="#60a5fa" />
                                    <span style={{ fontWeight: 'bold', color: '#60a5fa' }}>5 Günlük Hava Durumu</span>
                                    <span style={{ marginLeft: 'auto', fontSize: '0.85rem', opacity: 0.7 }}>📍 {cityName}</span>
                                </div>
                                {weatherLoading ? (
                                    <div style={{ textAlign: 'center', padding: '20px', opacity: 0.6 }}>Yükleniyor...</div>
                                ) : weather ? (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                        {weather.time.map((date, i) => (
                                            <div key={date} style={{
                                                flex: 1,
                                                textAlign: 'center',
                                                padding: '10px 5px',
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: '10px'
                                            }}>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '8px' }}>
                                                    {new Date(date).toLocaleDateString('tr-TR', { weekday: 'short' })}
                                                </div>
                                                {getWeatherIcon(weather.weather_code[i])}
                                                <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                                                    <span style={{ color: '#ef4444' }}>{Math.round(weather.temperature_2m_max[i])}°</span>
                                                    <span style={{ opacity: 0.5 }}> / </span>
                                                    <span style={{ color: '#60a5fa' }}>{Math.round(weather.temperature_2m_min[i])}°</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', opacity: 0.6 }}>Hava durumu alınamadı</div>
                                )}
                            </div>

                            {/* MINI CALENDAR */}
                            <div className="glass-panel" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(168, 85, 247, 0.02) 100%)', borderColor: 'rgba(168, 85, 247, 0.2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Calendar size={20} color="#a855f7" />
                                        <span style={{ fontWeight: 'bold', color: '#a855f7' }}>Takvim & Notlar</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}><ChevronLeft size={18} /></button>
                                        <span style={{ fontSize: '0.9rem' }}>{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                                        <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}><ChevronRight size={18} /></button>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
                                    {DAYS.map(day => <div key={day} style={{ fontSize: '0.7rem', opacity: 0.5, padding: '4px' }}>{day}</div>)}
                                    {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
                                    {Array(daysInMonth).fill(null).map((_, i) => {
                                        const day = i + 1;
                                        const isToday = today.getDate() === day && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
                                        const noteExists = hasNote(day);
                                        return (
                                            <button
                                                key={day}
                                                onClick={() => {
                                                    setSelectedDate(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
                                                    setShowNoteModal(true);
                                                }}
                                                style={{
                                                    padding: '6px',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    background: isToday ? '#a855f7' : noteExists ? 'rgba(168, 85, 247, 0.3)' : 'transparent',
                                                    color: isToday ? '#fff' : '#ccc',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem',
                                                    position: 'relative'
                                                }}
                                            >
                                                {day}
                                                {noteExists && !isToday && <span style={{ position: 'absolute', top: '2px', right: '2px', width: '5px', height: '5px', borderRadius: '50%', background: '#a855f7' }} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>


                        {/* ACTION BUTTONS */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '40px' }}>
                            <Link to="/admin/create-user" className="glass-btn" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '180px', height: '140px', justifyContent: 'center', background: 'rgba(33, 150, 243, 0.2)' }}>
                                <Users size={32} />
                                <span>Personel Ekle</span>
                                <span style={{ fontSize: '0.75rem', opacity: 0.7, background: 'rgba(33, 150, 243, 0.3)', padding: '2px 10px', borderRadius: '10px' }}>
                                    {users.length} Personel
                                </span>
                            </Link>
                            <Link to="/admin/import-stores" className="glass-btn" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '180px', height: '140px', justifyContent: 'center', background: 'rgba(255, 193, 7, 0.2)' }}>
                                <ShoppingBag size={32} />
                                <span>Mağaza Yükle</span>
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
                                            alert('Kontrol ediliyor...');
                                            const res = await api.post('/subs/settings/test-email');
                                            alert(`✅ Test Tamamlandı! Bulunan: ${res.data.details?.total || 0}, Oluşturulan: ${res.data.details?.processed || 0}`);
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
                                <Users size={20} /> Personel Yönetimi
                            </h3>

                            {/* NEW USER FORM */}
                            <div className="glass-panel" style={{ padding: '25px', marginBottom: '30px', background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(34, 197, 94, 0.02) 100%)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                <h4 style={{ marginBottom: '20px', color: '#4ade80', fontSize: '1rem' }}>+ Yeni Personel Ekle</h4>
                                <form onSubmit={handleCreateUser}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                        {/* Photo Upload */}
                                        <div style={{ gridColumn: 'span 1', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <div style={{
                                                width: '100px', height: '100px', borderRadius: '50%',
                                                background: formData.photo_url ? `url(${formData.photo_url}) center/cover` : 'rgba(255,255,255,0.1)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                border: '3px dashed rgba(74, 222, 128, 0.3)', marginBottom: '10px', overflow: 'hidden'
                                            }}>
                                                {!formData.photo_url && <Camera size={32} color="#4ade80" />}
                                            </div>
                                            <label style={{ cursor: 'pointer', color: '#4ade80', fontSize: '0.85rem' }}>
                                                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                                                {photoUploading ? '⏳ Yükleniyor...' : '📷 Fotoğraf Seç'}
                                            </label>
                                        </div>

                                        {/* Form Fields */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <input className="glass-input" name="full_name" placeholder="Ad Soyad" value={formData.full_name} onChange={handleUserChange} style={{ padding: '12px' }} />
                                            <input className="glass-input" name="phone" placeholder="Telefon (05xx xxx xx xx)" value={formData.phone} onChange={handleUserChange} style={{ padding: '12px' }} />
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <input className="glass-input" name="username" placeholder="Kullanıcı Adı (giriş için)" value={formData.username} onChange={handleUserChange} required style={{ padding: '12px' }} />
                                            <input className="glass-input" name="password" type="password" placeholder="Şifre" value={formData.password} onChange={handleUserChange} required style={{ padding: '12px' }} />
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '4px', display: 'block' }}>İşe Başlama Tarihi</label>
                                                <input type="date" className="glass-input" name="start_date" value={formData.start_date} onChange={handleUserChange} style={{ padding: '12px' }} />
                                            </div>
                                            <select className="glass-input" name="role" value={formData.role} onChange={handleUserChange} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '12px' }}>
                                                <option value="technician" style={{ color: 'black' }}>Teknisyen</option>
                                                <option value="depocu" style={{ color: 'black' }}>Depocu</option>
                                                <option value="admin" style={{ color: 'black' }}>Admin</option>
                                            </select>
                                        </div>
                                    </div>

                                    <button type="submit" className="glass-btn" style={{ background: 'rgba(34, 197, 94, 0.3)', justifyContent: 'center', marginTop: '20px', padding: '14px' }}>
                                        <Plus size={18} style={{ marginRight: '8px' }} /> Personel Oluştur
                                    </button>
                                </form>
                            </div>

                            {/* USER LIST - CARD VIEW */}
                            <h4 style={{ marginBottom: '15px', color: '#aaa', fontSize: '0.9rem' }}>Kayıtlı Personeller ({users.length})</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                                {users.map(u => (
                                    <div key={u.id} className="glass-panel" style={{
                                        padding: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '15px',
                                        background: u.status === 'active' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                                        opacity: u.status === 'active' ? 1 : 0.6
                                    }}>
                                        {/* Avatar */}
                                        <div style={{
                                            width: '60px', height: '60px', borderRadius: '50%', flexShrink: 0,
                                            background: u.photo_url ? `url(${u.photo_url}) center/cover` : 'linear-gradient(135deg, #4ade80, #22c55e)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.5rem', fontWeight: 'bold', color: 'white'
                                        }}>
                                            {!u.photo_url && (u.full_name ? u.full_name.charAt(0).toUpperCase() : u.username.charAt(0).toUpperCase())}
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '4px' }}>
                                                {u.full_name || u.username}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '6px' }}>
                                                @{u.username} • <span style={{
                                                    padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem',
                                                    background: u.role === 'admin' ? 'rgba(239, 68, 68, 0.2)' : u.role === 'depocu' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                                    color: u.role === 'admin' ? '#ef4444' : u.role === 'depocu' ? '#eab308' : '#3b82f6'
                                                }}>
                                                    {u.role === 'admin' ? 'Admin' : u.role === 'depocu' ? 'Depocu' : 'Teknisyen'}
                                                </span>
                                            </div>
                                            {u.phone && <div style={{ fontSize: '0.75rem', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {u.phone}</div>}
                                            {u.start_date && <div style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '4px' }}>⏱️ {calculateWorkDuration(u.start_date)}</div>}
                                        </div>

                                        {/* Actions */}
                                        {u.username !== 'admin' && (
                                            <button onClick={() => handleDeleteUser(u.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6, padding: '8px' }} title="Sil">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
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

                            {/* DATABASE MIGRATION */}
                            <div>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981' }}>
                                    <Database size={20} /> Veritabanı Güncelleme
                                </h3>
                                <div className="glass-panel" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
                                    <p style={{ opacity: 0.7, marginBottom: '15px', fontSize: '0.9rem' }}>Personel tablosuna yeni alanları (fotoğraf, telefon, vb.) ekler. Sadece bir kez çalıştırın.</p>
                                    <button onClick={async () => {
                                        try {
                                            await api.post('/auth/migrate');
                                            alert('✅ Veritabanı güncellendi! Yeni personel alanları eklendi.');
                                            fetchSettingsData();
                                        } catch (err) {
                                            alert('❌ Hata: ' + (err.response?.data || err.message));
                                        }
                                    }} className="glass-btn" style={{ background: '#10b981', width: '100%', justifyContent: 'center' }}>
                                        <Database size={18} style={{ marginRight: '10px' }} /> Migration Çalıştır
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* NOTE MODAL */}
            {showNoteModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div className="glass-panel" style={{ padding: '30px', width: '400px', maxWidth: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: '#a855f7' }}>📝 Not Ekle - {selectedDate}</h3>
                            <button onClick={() => setShowNoteModal(false)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <input
                            className="glass-input"
                            placeholder="Başlık"
                            value={noteForm.title}
                            onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                            style={{ width: '100%', marginBottom: '15px' }}
                        />
                        <textarea
                            className="glass-input"
                            placeholder="Açıklama (opsiyonel)"
                            value={noteForm.description}
                            onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })}
                            style={{ width: '100%', minHeight: '80px', marginBottom: '20px', resize: 'vertical' }}
                        />
                        <button onClick={handleAddNote} className="glass-btn" style={{ background: '#a855f7', width: '100%', justifyContent: 'center' }}>
                            <Plus size={18} style={{ marginRight: '8px' }} /> Not Ekle
                        </button>

                        {/* Notes for this date */}
                        {notes.filter(n => n.date === selectedDate).length > 0 && (
                            <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                                <h4 style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '10px' }}>Bu Tarihteki Notlar:</h4>
                                {notes.filter(n => n.date === selectedDate).map(note => (
                                    <div key={note.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px',
                                        background: note.completed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.03)',
                                        borderRadius: '8px',
                                        marginBottom: '8px'
                                    }}>
                                        <div style={{ textDecoration: note.completed ? 'line-through' : 'none', opacity: note.completed ? 0.5 : 1 }}>
                                            <div style={{ fontWeight: 'bold' }}>{note.title}</div>
                                            {note.description && <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{note.description}</div>}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => toggleNoteComplete(note.id)} style={{ background: 'none', border: 'none', color: note.completed ? '#22c55e' : '#aaa', cursor: 'pointer' }}>
                                                <Check size={18} />
                                            </button>
                                            <button onClick={() => deleteNote(note.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
