import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../utils/api';
import L from 'leaflet';
import { Clock, CheckCircle2, PlayCircle, Info } from 'lucide-react';

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

    // Modal state
    const [selectedTask, setSelectedTask] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

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

            if (validBounds.length > 0 && bounds.length === 0) {
                setBounds(validBounds);
            }

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

    const handleTaskClick = async (task) => {
        setDetailLoading(true);
        try {
            // Always fetch fresh details to get latest photos
            const res = await api.get(`/tasks/${task.id}`);
            setSelectedTask(res.data);
            setDetailLoading(false);

            // Allow bounds update if coordinates exist
            if (task.lat && task.lng) {
                setBounds([[parseFloat(task.lat), parseFloat(task.lng)]]);
            }
        } catch (err) {
            console.error(err);
            setDetailLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return '#4caf50'; // Green - Bitti
            case 'in_progress': return '#f44336'; // Red - Devam Ediyor
            default: return '#ffb300'; // Yellow - Beklemede
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'completed': return 'Bitti';
            case 'in_progress': return 'Devam Ediyor';
            default: return 'Beklemede';
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
                <div className="glass-panel" style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #f44336' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Şu An Aktif</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#f44336' }}>{stats.active}</div>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', gap: '20px', minHeight: 0 }}>
                {/* Timeline Panel */}
                <div className="glass-panel" style={{ width: '400px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold' }}>Canlı Akış</span>
                        <div style={{ fontSize: '0.7rem', display: 'flex', gap: '8px' }}>
                            <span style={{ color: '#ffb300' }}>● Beklemede</span>
                            <span style={{ color: '#f44336' }}>● Devam Ediyor</span>
                            <span style={{ color: '#4caf50' }}>● Bitti</span>
                        </div>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                        {tasks.filter(t => t.status !== 'completed').length === 0 ? (
                            <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '20px' }}>Aktif iş kalmadı.</p>
                        ) : (
                            tasks.filter(t => t.status !== 'completed').map(task => {
                                const statusColor = getStatusColor(task.status);
                                const statusText = getStatusText(task.status);
                                return (
                                    <div key={task.id} style={{
                                        padding: '12px',
                                        borderRadius: '12px',
                                        background: 'rgba(255,255,255,0.03)',
                                        marginBottom: '10px',
                                        borderLeft: `5px solid ${statusColor}`,
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                        onClick={() => handleTaskClick(task)}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{task.title}</span>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                background: statusColor,
                                                color: 'white', // Ensure contrast
                                                padding: '3px 8px',
                                                borderRadius: '10px',
                                                fontWeight: 'bold'
                                            }}>
                                                {statusText}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            📍 {task.address.substring(0, 40)}...
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                                👤 {task.assigned_user || 'Atanmadı'}
                                            </span>
                                            {task.cancel_count > 0 && <span style={{ color: '#ffb300', fontSize: '0.7rem' }}>⚠️ {task.cancel_count} İade</span>}
                                        </div>
                                    </div>
                                );
                            })
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
                                        Durum: {getStatusText(task.status)}<br />
                                        Personel: {task.assigned_user || 'Atanmadı'}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </div>

            {/* Detail Modal */}
            {(selectedTask || detailLoading) && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.85)', zIndex: 2000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '600px', padding: '30px', maxHeight: '90vh', overflowY: 'auto' }}>
                        {detailLoading ? (
                            <p style={{ textAlign: 'center' }}>Canlı veriler yükleniyor...</p>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <div>
                                        <h3 style={{ margin: 0 }}>İş Detayı</h3>
                                        <span style={{
                                            fontSize: '0.8rem',
                                            color: getStatusColor(selectedTask.status),
                                            fontWeight: 'bold'
                                        }}>
                                            {getStatusText(selectedTask.status)}
                                        </span>
                                    </div>
                                    <button onClick={() => setSelectedTask(null)} className="glass-btn" style={{ padding: '5px 12px' }}>Kapat</button>
                                </div>

                                <div style={{ display: 'grid', gap: '15px' }}>
                                    {/* Service Information Header */}
                                    {selectedTask.service_form_no && (
                                        <div style={{ background: 'rgba(33, 150, 243, 0.1)', padding: '15px', borderRadius: '10px' }}>
                                            <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Servis Formu No</label>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{selectedTask.service_form_no}</div>
                                        </div>
                                    )}

                                    <div>
                                        <label style={{ opacity: 0.5, fontSize: '0.8rem' }}>Başlık</label>
                                        <div>{selectedTask.title}</div>
                                    </div>
                                    <div>
                                        <label style={{ opacity: 0.5, fontSize: '0.8rem' }}>Adres</label>
                                        <div>{selectedTask.address}</div>
                                    </div>
                                    <div>
                                        <label style={{ opacity: 0.5, fontSize: '0.8rem' }}>Açıklama</label>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                                            {selectedTask.description || 'Açıklama girilmemiş.'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '20px' }}>
                                        <div>
                                            <label style={{ opacity: 0.5, fontSize: '0.8rem' }}>Personel</label>
                                            <div>{selectedTask.assigned_user || '—'}</div>
                                        </div>
                                        <div>
                                            <label style={{ opacity: 0.5, fontSize: '0.8rem' }}>Tarih</label>
                                            <div>{new Date(selectedTask.due_date).toLocaleDateString()}</div>
                                        </div>
                                    </div>

                                    {/* Photos Section */}
                                    <div style={{ marginTop: '10px' }}>
                                        <label style={{ opacity: 0.8, fontSize: '0.9rem', display: 'block', marginBottom: '10px' }}>📸 Fotoğraflar (Canlı)</label>
                                        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                                            {selectedTask.photos && selectedTask.photos.length > 0 ? (
                                                selectedTask.photos.map(p => (
                                                    <div key={p.id} style={{ position: 'relative', flexShrink: 0 }}>
                                                        <a href={p.url} target="_blank" rel="noopener noreferrer">
                                                            <img src={p.url} alt={p.type} style={{ height: '100px', borderRadius: '8px', border: p.type === 'service_form' ? '2px solid #2196f3' : '1px solid rgba(255,255,255,0.2)' }} />
                                                        </a>
                                                        {p.type === 'service_form' && <span style={{ position: 'absolute', bottom: 5, left: 5, background: '#2196f3', color: 'white', fontSize: '9px', padding: '2px 5px', borderRadius: '4px' }}>Servis Formu</span>}
                                                    </div>
                                                ))
                                            ) : (
                                                <p style={{ opacity: 0.5, fontStyle: 'italic', fontSize: '0.9rem' }}>Henüz fotoğraf yüklenmemiş.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyTracking;
