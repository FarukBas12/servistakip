import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';

// Fix for default marker icon in React-Leaflet
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

const GlobalMap = () => {
    const [tasks, setTasks] = useState([]);
    const navigate = useNavigate();
    const [bounds, setBounds] = useState([]);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await api.get('/tasks');
                // Filter tasks that have valid coordinates
                const validTasks = res.data.filter(t => t.lat && t.lng);
                setTasks(validTasks);

                if (validTasks.length > 0) {
                    const b = validTasks.map(t => [parseFloat(t.lat), parseFloat(t.lng)]);
                    setBounds(b);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchTasks();
    }, []);

    // Default center (Turkey approximate)
    const defaultPosition = [39.9334, 32.8597];

    const handleBack = () => {
        if (window.location.pathname.includes('/tech')) {
            navigate('/tech');
        } else {
            navigate('/admin');
        }
    };

    return (
        <div style={{ height: 'calc(100vh - 80px)', width: '100%', position: 'relative' }}>
            <button
                onClick={handleBack}
                className="glass-btn"
                style={{ position: 'absolute', top: '20px', left: '60px', zIndex: 9999, background: 'rgba(255,255,255,0.9)', color: 'black' }}
            >
                &larr; Geri Dön
            </button>

            <MapContainer center={defaultPosition} zoom={6} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                <ChangeView bounds={bounds} />

                {tasks.map((task) => (
                    <Marker key={task.id} position={[parseFloat(task.lat), parseFloat(task.lng)]}>
                        <Popup>
                            <div style={{ minWidth: '150px' }}>
                                <h3 style={{ margin: '0 0 5px 0' }}>{task.title}</h3>
                                <p style={{ margin: '0 0 5px 0' }}>{task.address}</p>
                                <strong style={{
                                    color: task.status === 'completed' ? 'red' : task.status === 'in_progress' ? 'green' : '#d4ac0d'
                                }}>
                                    {task.status === 'in_progress' ? 'Aktif' : task.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'}
                                </strong>
                                <br />
                                {task.assigned_user && <small>Atanan: {task.assigned_user}</small>}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default GlobalMap;
