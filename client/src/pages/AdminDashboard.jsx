import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Activity, ClipboardList, ChevronLeft, ChevronRight, Trash2, LayoutDashboard, Eye, EyeOff, DollarSign, Wallet, Briefcase, BarChart2 } from 'lucide-react';

import api from '../utils/api';
import StatCard from '../components/Dashboard/StatCard';
import WeatherWidget from '../components/Dashboard/WeatherWidget';
import CalendarWidget from '../components/Dashboard/CalendarWidget';
import NotesWidget from '../components/Dashboard/NotesWidget';
import NoteAlert from '../components/Dashboard/NoteAlert';

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeTasks: 0,
        pendingTasks: 0,
        totalStock: 0,
        technicians: 0
    });

    const [projectStats, setProjectStats] = useState({
        activeTotalTender: 0,
        activeTotalReceived: 0,
        monthlyCompleted: []
    });

    const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0) + ' TL';

    // Weather & Notes State
    const [weather, setWeather] = useState(null);
    const [cityName, setCityName] = useState('..');
    const [notes, setNotes] = useState([]);
    const [todayNotes, setTodayNotes] = useState([]);

    // Widget visibility
    const [widgets, setWidgets] = useState(() => {
        try { return JSON.parse(localStorage.getItem('dashWidgets')) || { calendar: true, notes: true, weather: true }; }
        catch { return { calendar: true, notes: true, weather: true }; }
    });
    const [showWidgetMenu, setShowWidgetMenu] = useState(false);

    const toggleWidget = (key) => {
        const next = { ...widgets, [key]: !widgets[key] };
        setWidgets(next);
        localStorage.setItem('dashWidgets', JSON.stringify(next));
    };

    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null); // For modal
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [newNote, setNewNote] = useState({ title: '', description: '' });

    useEffect(() => {
        fetchDashboardData();
        fetchWeather();
        loadNotes();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [tasksRes, usersRes, stockRes, projectsRes] = await Promise.all([
                api.get('/tasks'),
                api.get('/auth/users'),
                api.get('/stock-tracking'),
                api.get('/projects')
            ]);

            const tasks = tasksRes.data;
            const users = usersRes.data;
            const stocks = stockRes.data;
            const projects = projectsRes.data;

            // --- FİNANSAL PROJE HESAPLAMALARI ---
            let activeTotalTender = 0;
            let activeTotalReceived = 0;
            const monthlyCompleted = {}; 

            projects.forEach(p => {
                const tender = parseFloat(p.tender_price) || 0;
                const received = parseFloat(p.progress_payment) || 0;

                if (p.status !== 'completed') {
                    activeTotalTender += tender;
                    activeTotalReceived += received;
                } else {
                    const d = p.end_date ? new Date(p.end_date) : new Date(p.created_at || Date.now());
                    const monthName = d.toLocaleString('tr-TR', { month: 'long', year: 'numeric' }); 
                    
                    if (!monthlyCompleted[monthName]) {
                        monthlyCompleted[monthName] = { tender: 0, received: 0, rawDate: d };
                    }
                    monthlyCompleted[monthName].tender += tender;
                    monthlyCompleted[monthName].received += received;
                }
            });

            const sortedMonthly = Object.entries(monthlyCompleted)
                .sort((a,b) => b[1].rawDate - a[1].rawDate)
                .map(e => ({ month: e[0], ...e[1] }));

            setProjectStats({
                activeTotalTender,
                activeTotalReceived,
                monthlyCompleted: sortedMonthly
            });

            // --- YENİ KPI HESAPLAMALARI ---
            const now = new Date();
            const getDaysDiff = (dateStr) => {
                const date = new Date(dateStr);
                const diffTime = Math.abs(now - date);
                return Math.floor(diffTime / (1000 * 60 * 60 * 24));
            };

            const mailTasks = tasks.filter(t => (t.source === 'email' || t.status === 'pending') && t.status !== 'completed' && t.status !== 'cancelled');
            const criticalTasks = tasks.filter(t => 
                (t.status === 'open' || t.status === 'pending' || t.status === 'assigned') && 
                getDaysDiff(t.created_at) >= 4
            );
            const standardPending = tasks.filter(t => 
                (t.status === 'open' || t.status === 'pending') && 
                getDaysDiff(t.created_at) < 4 && getDaysDiff(t.created_at) >= 0
            );
            const assignedTasks = tasks.filter(t => t.status === 'assigned' || (t.assigned_to && t.status === 'open'));
            const retryTasks = tasks.filter(t => t.status === 'cancelled' && t.is_retry);

            setStats({
                mailCount: mailTasks.length,
                pendingCount: standardPending.length,
                urgentCount: criticalTasks.length,
                assignedCount: assignedTasks.length,
                retryCount: retryTasks.length
            });
            setLoading(false);
        } catch (err) { console.error(err); setLoading(false); }
    };

    const fetchWeather = async () => {
        try {
            const ipRes = await fetch('https://ipapi.co/json/');
            const ipData = await ipRes.json();
            const lat = ipData.latitude || 41.0082;
            const lon = ipData.longitude || 28.9784;
            setCityName(ipData.city || 'İstanbul');

            const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relative_humidity_2m,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4`);
            const wData = await wRes.json();

            setWeather({
                current: wData.current_weather,
                daily: wData.daily,
                humidity: wData.hourly.relative_humidity_2m[0],
                wind: wData.hourly.wind_speed_10m[0]
            });
        } catch (e) { console.log('Weather err'); }
    };

    const loadNotes = async () => {
        try {
            const res = await api.get('/calendar');
            const allNotes = res.data.filter(n => !n.completed);
            setNotes(allNotes);

            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const alerts = allNotes.filter(n => n.date && n.date.startsWith(todayStr));
            setTodayNotes(alerts);
        } catch (e) { }
    };

    const handleDayClick = (day) => {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        setSelectedDate(dateStr);
        setNewNote({ title: '', description: '' });
        setShowNoteModal(true);
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        try {
            await api.post('/calendar', {
                ...newNote,
                date: selectedDate,
                type: 'note'
            });
            setShowNoteModal(false);
            loadNotes();
        } catch (err) { alert('Hata'); }
    };

    const handleDeleteNote = async (id) => {
        if (!confirm('Silinsin mi?')) return;
        try {
            await api.delete(`/calendar/${id}`);
            loadNotes();
        } catch (err) { alert('Hata'); }
    };

    const handleCompleteNote = async (id) => {
        try {
            await api.put(`/calendar/${id}`, { completed: true });
            loadNotes(); 
        } catch (err) { alert('Güncellenemedi'); }
    };

    const handleDismissAlert = (id) => {
        setTodayNotes(todayNotes.filter(n => n.id !== id));
    };

    const sortedNotes = [...notes].sort((a, b) => new Date(a.date) - new Date(b.date));

    const getNoteColor = (dateStr) => {
        const today = new Date();
        const target = new Date(dateStr);
        const diffTime = target - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return '#666'; 
        if (diffDays <= 3) return '#ef5350'; 
        if (diffDays <= 7) return '#ffa726'; 
        return '#66bb6a'; 
    };

    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay(); 

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const startDay = firstDay === 0 ? 6 : firstDay - 1; 

        const days = [];
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} style={{ height: '40px' }}></div>);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const hasNote = notes.some(n => n.date && n.date.startsWith(dateStr));
            
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const isToday = todayStr === dateStr;

            days.push(
                <div key={i} onClick={() => handleDayClick(i)} style={{
                    height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '8px', cursor: 'pointer', position: 'relative',
                    background: isToday ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                    border: isToday ? '1px solid rgba(99, 102, 241, 0.5)' : 'none',
                    color: isToday ? 'var(--primary)' : 'var(--text-primary)',
                    fontWeight: isToday ? 'bold' : 'normal',
                    transition: 'all 0.2s'
                }}
                    onMouseEnter={e => !isToday && (e.currentTarget.style.background = 'var(--glass-surface)')}
                    onMouseLeave={e => !isToday && (e.currentTarget.style.background = 'transparent')}
                >
                    {i}
                    {hasNote && <div style={{ position: 'absolute', bottom: '5px', width: '4px', height: '4px', borderRadius: '50%', background: '#ffa726' }}></div>}
                </div>
            );
        }
        return days;
    };

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    if (loading) return <div className="dashboard">Yükleniyor...</div>;

    return (
        <div className="dashboard fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ marginBottom: '5px', fontSize: '2.4rem', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        Genel Bakış
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Sistem durumu ve özet raporlar</p>
                </div>
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowWidgetMenu(v => !v)}
                        className="glass-btn"
                        style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                        title="Widget görünürlüğü"
                    >
                        <LayoutDashboard size={16} /> Widget'lar
                    </button>
                    {showWidgetMenu && (
                        <div className="glass-panel" style={{ position: 'absolute', right: 0, top: '44px', zIndex: 100, padding: '12px', minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[{ key: 'calendar', label: 'Takvim' }, { key: 'notes', label: 'Notlar' }, { key: 'weather', label: 'Hava Durumu' }].map(w => (
                                <button key={w.key} onClick={() => toggleWidget(w.key)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: '6px 8px', borderRadius: '8px', fontSize: '0.88rem', width: '100%', textAlign: 'left' }}>
                                    {widgets[w.key] ? <Eye size={16} color="var(--primary)" /> : <EyeOff size={16} color="var(--text-secondary)" />}
                                    {w.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <NoteAlert
                notes={todayNotes}
                onComplete={handleCompleteNote}
                onClose={handleDismissAlert}
            />
            
            {/* KPI WIDGETS - 5 YENİ KATEGORİ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                <StatCard
                    icon={ClipboardList}
                    title="Mail Kontrol"
                    value={stats.mailCount}
                    color="#2196f3"
                    gradient={['rgba(33, 150, 243, 0.1)', 'rgba(33, 150, 243, 0.05)']}
                />
                <StatCard
                    icon={Activity}
                    title="1-3 Günlük"
                    value={stats.pendingCount}
                    color="#fbbf24"
                    gradient={['rgba(251, 191, 36, 0.1)', 'rgba(251, 191, 36, 0.05)']}
                />
                <StatCard
                    icon={Activity}
                    title="🚨 ACİL (4+ GÜN)"
                    value={stats.urgentCount}
                    color="#ef4444"
                    pulse={stats.urgentCount > 0}
                    gradient={['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.05)']}
                />
                <StatCard
                    icon={Users}
                    title="Atanan / Bekleyen"
                    value={stats.assignedCount}
                    color="#a855f7"
                    gradient={['rgba(168, 85, 247, 0.1)', 'rgba(168, 85, 247, 0.05)']}
                />
                <StatCard
                    icon={Trash2}
                    title="İptal / Tekrar"
                    value={stats.retryCount}
                    color="#f97316"
                    gradient={['rgba(249, 115, 22, 0.1)', 'rgba(249, 115, 22, 0.05)']}
                />
            </div>

            {/* FİNANSAL PROJE YÖNETİMİ BÖLÜMÜ */}
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '15px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Briefcase size={22} color="#10b981" /> Finansal Durum & Projeler
                </h3>
                
                {/* AKTİF PROJELER KARTLARI */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                    <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #3b82f6', display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                        <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '10px' }}>
                            <Briefcase size={24} color="#3b82f6" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Bekleyen İhale Toplamı (Aktif)</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{formatCurrency(projectStats.activeTotalTender)}</div>
                        </div>
                    </div>
                    <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #f59e0b', display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                        <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '10px' }}>
                            <DollarSign size={24} color="#f59e0b" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Tahsil Edilecek Kalan Bütçe</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{formatCurrency(projectStats.activeTotalTender - projectStats.activeTotalReceived)}</div>
                        </div>
                    </div>
                </div>

                {/* BİTEN İŞLER AYLIK TABLO */}
                {projectStats.monthlyCompleted.length > 0 && (
                    <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
                        <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BarChart2 size={18} color="#8b5cf6" /> Biten İşler Aylık Tablosu
                        </h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontWeight: '600' }}>Ay / Yıl</th>
                                    <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontWeight: '600' }}>Toplam Sözleşme (İhale)</th>
                                    <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontWeight: '600' }}>Gerçekleşen (Hakediş)</th>
                                    <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontWeight: '600' }}>Durum</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projectStats.monthlyCompleted.map((m, i) => {
                                    const diff = m.received - m.tender;
                                    let durumRender;
                                    if (diff > 0) {
                                        durumRender = <span style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>+{formatCurrency(diff)} (Ek İş/Fazla)</span>;
                                    } else if (diff < 0) {
                                        durumRender = <span style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>{formatCurrency(diff)} (Kayıp/Kesinti)</span>;
                                    } else {
                                        durumRender = <span style={{ color: '#a855f7', background: 'rgba(168, 85, 247, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>Denk Kapanış</span>;
                                    }

                                    return (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{m.month}</td>
                                            <td style={{ padding: '12px 10px' }}>{formatCurrency(m.tender)}</td>
                                            <td style={{ padding: '12px 10px' }}>{formatCurrency(m.received)}</td>
                                            <td style={{ padding: '12px 10px' }}>{durumRender}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MAIN CONTENT GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(350px, 100%), 1fr))', gap: '20px' }}>
                {widgets.calendar && <CalendarWidget currentDate={currentDate} prevMonth={prevMonth} nextMonth={nextMonth} renderCalendar={renderCalendar} />}
                {widgets.notes && <NotesWidget sortedNotes={sortedNotes} getNoteColor={getNoteColor} handleDeleteNote={handleDeleteNote} />}
                {widgets.weather && <WeatherWidget weather={weather} cityName={cityName} />}
            </div>

            {/* NEW NOTE MODAL */}
            {showNoteModal && (
                <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', padding: '30px', position: 'relative' }}>
                        <button onClick={() => setShowNoteModal(false)} style={{ position: 'absolute', top: 15, right: 15, background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        <h3 style={{ marginBottom: '20px' }}>Yeni Not Ekle ({new Date(selectedDate).toLocaleDateString('tr-TR')})</h3>
                        <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input className="glass-input" autoFocus placeholder="Başlık" value={newNote.title} onChange={e => setNewNote({ ...newNote, title: e.target.value })} required style={{ padding: '12px' }} />
                            <textarea className="glass-input" rows="3" placeholder="Açıklama" value={newNote.description} onChange={e => setNewNote({ ...newNote, description: e.target.value })} style={{ padding: '12px' }} />
                            <button type="submit" className="glass-btn glass-btn-primary" style={{ padding: '12px', width: '100%' }}>Kaydet</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
