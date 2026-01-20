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
        address: '',
        due_date: '',
        assigned_to: '',
        maps_link: '',
        lat: '',
        lng: ''
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

    const handleGeocode = async (addressToSearch) => {
        if (!addressToSearch) return alert('Lütfen önce bir adres girin.');

        try {
            // Trick: Append "Türkiye" to help the geocoder focus on the country
            const query = addressToSearch.toLowerCase().includes('türkiye') ? addressToSearch : `${addressToSearch}, Türkiye`;

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
                alert('Adres tam bulunamadı. Lütfen "Mahalle, İlçe, İl" sıralamasıyla yazıp tekrar deneyin.\nÖrnek: "Cumhuriyet Mah, Konak, İzmir"');
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

                    <label>Konum (Haritadan Seçin)</label>
                    <div style={{ height: '300px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.3)', marginBottom: '1rem' }}>
                        {formData.lat && formData.lng ? (
                            <iframe
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen
                                src={`https://maps.google.com/maps?q=${formData.lat},${formData.lng}&z=15&output=embed`}
                            ></iframe>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'rgba(0,0,0,0.2)', color: '#aaa' }}>
                                Önce Adresi "Bul" butonuna tıklayın veya <br /> (Harita entegrasyonu sonraki adımda tam eklenecek)
                            </div>
                        )}
                    </div>
                    {/* Hidden inputs for form submission */}
                    <input type="hidden" name="lat" value={formData.lat} />
                    <input type="hidden" name="lng" value={formData.lng} />

                    <input className="glass-input" name="maps_link" value={formData.maps_link} placeholder="Google Maps Linki" onChange={handleChange} />

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
