import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const TaskCreate = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        address: '',
        due_date: '',
        assigned_to: '',
        maps_link: '',
    });
    // New state for file attachments
    const [files, setFiles] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get('/auth/users');
                // Filter only technicians
                setUsers(res.data.filter(u => u.role === 'technician'));
            } catch (err) {
                console.error(err);
            }
        };
        fetchUsers();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFiles(e.target.files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // 1. Create Task
            const res = await api.post('/tasks', formData);
            const taskId = res.data.id;

            // 2. Upload Photos (if any)
            if (files && files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    const fileData = new FormData();
                    fileData.append('photo', files[i]);
                    fileData.append('type', 'admin_attachment'); // Mark as admin upload

                    // Optional: Send dummy GPS for now as it's required by backend schema usually
                    fileData.append('gps_lat', 0);
                    fileData.append('gps_lng', 0);

                    await api.post(`/tasks/${taskId}/photos`, fileData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                }
            }

            navigate('/admin');
        } catch (err) {
            console.error(err);
            alert('Failed to create task');
        }
    };

    const handleGeocode = async (addressToSearch) => {
        // Legacy: Just fills coordinates in backend if needed, but we removed visual map
        // Keeping it simple: Maybe just find maps link?
        // Actually user said "address text and link part stay".
        // Let's keep a simple "Find Link" feature if they want
        if (!addressToSearch) return alert('Lütfen önce bir adres girin.');

        // ... (Same logic but just set maps_link if empty)
        try {
            // Smart Clean
            let cleanAddr = addressToSearch
                .replace(/Pafta\s*[:\d\.]+/gi, '')
                .replace(/Ada\s*[:\d\.]+/gi, '')
                .replace(/Parsel\s*[:\d\.]+/gi, '')
                .replace(/No\s*[:\d\/]+/gi, '')
                .replace(/\s+/g, ' ')
                .trim();
            const query = cleanAddr.toLowerCase().includes('türkiye') ? cleanAddr : `${cleanAddr}, Türkiye`;

            const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const geoData = await geoRes.json();

            if (geoData && geoData.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    maps_link: `https://www.google.com/maps?q=${geoData[0].lat},${geoData[0].lon}`
                }));
            } else {
                alert('Otomatik link bulunamadı, lütfen elle girin.');
            }
        } catch (e) { console.log(e); }
    };

    const handleStoreCodeBlur = async (e) => {
        const code = e.target.value;
        if (!code) return;

        try {
            const res = await api.get(`/stores/${code}`);
            const store = res.data;
            setFormData({
                ...formData,
                title: store.name,
                address: store.address,
                description: `Mağaza Kodu: ${store.code}`
            });
            // Auto find link
            handleGeocode(store.address);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                // alert('Mağaza kodu bulunamadı!'); // Don't annoy if just typing
            }
        }
    };

    const handleLinkChange = (e) => {
        setFormData({ ...formData, maps_link: e.target.value });
    };

    return (
        <div className="dashboard">
            <button onClick={() => navigate('/admin')} className="glass-btn" style={{ marginBottom: '1rem' }}>&larr; Geri</button>
            <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
                <h2 style={{ marginTop: 0 }}>Yeni Görev Oluştur</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.3)' }}>
                        <small style={{ display: 'block', marginBottom: '5px' }}>🚀 Otomatik Doldurma</small>
                        <input
                            className="glass-input"
                            placeholder="Mağaza Kodu Gir (Örn: A101-1234) ve Çık"
                            onBlur={handleStoreCodeBlur}
                            style={{ border: '1px solid #4CAF50' }}
                        />
                    </div>

                    <input className="glass-input" name="title" placeholder="Görev Başlığı / Mağaza Adı" value={formData.title} onChange={handleChange} required />
                    <textarea className="glass-input" name="description" placeholder="Açıklama" value={formData.description} onChange={handleChange} rows="3" />

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input className="glass-input" name="address" placeholder="Adres (Metin)" value={formData.address} onChange={handleChange} required style={{ flex: 1 }} />
                        <button type="button" onClick={() => handleGeocode(formData.address)} className="glass-btn" style={{ background: 'rgba(33, 150, 243, 0.3)', whiteSpace: 'nowrap' }}>📍 Link Bul</button>
                    </div>

                    <input className="glass-input" name="maps_link" value={formData.maps_link} placeholder="Google Maps Linki (Opsiyonel)" onChange={handleLinkChange} />

                    <label>Ekler / Fotoğraflar (Kroki, Arıza Fotosu vb.)</label>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="glass-input"
                        style={{ padding: '10px' }}
                    />
                    <small style={{ opacity: 0.7 }}>Birden fazla dosya seçebilirsiniz.</small>

                    <label>Son Tarih</label>
                    <input className="glass-input" name="due_date" type="datetime-local" onChange={handleChange} />

                    <label>Personel Ata (Opsiyonel)</label>
                    <select className="glass-input" name="assigned_to" onChange={handleChange} style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                        <option value="" style={{ color: 'black' }}>-- Havuza Bırak --</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id} style={{ color: 'black' }}>{u.username}</option>
                        ))}
                    </select>

                    <button type="submit" className="glass-btn" style={{ marginTop: '10px', background: 'rgba(76, 175, 80, 0.3)' }}>
                        {files.length > 0 ? `Görevi Oluştur ve ${files.length} Dosya Yükle` : 'Görevi Oluştur'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TaskCreate;

// Fix Leaflet Default Icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to fly to new location when address is found
const MapRecenter = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) map.flyTo([lat, lng], 15);
    }, [lat, lng, map]);
    return null;
};

// Component to handle map clicks
const LocationMarker = ({ position, setPosition }) => {
    useMapEvents({
        click(e) {
            setPosition(e.latlng.lat, e.latlng.lng);
        },
    });

    return position ? <Marker position={position}></Marker> : null;
};

const TaskCreate = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        address: '',
        due_date: '',
        assigned_to: '',
        maps_link: '',
        lat: 38.4192, // Default Izmir
        lng: 27.1287
    });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get('/auth/users');
                // Filter only technicians
                setUsers(res.data.filter(u => u.role === 'technician'));
            } catch (err) {
                console.error(err);
            }
        };
        fetchUsers();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tasks', formData);
            navigate('/admin');
        } catch (err) {
            alert('Failed to create task');
        }
    };

    const handleMapClick = (lat, lng) => {
        setFormData(prev => ({
            ...prev,
            lat: lat,
            lng: lng,
            maps_link: `https://www.google.com/maps?q=${lat},${lng}`
        }));
    };

    const handleGeocode = async (addressToSearch) => {
        if (!addressToSearch) return alert('Lütfen önce bir adres girin.');

        try {
            // Smart Clean: Remove "Pafta", "Ada", "Parsel" and complex "No:" patterns that confuse Nominatim
            // Example: "X Mah. Y Sok. No:1/13 Pafta:53 Ada:387..." -> "X Mah. Y Sok."
            let cleanAddr = addressToSearch
                .replace(/Pafta\s*[:\d\.]+/gi, '')
                .replace(/Ada\s*[:\d\.]+/gi, '')
                .replace(/Parsel\s*[:\d\.]+/gi, '')
                .replace(/No\s*[:\d\/]+/gi, '') // Remove door numbers if they are complex (optional, but helps generic search)
                .replace(/\s+/g, ' ')
                .trim();

            // Trick: Append "Türkiye" to help the geocoder focus on the country
            const query = cleanAddr.toLowerCase().includes('türkiye') ? cleanAddr : `${cleanAddr}, Türkiye`;

            console.log(`Geocoding Query: ${query}`); // Debug

            const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const geoData = await geoRes.json();

            if (geoData && geoData.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    lat: geoData[0].lat,
                    lng: geoData[0].lon,
                    maps_link: `https://www.google.com/maps?q=${geoData[0].lat},${geoData[0].lon}`
                }));
            } else {
                alert(`Adres tam bulunamadı.\n\nAranan: "${cleanAddr}"\n\nİpucu: "Mahalle, İlçe, İl" olarak sadeleştirip tekrar deneyin veya aşağıdaki HARİTADAN seçin.`);
            }
        } catch (err) {
            console.error(err);
            alert('Harita servisine erişilemedi (İnternet bağlantınızı kontrol edin).');
        }
    };

    const handleStoreCodeBlur = async (e) => {
        const code = e.target.value;
        if (!code) return;

        try {
            // 1. Get Store Info from Backend
            const res = await api.get(`/stores/${code}`);
            const store = res.data;

            // Update form with basic info first
            const newFormData = {
                ...formData,
                title: store.name,
                address: store.address,
                description: `Mağaza Kodu: ${store.code}`
            };
            setFormData(newFormData);

            // 2. Auto Geocode
            handleGeocode(store.address);

        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 404) {
                alert('Mağaza kodu bulunamadı!');
            }
        }
    };

    const handleLinkChange = (e) => {
        const link = e.target.value;
        setFormData({ ...formData, maps_link: link });

        // Try to extract Lat/Lng from link
        // Supports: "q=38.4,27.1" OR "@38.4,27.1"
        const regex = /[@?&]q=([-0-9.]+),([-0-9.]+)|@([-0-9.]+),([-0-9.]+)/;
        const match = link.match(regex);

        if (match) {
            const newLat = parseFloat(match[1] || match[3]);
            const newLng = parseFloat(match[2] || match[4]);

            if (!isNaN(newLat) && !isNaN(newLng)) {
                setFormData(prev => ({
                    ...prev,
                    maps_link: link,
                    lat: newLat,
                    lng: newLng
                }));
            }
        }
    };

    return (
        <div className="dashboard">
            <button onClick={() => navigate('/admin')} className="glass-btn" style={{ marginBottom: '1rem' }}>&larr; Geri</button>
            <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
                <h2 style={{ marginTop: 0 }}>Yeni Görev Oluştur</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.3)' }}>
                        <small style={{ display: 'block', marginBottom: '5px' }}>🚀 Otomatik Doldurma</small>
                        <input
                            className="glass-input"
                            placeholder="Mağaza Kodu Gir (Örn: A101-1234) ve Çık"
                            onBlur={handleStoreCodeBlur}
                            style={{ border: '1px solid #4CAF50' }}
                        />
                    </div>

                    <input className="glass-input" name="title" placeholder="Görev Başlığı / Mağaza Adı" value={formData.title} onChange={handleChange} required />
                    <textarea className="glass-input" name="description" placeholder="Açıklama" value={formData.description} onChange={handleChange} rows="3" />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input className="glass-input" name="address" placeholder="Adres (Metin)" value={formData.address} onChange={handleChange} required style={{ flex: 1 }} />
                        <button type="button" onClick={() => handleGeocode(formData.address)} className="glass-btn" style={{ background: 'rgba(33, 150, 243, 0.3)', whiteSpace: 'nowrap' }}>📍 Bul</button>
                    </div>

                    <label>Konum (Pini Düzeltmek İçin Haritaya Tıklayın)</label>
                    <div style={{ height: '300px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.3)', marginBottom: '1rem' }}>
                        <MapContainer
                            center={[parseFloat(formData.lat) || 38.4237, parseFloat(formData.lng) || 27.1428]}
                            zoom={13}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; OpenStreetMap contributors'
                            />
                            {/* Update center when form data changes */}
                            <MapRecenter lat={formData.lat} lng={formData.lng} />

                            {/* Handle clicks */}
                            <LocationMarker
                                position={formData.lat && formData.lng ? [formData.lat, formData.lng] : null}
                                setPosition={handleMapClick}
                            />
                        </MapContainer>
                    </div>
                    {/* Hidden Coordinates */}
                    <input type="hidden" name="lat" value={formData.lat} />
                    <input type="hidden" name="lng" value={formData.lng} />

                    <input className="glass-input" name="maps_link" value={formData.maps_link} placeholder="Google Maps Linki Yapıştır -> Otomatik Pinler" onChange={handleLinkChange} />

                    <label>Son Tarih</label>
                    <input className="glass-input" name="due_date" type="datetime-local" onChange={handleChange} />

                    <label>Personel Ata (Opsiyonel)</label>
                    <select className="glass-input" name="assigned_to" onChange={handleChange} style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                        <option value="" style={{ color: 'black' }}>-- Havuza Bırak --</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id} style={{ color: 'black' }}>{u.username}</option>
                        ))}
                    </select>

                    <button type="submit" className="glass-btn" style={{ marginTop: '10px', background: 'rgba(76, 175, 80, 0.3)' }}>Görevi Oluştur</button>
                </form>
            </div>
        </div>
    );
};

export default TaskCreate;
