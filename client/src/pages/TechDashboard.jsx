import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { playNotificationSound } from '../utils/sound';
import { MapPin, Phone, Navigation, Calendar, Clock, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

const TechDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [lastCount, setLastCount] = useState(0);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'active', 'completed'

    const fetchTasks = async (playSound = false) => {
        try {
            const res = await api.get('/tasks');
            setTasks(res.data);

            // Notification Logic (only for new pending tasks)
            const pendingCount = res.data.filter(t => t.status === 'pending').length;
            if (playSound && pendingCount > lastCount && lastCount !== 0) {
                playNotificationSound();
            }
            if (pendingCount !== lastCount) {
                setLastCount(pendingCount);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchTasks(false);
        const interval = setInterval(() => { fetchTasks(true); }, 30000);
        return () => clearInterval(interval);
    }, [lastCount]);

    // Filter Logic
    const filteredTasks = tasks.filter(task => {
        if (activeTab === 'pending') return task.status === 'pending';
        if (activeTab === 'active') return task.status === 'in_progress';
        if (activeTab === 'completed') return task.status === 'completed';
        return false;
    });

    const handleCall = (e, task) => {
        e.preventDefault();
        // Simple regex to find phone numbers in description or use a designated field if it existed
        // For now, we'll try to trigger the dialer with a dummy or extracted number
        // In a real app, `customer_phone` would be a field.
        alert('Müşteri numarası kayıtlı değil. (Geliştirme aşaması)');
    };

    const handleNavigate = (e, task) => {
        e.preventDefault();
        if (task.maps_link) {
            window.open(task.maps_link, '_blank');
        } else {
            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.address)}`;
            window.open(url, '_blank');
        }
    };

    return (
        <div className="dashboard" style={{ paddingBottom: '80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1 style={{ margin: 0 }}>Saha Paneli</h1>
                <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                    {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </div>

            {/* TABS */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '10px',
                marginBottom: '20px',
                background: 'rgba(0,0,0,0.2)',
                padding: '5px',
                borderRadius: '12px'
            }}>
                {[
                    { id: 'pending', label: 'Bekleyen', icon: <AlertCircle size={16} /> },
                    { id: 'active', label: 'Aktif', icon: <Clock size={16} /> },
                    { id: 'completed', label: 'Biten', icon: <CheckCircle size={16} /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            background: activeTab === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                            border: 'none',
                            color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.5)',
                            padding: '10px',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                            fontSize: '0.8rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab.icon}
                        {tab.label}
                        <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                            ({tasks.filter(t => {
                                if (tab.id === 'pending') return t.status === 'pending';
                                if (tab.id === 'active') return t.status === 'in_progress';
                                if (tab.id === 'completed') return t.status === 'completed';
                            }).length})
                        </span>
                    </button>
                ))}
            </div>

            {/* TASK LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {filteredTasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                        <CheckCircle size={48} style={{ marginBottom: '10px' }} />
                        <p>Bu kategoride iş yok.</p>
                    </div>
                ) : filteredTasks.map(task => (
                    <div key={task.id} className="glass-panel" style={{
                        padding: '0', // Reset padding for custom layout
                        overflow: 'hidden',
                        borderLeft: task.status === 'in_progress' ? '5px solid #2196f3' :
                            task.status === 'pending' ? '5px solid #ffb300' : '5px solid #4caf50'
                    }}>
                        {/* HEADER */}
                        <div style={{ padding: '15px 15px 5px 15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '5px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>{task.title}</h3>
                                {task.due_date && (
                                    <span style={{ fontSize: '0.75rem', color: '#ffb74d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Calendar size={12} />
                                        {new Date(task.due_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'start', gap: '5px', opacity: 0.8, fontSize: '0.9rem', marginBottom: '10px' }}>
                                <MapPin size={16} style={{ minWidth: '16px', marginTop: '2px' }} />
                                <span>{task.address}</span>
                            </div>
                        </div>

                        {/* QUICK ACTIONS BAR */}
                        <div style={{
                            display: 'flex',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                            background: 'rgba(0,0,0,0.1)'
                        }}>
                            <button
                                onClick={(e) => handleNavigate(e, task)}
                                style={{
                                    flex: 1, border: 'none', background: 'transparent', color: '#64b5f6',
                                    padding: '12px', fontSize: '0.9rem', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                    borderRight: '1px solid rgba(255,255,255,0.05)'
                                }}
                            >
                                <Navigation size={18} /> Yol Tarifi
                            </button>
                            <Link
                                to={`/tech/task/${task.id}`}
                                style={{
                                    flex: 1, textDecoration: 'none', color: 'white',
                                    padding: '12px', fontSize: '0.9rem', fontWeight: 'bold',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                    background: 'rgba(255,255,255,0.05)'
                                }}
                            >
                                Detay <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TechDashboard;
