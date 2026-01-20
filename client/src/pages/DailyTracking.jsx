import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../utils/api';
import L from 'leaflet';
import { Clock, CheckCircle2, PlayCircle } from 'lucide-react';

// Leaflet Icon Fix
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Internal component to handle view bounds
const ChangeView = ({ bounds }) => {
    const map = useMap();
    if (bounds && bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
    }
    return null;
};

const DailyTracking = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, completed: 0, active: 0 });
    const [bounds, setBounds] = useState([]);

    const fetchTodayTasks = async () => {
        try {
            const res = await api.get('/tasks');

            // Fix: Use local date for Turkey (UTC+3 friendly calculation)
            const now = new Date();
            const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            const todayTasks = res.data.filter(t => {
                if (!t.due_date) return false;
                return t.due_date.split('T')[0] === today;
            });

            setTasks(todayTasks);

            // Calculate bounds
            const validBounds = todayTasks
                .filter(t => t.lat && t.lng)
                .map(t => [parseFloat(t.lat), parseFloat(t.lng)]);

            setBounds(validBounds);

            const total = todayTasks.length;
            const completed = todayTasks.filter(t => t.status === 'completed').length;
            const active = todayTasks.filter(t => t.status === 'in_progress').length;

            setStats({ total, completed, active });
            setLoading(false);
        } catch (err) {
            console.error('Fetch error:', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTodayTasks();
        const interval = setInterval(fetchTodayTasks, 30000); // Auto-refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle2 size={18} color="#4caf50" />;
            case 'in_progress': return <PlayCircle size={18} color="#2196f3" />;
            default: return <Clock size={18} color="#ffb300" />;
        }
    };

    if (loading) return <div className="dashboard">Yükleniyor...</div>;

    return (
        <div className="dashboard" style={{ height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
            {/* KPI Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
                <div className="glass-panel" style={{ padding: '15px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Bugünkü İşler</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{stats.total}</div>
                </div>
                <div className="glass-panel" style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #4caf50' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Tamamlanan</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#4caf50' }}>{stats.completed}</div>
                </div>
                <div className="glass-panel" style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #2196f3' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Şu An Aktif</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2196f3' }}>{stats.active}</div>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', gap: '20px', minHeight: 0 }}>
                {/* Timeline Panel */}
                <div className="glass-panel" style={{ width: '350px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                        Canlı Akış
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                        {tasks.length === 0 ? (
                            <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '20px' }}>Bugün için planlanmış iş yok.</p>
                        ) : (
                            tasks.map(task => (
                                <div key={task.id} style={{
                                    padding: '12px',
                                    borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.03)',
                                    marginBottom: '10px',
                                    borderLeft: `4px solid ${task.status === 'completed' ? '#4caf50' : task.status === 'in_progress' ? '#2196f3' : '#ffb300'}`,
                                    cursor: 'pointer'
                                }}
                                    onClick={() => {
                                        // Could center map on this task if clicked
                                        if (task.lat && task.lng) setBounds([[parseFloat(task.lat), parseFloat(task.lng)]]);
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{task.title}</span>
                                        <span>{getStatusIcon(task.status)}</span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '5px' }}>
                                        📍 {task.address.substring(0, 40)}...
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                            👤 {task.assigned_user || 'Atanmadı'}
                                        </span>
                                        {task.cancel_count > 0 && <span style={{ color: '#ffb300', fontSize: '0.7rem' }}>⚠️ {task.cancel_count} İade</span>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Map Panel */}
                <div className="glass-panel" style={{ flex: 1, borderRadius: '24px', overflow: 'hidden', position: 'relative' }}>
                    <MapContainer center={[39.9334, 32.8597]} zoom={6} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap'
                        />
                        <ChangeView bounds={bounds} />
                        {tasks.filter(t => t.lat && t.lng).map(task => (
                            <Marker key={task.id} position={[parseFloat(task.lat), parseFloat(task.lng)]}>
                                <Popup>
                                    <div style={{ color: '#000' }}>
                                        <strong>{task.title}</strong><br />
                                        Durum: {task.status}<br />
                                        Personel: {task.assigned_user || 'Atanmadı'}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
};

export default DailyTracking;
