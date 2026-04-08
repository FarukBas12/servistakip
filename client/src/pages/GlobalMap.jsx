import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { Truck, MapPin, Clock } from 'lucide-react';

// Create Custom Icons
const createMarkerIcon = (color) => L.divIcon({
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
    className: 'custom-pin',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

const carIcon = L.divIcon({
    html: `<div style="background: #2563eb; padding: 5px; border-radius: 8px; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; transform: rotate(0deg);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
           </div>`,
    className: 'custom-car',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

const ChangeView = ({ bounds }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [bounds, map]);
    return null;
};

const GlobalMap = () => {
    const [tasks, setTasks] = useState([]);
    const [techs, setTechs] = useState([]);
    const navigate = useNavigate();
    const [bounds, setBounds] = useState([]);

    const fetchData = async () => {
        try {
            // 1. Fetch Tasks
            const resTasks = await api.get('/tasks');
            const validTasks = resTasks.data.filter(t => t.lat && t.lng && t.status !== 'completed');
            setTasks(validTasks);

            // 2. Fetch Technicians
            const resUsers = await api.get('/auth/users');
            const validTechs = resUsers.data.filter(u => 
                u.role?.toLowerCase() === 'technician' && u.last_lat && u.last_lng
            );
            setTechs(validTechs);

            // 3. Update Bounds
            const allCoords = [
                ...validTasks.map(t => [parseFloat(t.lat), parseFloat(t.lng)]),
                ...validTechs.map(u => [parseFloat(u.last_lat), parseFloat(u.last_lng)])
            ];
            if (allCoords.length > 0) setBounds(allCoords);

        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Her 30 saniyede bir güncelle
        return () => clearInterval(interval);
    }, []);

    const getTaskColor = (createdAt) => {
        const days = Math.floor((new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24));
        if (days >= 4) return '#ef4444'; // Kırmızı (4+ gün)
        if (days >= 1) return '#f59e0b'; // Turuncu (1-3 gün)
        return '#10b981'; // Yeşil (Yeni)
    };

    return (
        <div style={{ height: 'calc(100vh - 80px)', width: '100%', position: 'relative', background: '#0f172a' }}>
            <div style={{ 
                position: 'absolute', top: '20px', left: '60px', zIndex: 9999, 
                display: 'flex', gap: '10px' 
            }}>
                <button onClick={() => navigate(-1)} className="glass-btn" style={{ background: '#fff', color: '#000' }}>&larr; Geri</button>
                <div style={{ background: 'rgba(0,0,0,0.7)', padding: '5px 15px', borderRadius: '20px', color: '#fff', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}></div> Gecikmiş</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }}></div> Bekleyen</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }}></div> Yeni</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: 15, height: 15, background: '#2563eb', border: '1px solid white', borderRadius: '4px' }}></div> Personel</span>
                </div>
            </div>

            <MapContainer center={[39, 35]} zoom={6} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; CARTO'
                />

                <ChangeView bounds={bounds} />

                {/* TASKS */}
                {tasks.map((task) => (
                    <Marker 
                        key={task.id} 
                        position={[parseFloat(task.lat), parseFloat(task.lng)]}
                        icon={createMarkerIcon(getTaskColor(task.created_at))}
                    >
                        <Popup>
                            <div style={{ padding: '5px' }}>
                                <h4 style={{ margin: '0 0 5px 0' }}>{task.title}</h4>
                                <p style={{ margin: '0 0 5px 0', fontSize: '12px' }}>{task.address}</p>
                                <div style={{ fontSize: '11px', opacity: 0.7 }}>
                                    Oluşturulma: {new Date(task.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* TECHNICIANS (CARS) */}
                {techs.map((tech) => (
                    <Marker 
                        key={tech.id} 
                        position={[parseFloat(tech.last_lat), parseFloat(tech.last_lng)]}
                        icon={carIcon}
                    >
                        <Popup>
                            <div style={{ textAlign: 'center' }}>
                                <strong style={{ color: '#2563eb' }}>{tech.username}</strong>
                                <div style={{ fontSize: '11px', marginTop: '5px' }}>
                                    Son Konum: {new Date(tech.last_location_update).toLocaleTimeString()}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default GlobalMap;
