import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const redPinIcon = L.divIcon({
    html: `<div style="background-color: #ef4444; width: 14px; height: 14px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.5); cursor: pointer;"></div>`,
    className: 'custom-pin',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

const MapRelocator = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 16); // Yakınlaştırarak zıpla
        }
    }, [center, map]);
    return null;
};

const DraggableMarker = ({ position, setPosition }) => {
    useMapEvents({
        click(e) {
            setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
            toast.success("Konum nokta atışı güncellendi!", {id: 'drag-toast'});
        },
    });

    return position ? (
        <Marker
            draggable={true}
            icon={redPinIcon}
            eventHandlers={{
                dragstart: () => {
                    toast.loading("İşaretçi taşınıyor...", {id: 'drag-toast'});
                },
                dragend: (e) => {
                    const marker = e.target;
                    const pos = marker.getLatLng();
                    setPosition({ lat: pos.lat, lng: pos.lng });
                    toast.success("Konum başarıyla taşındı!", {id: 'drag-toast'});
                },
            }}
            position={[position.lat, position.lng]}
        />
    ) : null;
};

// A helper function to intelligently search Turkish addresses using OpenStreetMap Nominatim
const fetchGeocode = async (addressText) => {
    if (!addressText) return null;

    let cleanAddr = addressText
        .replace(/Mah\./gi, 'Mahallesi')
        .replace(/Cad\./gi, 'Caddesi')
        .replace(/Sok\./gi, 'Sokak')
        .replace(/Apt\./gi, 'Apartmanı')
        .replace(/Blv\./gi, 'Bulvarı')
        .replace(/Bul\./gi, 'Bulvarı')
        .replace(/-/g, ' ') // Tire yerine boşluk
        .replace(/,/g, ' ') // Virgül yerine boşluk
        .replace(/\s+/g, ' ')
        .trim();
        
    // Remove "No: 267/1", "No:267", or loose "No" which frequently break Nominatim searches
    let addressWithoutNo = cleanAddr.replace(/No\s*:\s*\S+/gi, '').replace(/\bNo\b/gi, '').replace(/\s+/g, ' ').trim();
    
    // Remove street specific parts (Cadde, Sokak, vb.) to fall back to Neighborhood/District level
    let noStreetMatch = addressWithoutNo.replace(/(\S+)\s+(Caddesi|Sokak|Bulvarı|Meydanı)/gi, '').replace(/\s+/g, ' ').trim();

    let queriesToTry = [
        `${addressWithoutNo}, Türkiye`,
        `${noStreetMatch}, Türkiye`
    ];

    const words = addressWithoutNo.split(' ').filter(w => w.length > 2);
    if (words.length >= 2) {
        queriesToTry.push(`${words[words.length - 2]} ${words[words.length - 1]}, Türkiye`);
    }

    queriesToTry = [...new Set(queriesToTry)]; // Remove duplicates

    for (let query of queriesToTry) {
        if (!query || query.length < 8) continue; // Skip too short queries
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
            }
        } catch (err) {
            console.error("Geocode error for query:", query, err);
        }
    }
    return null;
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
        region: 'Diğer',
        lat: null,
        lng: null
    });
    // New state for file attachments
    const [files, setFiles] = useState([]);
    const [error, setError] = useState(null); // UI Error state

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

    const parseCoordsFromLink = (link) => {
        if (!link) return null;
        // Try to find lat/lng in URL (standard @lat,lng style)
        const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
        const match = link.match(regex);
        if (match) {
            return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
        }
        // Try query param style q=lat,lng
        const qRegex = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/;
        const qMatch = link.match(qRegex);
        if (qMatch) {
            return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError(null);

            // AUTO-GEOCODE FALLBACK: If lat/lng missing, try one last background search
            let currentLat = formData.lat;
            let currentLng = formData.lng;

            if (!currentLat || !currentLng && formData.address) {
                try {
                    const geoResult = await fetchGeocode(formData.address);
                    if (geoResult) {
                        currentLat = geoResult.lat;
                        currentLng = geoResult.lng;
                    }
                } catch (e) {
                    console.log('Final geocode attempt failed, saving as text-only.');
                }
            }

            // 1. Prepare Payload (Sanitize)
            const payload = {
                ...formData,
                lat: currentLat,
                lng: currentLng,
                due_date: formData.due_date ? formData.due_date : null,
                assigned_to: formData.assigned_to ? formData.assigned_to : null,
                maps_link: formData.maps_link ? formData.maps_link : (currentLat ? `https://www.google.com/maps?q=${currentLat},${currentLng}` : '')
            };

            // 2. Create Task
            const res = await api.post('/tasks', payload);
            const taskId = res.data.id;
            
            // ... rest of upload logic ...
            if (files && files.length > 0) {
                const fileData = new FormData();
                for (let i = 0; i < files.length; i++) {
                    fileData.append('photos', files[i]);
                }
                fileData.append('type', 'before');
                fileData.append('gps_lat', currentLat || 0);
                fileData.append('gps_lng', currentLng || 0);

                await api.post(`/tasks/${taskId}/photos`, fileData, {
                    headers: { 'Content-Type': undefined }
                });
            }

            toast.success('Görev başarıyla oluşturuldu');
            navigate('/admin');
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || 'Görev oluşturulamadı';
            setError(msg);
            toast.error(msg);
        }
    };

    const handleGeocode = async (addressToSearch) => {
        if (!addressToSearch) return toast.error('Lütfen önce bir adres girin.');

        try {
            toast.loading('Haritada aranıyor...', { id: 'geo-toast' });
            const geoResult = await fetchGeocode(addressToSearch);

            if (geoResult) {
                const { lat, lng } = geoResult;
                setFormData(prev => ({
                    ...prev,
                    lat,
                    lng,
                    maps_link: `https://www.google.com/maps?q=${lat},${lng}`
                }));
                toast.success('Konum haritada yaklaşık olarak bulundu.', { id: 'geo-toast' });
            } else {
                toast.error('Tam konum bulunamadı, ama metin olarak kaydedebilirsiniz.', { id: 'geo-toast' });
            }
        } catch (e) { 
            console.error(e);
            toast.error('Konum servisi meşgul.', { id: 'geo-toast' });
        }
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
                description: `Mağaza Kodu: ${store.code}`,
                lat: store.lat ? parseFloat(store.lat) : null,
                lng: store.lng ? parseFloat(store.lng) : null,
                maps_link: (store.lat && store.lng) ? `https://www.google.com/maps?q=${store.lat},${store.lng}` : ''
            });
            
            if (!store.lat || !store.lng) {
                handleGeocode(store.address);
            } else {
                toast.success('Mağaza konumu hazır.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleLinkChange = (e) => {
        const link = e.target.value;
        const coords = parseCoordsFromLink(link);
        if (coords) {
            setFormData({ ...formData, maps_link: link, lat: coords.lat, lng: coords.lng });
            toast.success('Linkten koordinatlar ayıklandı!');
        } else {
            setFormData({ ...formData, maps_link: link });
        }
    };

    return (
        <div className="dashboard">
            <button onClick={() => navigate('/admin')} className="glass-btn" style={{ marginBottom: '1rem' }}>&larr; Geri</button>
            <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
                <h2 style={{ marginTop: 0 }}>Yeni Görev Oluştur (v3 - FOTO MODU)</h2>
                {error && <div style={{ background: '#ff5252', color: 'white', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>🚨 {error}</div>}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    <div style={{ background: 'var(--glass-surface)', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#90caf9' }}>📍 Bölge Seçimi</label>
                        <select
                            className="glass-input"
                            name="region"
                            value={formData.region || 'Diğer'}
                            onChange={handleChange}
                            style={{ background: 'rgba(0,0,0,0.3)', color: 'white' }}
                        >
                            <option value="Diğer">Bölge Seçiniz (Varsayılan: Diğer)</option>
                            <option value="Kemalpaşa">Kemalpaşa</option>
                            <option value="Manisa">Manisa</option>
                            <option value="Güzelbahçe">Güzelbahçe</option>
                            <option value="Torbalı">Torbalı</option>
                            <option value="Menemen">Menemen</option>
                        </select>
                    </div>

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
                        <button type="button" onClick={() => handleGeocode(formData.address)} className="glass-btn" style={{ background: 'rgba(33, 150, 243, 0.3)', whiteSpace: 'nowrap' }}>📍 Hedefe Yaklaş</button>
                    </div>

                    <input className="glass-input" name="maps_link" value={formData.maps_link} placeholder="Google Maps Linki (Opsiyonel)" onChange={handleLinkChange} />

                    {/* INTERACTIVE MAP FOR PINPOINT ACCURACY */}
                    <div style={{ marginTop: '5px', height: '300px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ background: 'rgba(33, 150, 243, 0.2)', padding: '5px', textAlign: 'center', fontSize: '0.8rem', color: '#90caf9' }}>
                            Aramadan sonra haritaya TIKLAYARAK veya işareti SÜRÜKLEYEREK nokta atışı yapabilirsiniz.
                        </div>
                        <div style={{ flex: 1 }}>
                            <MapContainer 
                                center={formData.lat ? [formData.lat, formData.lng] : [39.0, 35.0]} 
                                zoom={formData.lat ? 16 : 5} 
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer
                                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                    attribution='&copy; CARTO'
                                />
                                <MapRelocator center={formData.lat ? [formData.lat, formData.lng] : null} />
                                <DraggableMarker 
                                    position={formData.lat ? { lat: formData.lat, lng: formData.lng } : null}
                                    setPosition={(pos) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            lat: pos.lat,
                                            lng: pos.lng,
                                            maps_link: `https://www.google.com/maps?q=${pos.lat},${pos.lng}`
                                        }));
                                    }} 
                                />
                            </MapContainer>
                        </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px', border: '2px solid #ff9800' }}>
                        <label style={{ color: '#ff9800', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>📸 FOTOĞRAF EKLEME BÖLÜMÜ</label>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ padding: '10px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', width: '100%', borderRadius: '4px' }}
                        />
                        <small style={{ display: 'block', marginTop: '5px', color: '#ddd' }}>Kroki, Arıza, Kapı Girişi vb. (Çoklu Seçim)</small>
                    </div>
                    <small style={{ opacity: 0.7 }}>Birden fazla dosya seçebilirsiniz.</small>

                    <label>Son Tarih</label>
                    <input className="glass-input" name="due_date" type="datetime-local" onChange={handleChange} />

                    <label>Personel Ata (Opsiyonel)</label>
                    <select className="glass-input" name="assigned_to" onChange={handleChange} style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <option value="">-- Havuza Bırak --</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.username}</option>
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

