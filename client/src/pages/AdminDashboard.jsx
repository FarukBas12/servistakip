import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ShoppingBag, Cloud, Sun, CloudRain, CloudSnow, Wind, Calendar, Plus, Check, X, Bell, ChevronLeft, ChevronRight, Camera, Save, Trash2 } from 'lucide-react';
import api from '../utils/api';

// Weather code mapping
// Weather code mapping with Animations
const getWeatherIcon = (code) => {
    // 0: Clear sky
    if (code === 0) return (
        <div className="weather-icon sun-animation">
            <Sun size={28} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 5px rgba(251, 191, 36, 0.5))' }} />
        </div>
    );
    // 1-3: Partly cloudy
    if (code >= 1 && code <= 3) return (
        <div className="weather-icon cloud-animation">
            <Cloud size={28} color="#94a3b8" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
        </div>
    );
    // 45, 48: Fog (Wind as placeholder)
    if (code === 45 || code === 48) return (
        <div className="weather-icon wind-animation">
            <Wind size={28} color="#94a3b8" />
        </div>
    );
    // 51-67: Drizzle / Rain
    if (code >= 51 && code <= 67) return (
        <div className="weather-icon rain-animation" style={{ position: 'relative' }}>
            <CloudRain size={28} color="#60a5fa" />
            <div className="rain-drop one"></div>
            <div className="rain-drop two"></div>
        </div>
    );
    // 71-77: Snow
    if (code >= 71 && code <= 77) return (
        <div className="weather-icon snow-animation" style={{ position: 'relative' }}>
            <CloudSnow size={28} color="#e2e8f0" />
            <div className="snow-flake one">❄</div>
            <div className="snow-flake two">❄</div>
        </div>
    );
    // 80-99: Showers / Thunderstorm
    if (code >= 80 && code <= 99) return (
        <div className="weather-icon storm-animation">
            <CloudRain size={28} color="#3b82f6" strokeWidth={2.5} />
        </div>
    );

    return <Wind size={28} color="#94a3b8" />;
};

const AdminDashboard = () => {
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

    // USER MANAGEMENT STATE
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({ username: '', password: '', role: 'technician', full_name: '', phone: '', start_date: new Date().toISOString().split('T')[0], photo_url: '' });
    const [photoUploading, setPhotoUploading] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showUserForm, setShowUserForm] = useState(false);

    useEffect(() => {
        fetchDashboardData();
        fetchUsers();
        fetchWeather();
        loadNotes();
        syncLocalNotes(); // Auto-migrate old local notes
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
    // SYNC LOCAL NOTES TO SERVER (MIGRATION)
    const syncLocalNotes = async () => {
        const local = localStorage.getItem('dashboard_notes');
        if (local) {
            try {
                const parsed = JSON.parse(local);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    let count = 0;
                    for (const n of parsed) {
                        await api.post('/calendar', {
                            date: n.date,
                            title: n.title,
                            description: n.description,
                            completed: n.completed
                        });
                        count++;
                    }
                    if (count > 0) alert(`${count} adet eski notunuz veritabanına taşındı.`);
                }
                localStorage.removeItem('dashboard_notes'); // Clear after sync
                loadNotes(); // Refresh from server
            } catch (err) {
                console.error('Local note sync failed', err);
            }
        }
    };

    // CALENDAR FUNCTIONS -- API INTEGRATED --
    const loadNotes = async () => {
        try {
            const res = await api.get('/calendar');
            setNotes(res.data);
        } catch (err) {
            console.error('Notes load error:', err);
        }
    };
    // saveNotes removed, using direct API calls


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

    const handleAddNote = async () => {
        if (!noteForm.title || !selectedDate) return;
        try {
            await api.post('/calendar', {
                date: selectedDate,
                title: noteForm.title,
                description: noteForm.description,
                completed: false
            });
            loadNotes();
            setNoteForm({ title: '', description: '' });
            setShowNoteModal(false);
        } catch (err) {
            alert('Not eklenirken hata: ' + err.message);
        }
    };

    const toggleNoteComplete = async (id, currentStatus) => {
        // Optimistic update or just wait for reload
        // We need currentStatus. If not passed, we might need to find it.
        // But UI calls this with id. 
        // Let's find the note to flip status
        const note = notes.find(n => n.id === id);
        if (!note) return;

        try {
            await api.put(`/calendar/${id}`, { completed: !note.completed });
            loadNotes();
        } catch (err) { console.error(err); }
    };

    const deleteNote = async (id) => {
        if (!confirm('Silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/calendar/${id}`);
            loadNotes();
        } catch (err) { alert('Silme hatası'); }
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

    const fetchUsers = async () => {
        try {
            const usersRes = await api.get('/auth/users');
            setUsers(usersRes.data);
        } catch (err) { console.error(err); }
    };

    // --- USER MANAGEMENT HANDLERS ---
    const handleEditUser = (user) => {
        setFormData({
            username: user.username,
            password: '',
            role: user.role,
            full_name: user.full_name || '',
            phone: user.phone || '',
            start_date: user.start_date ? user.start_date.split('T')[0] : '',
            photo_url: user.photo_url || ''
        });
        setEditingUser(user);
        setShowUserForm(true);
    };

    const resetForm = () => {
        setFormData({ username: '', password: '', role: 'technician', full_name: '', phone: '', start_date: new Date().toISOString().split('T')[0], photo_url: '' });
        setEditingUser(null);
        setShowUserForm(true); // Yeni eklemek için formu aç
    };

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

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                // Update
                const updateData = { ...formData };
                if (!updateData.password) delete updateData.password; // Şifre girilmediyse gönderme

                await api.put(`/auth/${editingUser.id}`, updateData);
                alert('Kullanıcı güncellendi!');
            } else {
                // Create
                await api.post('/auth/register', formData);
                alert('Kullanıcı oluşturuldu!');
            }
            resetForm();
            setShowUserForm(false);
            fetchUsers();
        } catch (err) {
            alert('İşlem başarısız: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
            try {
                await api.delete(`/auth/${id}`);
                fetchUsers();
                setShowUserForm(false);
            } catch (err) { alert('Silme başarısız'); }
        }
    };

    const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

    const { firstDay, daysInMonth } = getDaysInMonth(currentDate);
    const today = new Date();

    const roleCounts = {
        admin: users.filter(u => u.role === 'admin').length,
        technician: users.filter(u => u.role === 'technician').length,
        depocu: users.filter(u => u.role === 'depocu').length
    };

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
                <style>{`
                    /* Weather Animations */
                    .weather-icon {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 40px;
                        width: 40px;
                    }
                    
                    /* Sun Spin */
                    @keyframes spin-slow {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    .sun-animation svg {
                        animation: spin-slow 12s linear infinite;
                    }

                    /* Cloud Float */
                    @keyframes float {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-3px); }
                    }
                    .cloud-animation svg {
                        animation: float 3s ease-in-out infinite;
                    }

                    /* Rain Drop */
                    @keyframes rain-fall {
                        0% { transform: translateY(-5px); opacity: 0; }
                        50% { opacity: 1; }
                        100% { transform: translateY(5px); opacity: 0; }
                    }
                    .rain-animation .rain-drop {
                        position: absolute;
                        width: 2px;
                        height: 6px;
                        background: #60a5fa;
                        bottom: 0;
                        border-radius: 2px;
                        opacity: 0;
                    }
                    .rain-animation .rain-drop.one { left: 15px; animation: rain-fall 1s infinite 0.2s; }
                    .rain-animation .rain-drop.two { left: 25px; animation: rain-fall 1s infinite 0.7s; }

                    /* Snow Flake */
                    @keyframes snow-fall {
                        0% { transform: translateY(-5px) rotate(0deg); opacity: 0; }
                        50% { opacity: 1; }
                        100% { transform: translateY(5px) rotate(180deg); opacity: 0; }
                    }
                    .snow-animation .snow-flake {
                        position: absolute;
                        font-size: 10px;
                        color: white;
                        bottom: 0;
                        opacity: 0;
                    }
                    .snow-animation .snow-flake.one { left: 12px; animation: snow-fall 2s infinite 0s; }
                    .snow-animation .snow-flake.two { left: 24px; animation: snow-fall 2.5s infinite 1s; }

                    /* Wind/Fog Breeze */
                    @keyframes breeze {
                        0%, 100% { transform: translateX(0); }
                        50% { transform: translateX(3px); }
                    }
                    .wind-animation svg {
                        animation: breeze 2s ease-in-out infinite;
                    }
                    
                    /* Storm Flash */
                    @keyframes flash {
                        0%, 90%, 100% { filter: brightness(1); }
                        92%, 96% { filter: brightness(1.5) drop-shadow(0 0 10px yellow); }
                    }
                    .storm-animation svg {
                        animation: float 3s ease-in-out infinite, flash 5s infinite;
                    }
                `}</style>
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


                    {/* USER MANAGEMENT SECTION - SPLIT LAYOUT */}
                    <div style={{ marginBottom: '40px' }} id="user-form-section">
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 2fr', gap: '20px', height: '520px' }}>

                            {/* LEFT COLUMN: USER LIST */}
                            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, background: 'rgba(255, 255, 255, 0.02)' }}>
                                <div style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(34, 197, 94, 0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                        <h4 style={{ margin: 0, color: '#4ade80', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Users size={18} /> Personeller
                                        </h4>
                                        <button
                                            onClick={resetForm}
                                            title="Yeni Personel Ekle"
                                            style={{
                                                background: 'rgba(34, 197, 94, 0.2)',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '32px',
                                                height: '32px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#4ade80',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
                                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>Admin: {roleCounts.admin}</span>
                                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' }}>Tekn: {roleCounts.technician}</span>
                                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(234, 179, 8, 0.2)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.3)' }}>Depo: {roleCounts.depocu}</span>
                                    </div>
                                </div>
                                <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                                    {users.map(u => (
                                        <div
                                            key={u.id}
                                            onClick={() => handleEditUser(u)}
                                            style={{
                                                padding: '12px',
                                                marginBottom: '8px',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                background: editingUser?.id === u.id ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.03)',
                                                border: editingUser?.id === u.id ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid transparent',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                                                background: u.photo_url ? `url(${u.photo_url}) center/cover` : 'linear-gradient(135deg, #4ade80, #22c55e)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1rem', fontWeight: 'bold', color: 'white'
                                            }}>
                                                {!u.photo_url && (u.full_name ? u.full_name.charAt(0).toUpperCase() : u.username.charAt(0).toUpperCase())}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: editingUser?.id === u.id ? '#4ade80' : 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {u.full_name || u.username}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{
                                                        padding: '2px 6px', borderRadius: '4px',
                                                        background: u.role === 'admin' ? 'rgba(239, 68, 68, 0.2)' : u.role === 'depocu' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                                        color: u.role === 'admin' ? '#ef4444' : u.role === 'depocu' ? '#eab308' : '#3b82f6'
                                                    }}>
                                                        {u.role === 'admin' ? 'Admin' : u.role === 'depocu' ? 'Depocu' : 'Tekn.'}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} color={editingUser?.id === u.id ? '#4ade80' : '#555'} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* RIGHT COLUMN: FORM / DETAILS */}
                            <div className="glass-panel" style={{ padding: '0', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.02) 0%, rgba(34, 197, 94, 0.01) 100%)', border: '1px solid rgba(34, 197, 94, 0.1)', overflow: 'hidden' }}>
                                {showUserForm ? (
                                    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <h4 style={{ margin: 0, color: '#4ade80', fontSize: '1.1rem' }}>
                                                {editingUser ? 'Personel Bilgilerini Düzenle' : 'Yeni Personel Oluştur'}
                                            </h4>
                                        </div>

                                        <div style={{ flex: 1, overflowY: 'auto', padding: '25px' }}>
                                            <form onSubmit={handleUserSubmit}>
                                                <div style={{ display: 'flex', gap: '25px', marginBottom: '25px', flexWrap: 'wrap' }}>

                                                    {/* Photo Upload - Left Side of Form */}
                                                    <div style={{ width: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                        <div style={{
                                                            width: '120px', height: '120px', borderRadius: '50%',
                                                            background: formData.photo_url ? `url(${formData.photo_url}) center/cover` : 'rgba(255,255,255,0.05)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            border: '2px dashed rgba(74, 222, 128, 0.3)', marginBottom: '15px', overflow: 'hidden'
                                                        }}>
                                                            {!formData.photo_url && <Camera size={32} color="#4ade80" />}
                                                        </div>
                                                        <label style={{ cursor: 'pointer', color: '#4ade80', fontSize: '0.85rem', textAlign: 'center', width: '100%' }}>
                                                            <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                                                            <div className="glass-btn" style={{ justifyContent: 'center', padding: '8px', fontSize: '0.8rem' }}>
                                                                {photoUploading ? '...' : 'Fotoğraf Değiştir'}
                                                            </div>
                                                        </label>
                                                    </div>

                                                    {/* Fields - Right Side of Form */}
                                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', minWidth: '250px' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                            <div>
                                                                <label style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '4px', display: 'block' }}>Ad Soyad</label>
                                                                <input className="glass-input" name="full_name" value={formData.full_name} onChange={handleUserChange} style={{ padding: '10px', width: '100%' }} />
                                                            </div>
                                                            <div>
                                                                <label style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '4px', display: 'block' }}>Telefon</label>
                                                                <input className="glass-input" name="phone" value={formData.phone} onChange={handleUserChange} style={{ padding: '10px', width: '100%' }} />
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                            <div>
                                                                <label style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '4px', display: 'block' }}>Kullanıcı Adı</label>
                                                                <input className="glass-input" name="username" value={formData.username} onChange={handleUserChange} required style={{ padding: '10px', width: '100%' }} disabled={!!editingUser} />
                                                            </div>
                                                            <div>
                                                                <label style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '4px', display: 'block' }}>Şifre</label>
                                                                <input className="glass-input" name="password" type="password" placeholder={editingUser ? "Değiştirmek için girin" : "Şifre girin"} value={formData.password} onChange={handleUserChange} required={!editingUser} style={{ padding: '10px', width: '100%' }} />
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                            <div>
                                                                <label style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '4px', display: 'block' }}>Rol</label>
                                                                <select className="glass-input" name="role" value={formData.role} onChange={handleUserChange} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '10px', width: '100%' }}>
                                                                    <option value="technician" style={{ color: 'black' }}>Teknisyen</option>
                                                                    <option value="depocu" style={{ color: 'black' }}>Depocu</option>
                                                                    <option value="admin" style={{ color: 'black' }}>Admin</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '4px', display: 'block' }}>İşe Başlama Tarihi</label>
                                                                <input type="date" className="glass-input" name="start_date" value={formData.start_date} onChange={handleUserChange} style={{ padding: '10px', width: '100%' }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <button type="submit" className="glass-btn" style={{ background: 'rgba(34, 197, 94, 0.3)', justifyContent: 'center', padding: '12px', flex: 2 }}>
                                                        {editingUser ? <><Save size={18} style={{ marginRight: '8px' }} /> Değişiklikleri Kaydet</> : <><Plus size={18} style={{ marginRight: '8px' }} /> Personel Oluştur</>}
                                                    </button>
                                                    {editingUser && editingUser.username !== 'admin' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                handleDeleteUser(editingUser.id);
                                                                resetForm();
                                                                setShowUserForm(false);
                                                            }}
                                                            className="glass-btn"
                                                            style={{ background: 'rgba(239, 68, 68, 0.2)', justifyContent: 'center', padding: '12px', color: '#ef4444', flex: 1 }}
                                                        >
                                                            <Trash2 size={18} /> Sil
                                                        </button>
                                                    )}
                                                    <button type="button" onClick={() => setShowUserForm(false)} className="glass-btn" style={{ background: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', padding: '12px', flex: 1 }}>
                                                        İptal
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5, textAlign: 'center' }}>
                                        <div style={{
                                            width: '80px', height: '80px', borderRadius: '50%',
                                            background: 'rgba(34, 197, 94, 0.1)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            marginBottom: '20px'
                                        }}>
                                            <Users size={40} color="#4ade80" />
                                        </div>
                                        <h3 style={{ color: '#4ade80', marginBottom: '10px' }}>Personel Yönetimi</h3>
                                        <p style={{ maxWidth: '300px', fontSize: '0.9rem', color: '#aaa' }}>
                                            Listeden bir personel seçerek detaylarını görebilir veya düzenleyebilirsiniz.
                                        </p>
                                        <button
                                            onClick={resetForm}
                                            className="glass-btn"
                                            style={{ marginTop: '20px', padding: '10px 20px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }}
                                        >
                                            <Plus size={18} style={{ marginRight: '8px' }} /> Yeni Personel Ekle
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>


                    {/* ACTION BUTTONS */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '40px' }}>
                        <Link to="/admin/import-stores" className="glass-btn" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '180px', height: '140px', justifyContent: 'center', background: 'rgba(255, 193, 7, 0.2)' }}>
                            <ShoppingBag size={32} />
                            <span>Mağaza Yükle</span>
                        </Link>
                    </div>
                </div>
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
