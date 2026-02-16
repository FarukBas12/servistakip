import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ShoppingBag, Cloud, Sun, CloudRain, CloudSnow, Wind, Calendar, Check, Bell, Activity, ClipboardList, Wrench, Wallet, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import api from '../utils/api';

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

            const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=3`);
            const wData = await wRes.json();
            setWeather(wData.daily);
        } catch (e) { console.log('Weather err'); }
    };

    const loadNotes = async () => {
        try { const res = await api.get('/calendar'); setNotes(res.data.filter(n => !n.completed)); } catch (e) { }
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

    const getWeatherIcon = (code) => {
        if (code === 0) return <Sun size={24} color="#fbbf24" />;
        if (code >= 1 && code <= 3) return <Cloud size={24} color="#94a3b8" />;
        if (code >= 51) return <CloudRain size={24} color="#60a5fa" />;
        return <Cloud size={24} color="#94a3b8" />;
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
                    background: isToday ? 'rgba(33, 150, 243, 0.3)' : 'transparent',
                    border: isToday ? '1px solid rgba(33, 150, 243, 0.5)' : 'none',
                    color: isToday ? '#2196f3' : 'white',
                    fontWeight: isToday ? 'bold' : 'normal',
                    transition: 'background 0.2s'
                }}
                    onMouseEnter={e => !isToday && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
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

    return (
        <div className="dashboard fade-in">
            <h1 style={{ marginBottom: '10px', fontSize: '2rem', background: 'linear-gradient(90deg, #fff, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Genel Bakış
            </h1>
            <p style={{ color: '#666', marginBottom: '30px' }}>Sistem durumu ve özet raporlar</p>

            {/* KPI WIDGETS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '15px', background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(33, 150, 243, 0.02))', border: '1px solid rgba(33, 150, 243, 0.2)' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(33, 150, 243, 0.2)', color: '#2196f3' }}><Activity size={24} /></div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>{stats.activeTasks}</div>
                        <div style={{ color: '#888', fontSize: '0.9rem' }}>Sahadaki İşler</div>
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '15px', background: 'linear-gradient(135deg, rgba(255, 167, 38, 0.1), rgba(255, 167, 38, 0.02))', border: '1px solid rgba(255, 167, 38, 0.2)' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255, 167, 38, 0.2)', color: '#ffa726' }}><ClipboardList size={24} /></div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>{stats.pendingTasks}</div>
                        <div style={{ color: '#888', fontSize: '0.9rem' }}>Bekleyen İşler</div>
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '15px', background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.1), rgba(74, 222, 128, 0.02))', border: '1px solid rgba(74, 222, 128, 0.2)' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(74, 222, 128, 0.2)', color: '#4ade80' }}><Wallet size={24} /></div>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>₺{stats.totalStock.toLocaleString('tr-TR')}</div>
                        <div style={{ color: '#888', fontSize: '0.9rem' }}>Tahmini Stok</div>
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '15px', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(168, 85, 247, 0.02))', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' }}><Users size={24} /></div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>{stats.technicians}</div>
                        <div style={{ color: '#888', fontSize: '0.9rem' }}>Aktif Teknisyen</div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>

                {/* CALENDAR WIDGET */}
                <div className="glass-panel" style={{ padding: '25px', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}>📅 Takvim</h3>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <button onClick={prevMonth} className="icon-btn"><ChevronLeft size={20} /></button>
                            <span style={{ fontWeight: 'bold', minWidth: '100px', textAlign: 'center' }}>
                                {currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
                            </span>
                            <button onClick={nextMonth} className="icon-btn"><ChevronRight size={20} /></button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', textAlign: 'center', fontSize: '0.8rem', color: '#888', marginBottom: '10px' }}>
                        <div>Pzt</div><div>Sal</div><div>Çar</div><div>Per</div><div>Cum</div><div>Cmt</div><div>Paz</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
                        {renderCalendar()}
                    </div>
                    <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#666', marginTop: '15px' }}>Not eklemek için bir güne tıklayın.</p>
                </div>

                {/* NOTES WIDGET - SORTED & COLORED */}
                <div className="glass-panel" style={{ padding: '25px', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}>📌 Yaklaşan Notlar</h3>
                        <Link to="/admin/daily-report" className="glass-btn" style={{ fontSize: '0.8rem', padding: '5px 10px' }}>Tümünü Gör</Link>
                    </div>
                    {sortedNotes.length === 0 ? (
                        <p style={{ color: '#666', fontStyle: 'italic' }}>Hiç not bulunmuyor.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                            {sortedNotes.slice(0, 5).map(n => {
                                const color = getNoteColor(n.date);
                                return (
                                    <div key={n.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'center', borderLeft: `3px solid ${color}` }}>
                                        <div style={{ background: '#333', padding: '5px 10px', borderRadius: '6px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#888' }}>{new Date(n.date).toLocaleString('tr-TR', { month: 'short' })}</div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1rem', color }}>{new Date(n.date).getDate()}</div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 500 }}>{n.title}</div>
                                            {n.description && <div style={{ fontSize: '0.8rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>{n.description}</div>}
                                        </div>
                                        <button onClick={() => handleDeleteNote(n.id)} className="icon-btn" style={{ color: '#ef5350', opacity: 0.5 }}><Trash2 size={14} /></button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* WEATHER WIDGET */}
                <div className="glass-panel" style={{ padding: '25px', borderRadius: '16px' }}>
                    <h3 style={{ margin: '0 0 20px 0' }}>🌤️ Hava Durumu ({cityName})</h3>
                    {weather ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                            {weather.time.map((t, i) => (
                                <div key={t} style={{ flex: 1, textAlign: 'center', padding: '15px 5px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>{new Date(t).toLocaleDateString('tr-TR', { weekday: 'short' })}</div>
                                    {getWeatherIcon(weather.weather_code[i])}
                                    <div style={{ marginTop: '10px', fontWeight: 'bold' }}>
                                        {Math.round(weather.temperature_2m_max[i])}° <span style={{ color: '#666', fontSize: '0.8rem' }}>{Math.round(weather.temperature_2m_min[i])}°</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p>Yükleniyor...</p>}
                </div>
            </div>

            {/* NEW NOTE MODAL */}
            {showNoteModal && (
                <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', padding: '30px', background: '#1e1e1e', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <button onClick={() => setShowNoteModal(false)} style={{ position: 'absolute', top: 15, right: 15, background: 'transparent', border: 'none', color: '#666', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        <h3 style={{ marginBottom: '20px' }}>Yeni Not Ekle ({new Date(selectedDate).toLocaleDateString('tr-TR')})</h3>
                        <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input className="glass-input" autoFocus placeholder="Başlık" value={newNote.title} onChange={e => setNewNote({ ...newNote, title: e.target.value })} required style={{ padding: '12px' }} />
                            <textarea className="glass-input" rows="3" placeholder="Açıklama" value={newNote.description} onChange={e => setNewNote({ ...newNote, description: e.target.value })} style={{ padding: '12px' }} />
                            <button type="submit" className="glass-btn primary-btn" style={{ padding: '12px' }}>Kaydet</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
