import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Activity, ClipboardList, ChevronLeft, ChevronRight, Trash2, LayoutDashboard, Eye, EyeOff } from 'lucide-react';

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
            const [tasksRes, usersRes, stockRes] = await Promise.all([
                api.get('/tasks'),
                api.get('/auth/users'),
                api.get('/stock-tracking')
            ]);

            const tasks = tasksRes.data;
            const users = usersRes.data;
            const stocks = stockRes.data;

            // Calc Total Stock Value
            let stockVal = 0;
            stocks.forEach(s => stockVal += (parseFloat(s.quantity) * parseFloat(s.purchase_price || 0)));

            setStats({
                activeTasks: tasks.filter(t => t.status === 'in_progress').length,
                pendingTasks: tasks.filter(t => t.status === 'open').length,
                totalStock: stockVal,
                technicians: users.filter(u => u.role === 'technician').length
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

            // Format weather data
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

            // Filter for today's notes that haven't been dismissed in this session
            const todayStr = new Date().toISOString().split('T')[0];
            const alerts = allNotes.filter(n => n.date.startsWith(todayStr));
            setTodayNotes(alerts);
        } catch (e) { }
    };

    const handleDayClick = (day) => {
        const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
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
            loadNotes(); // Refresh to remove completed
        } catch (err) { alert('Güncellenemedi'); }
    };

    const handleDismissAlert = (id) => {
        setTodayNotes(todayNotes.filter(n => n.id !== id));
    };

    // Sorting & Coloring Logic
    const sortedNotes = [...notes].sort((a, b) => new Date(a.date) - new Date(b.date));

    const getNoteColor = (dateStr) => {
        const today = new Date();
        const target = new Date(dateStr);
        const diffTime = target - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return '#666'; // Past
        if (diffDays <= 3) return '#ef5350'; // Red (Urgent)
        if (diffDays <= 7) return '#ffa726'; // Orange (Soon)
        return '#66bb6a'; // Green (Safe)
    };

    // Calendar Helpers
    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay(); // 0 = Sun

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const startDay = firstDay === 0 ? 6 : firstDay - 1; // Adjust for Monday start

        const days = [];
        // Empty slots
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} style={{ height: '40px' }}></div>);
        }
        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), i).toISOString().split('T')[0];
            const hasNote = notes.some(n => n.date && n.date.startsWith(dateStr));
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

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
                {/* Widget Visibility Control */}
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

            {/* KPI WIDGETS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '20px', marginBottom: '30px' }}>
                <StatCard
                    icon={Activity}
                    title="Sahadaki İşler"
                    value={stats.activeTasks}
                    color="#2196f3"
                    gradient={['rgba(33, 150, 243, 0.1)', 'rgba(33, 150, 243, 0.02)', 'rgba(33, 150, 243, 0.2)', 'rgba(33, 150, 243, 0.2)']}
                />
                <StatCard
                    icon={ClipboardList}
                    title="Bekleyen İşler"
                    value={stats.pendingTasks}
                    color="#ffa726"
                    gradient={['rgba(255, 167, 38, 0.1)', 'rgba(255, 167, 38, 0.02)', 'rgba(255, 167, 38, 0.2)', 'rgba(255, 167, 38, 0.2)']}
                />
                <StatCard
                    icon={Users}
                    title="Aktif Teknisyen"
                    value={stats.technicians}
                    color="#a855f7"
                    gradient={['rgba(168, 85, 247, 0.1)', 'rgba(168, 85, 247, 0.02)', 'rgba(168, 85, 247, 0.2)', 'rgba(168, 85, 247, 0.2)']}
                />
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
