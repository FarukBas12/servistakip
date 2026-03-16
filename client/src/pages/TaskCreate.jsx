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
        region: 'Diğer'
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError(null); // Reset error
            // 1. Prepare Payload (Sanitize)
            const payload = {
                ...formData,
                due_date: formData.due_date ? formData.due_date : null, // Handle empty date string
                assigned_to: formData.assigned_to ? formData.assigned_to : null,
                lat: 0,
                lng: 0
            };

            // 1. Create Task
            const res = await api.post('/tasks', payload);
            const taskId = res.data.id;

            // 2. Upload Photos (Bulk)
            if (files && files.length > 0) {
                const fileData = new FormData();
                // Append all files to the same field 'photos'
                for (let i = 0; i < files.length; i++) {
                    fileData.append('photos', files[i]);
                }

                fileData.append('type', 'before'); // DB Constraint
                fileData.append('gps_lat', 0);
                fileData.append('gps_lng', 0);

                await api.post(`/tasks/${taskId}/photos`, fileData, {
                    headers: {
                        'Content-Type': undefined
                    }
                });
            }

            navigate('/admin');
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || err.message || 'Failed to create task';
            setError(msg);
            alert(`Hata: ${msg}`); // Also alert for immediate feedback
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
                        <button type="button" onClick={() => handleGeocode(formData.address)} className="glass-btn" style={{ background: 'rgba(33, 150, 243, 0.3)', whiteSpace: 'nowrap' }}>📍 Link Bul</button>
                    </div>

                    <input className="glass-input" name="maps_link" value={formData.maps_link} placeholder="Google Maps Linki (Opsiyonel)" onChange={handleLinkChange} />

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

