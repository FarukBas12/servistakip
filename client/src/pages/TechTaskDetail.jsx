import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const TechTaskDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Return/Cancel Modal State
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnReason, setReturnReason] = useState('');

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const res = await api.get(`/tasks/${id}`);
                setTask(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchTask();
    }, [id]);

    const openMap = () => {
        if (task.maps_link) {
            window.open(task.maps_link, '_blank');
        } else {
            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.address)}`;
            window.open(url, '_blank');
        }
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async (type) => {
        if (!file) return alert('Please select a file');

        const formData = new FormData();
        formData.append('photo', file);
        formData.append('type', type);

        // Mock GPS
        formData.append('gps_lat', 40.7128);
        formData.append('gps_lng', -74.0060);

        setUploading(true);
        try {
            await api.post(`/tasks/${id}/photos`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Photo uploaded!');
            setFile(null);
            // Refresh task to show new photo
            const res = await api.get(`/tasks/${id}`);
            setTask(res.data);
        } catch (err) {
            console.error(err);
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleStart = async () => {
        try {
            await api.put(`/tasks/${id}`, { status: 'in_progress' });
            // Refresh
            const res = await api.get(`/tasks/${id}`);
            setTask(res.data);
            alert('Görev Başlatıldı!');
        } catch (err) {
            console.error(err);
            alert('Hata!');
        }
    };

    const handleComplete = async () => {
        // Check if photos exist
        if (!task.photos || task.photos.length === 0) {
            return alert('You must upload at least one photo to complete the task.');
        }

        try {
            await api.put(`/tasks/${id}`, { status: 'completed' });
            alert('Task marked as completed!');
            navigate('/tech');
        } catch (err) {
            console.error(err);
            alert('Failed to update status');
        }
    };

    const handleReturnSubmit = async (e) => {
        e.preventDefault();
        if (!returnReason.trim()) return alert('Lütfen bir gerekçe girin.');

        try {
            await api.post(`/tasks/${id}/cancel`, { reason: returnReason });
            alert('Görev iade edildi ve havuza gönderildi.');
            navigate('/tech');
        } catch (err) {
            console.error(err);
            alert('İade işlemi başarısız: ' + (err.response?.data?.message || err.message));
        }
    };

    if (!task) return <p>Yükleniyor...</p>;

    return (
        <div className="dashboard">
            <button onClick={() => navigate('/tech')} className="glass-btn" style={{ marginBottom: '1rem', padding: '8px 16px' }}>&larr; Geri</button>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h1 style={{ marginTop: 0 }}>{task.title}</h1>
                <p style={{ lineHeight: '1.6', opacity: 0.9 }}>{task.description}</p>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', margin: '1rem 0' }}>
                    <strong>Adres:</strong> {task.address}
                </div>

                <button onClick={openMap} className="glass-btn" style={{ background: 'rgba(76, 175, 80, 0.3)', width: '100%', marginBottom: '20px' }}>
                    🗺️ Haritada Aç
                </button>

                <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Fotoğraflar</h3>
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                    {task.photos && task.photos.map(p => (
                        <img key={p.id} src={p.url} alt={p.type} style={{ height: '120px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }} />
                    ))}
                    {(!task.photos || task.photos.length === 0) && <p style={{ opacity: 0.5, fontStyle: 'italic' }}>Fotoğraf yok.</p>}
                </div>

                {task.status === 'pending' && (
                    <button
                        onClick={handleStart}
                        className="glass-btn"
                        style={{ width: '100%', background: 'rgba(255, 193, 7, 0.3)', marginBottom: '20px', fontSize: '1.1rem', padding: '15px' }}
                    >
                        🚀 Görevi Başlat
                    </button>
                )}

                {task.status !== 'completed' && (
                    <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                        <h4>Tamamlama Fotoğrafı Yükle</h4>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input type="file" onChange={handleFileChange} accept="image/*" capture="environment" className="glass-input" />
                            <button
                                onClick={() => handleUpload('completion')}
                                disabled={!file || uploading}
                                className="glass-btn"
                                style={{ whiteSpace: 'nowrap' }}
                            >
                                {uploading ? '...' : 'Yükle'}
                            </button>
                        </div>

                        <br />
                        <button
                            onClick={handleComplete}
                            className="glass-btn"
                            style={{ width: '100%', background: 'rgba(33, 150, 243, 0.4)', fontSize: '1.1rem', padding: '15px', marginBottom: '15px' }}
                        >
                            ✅ Görevi Tamamla
                        </button>

                        <button
                            onClick={() => setShowReturnModal(true)}
                            className="glass-btn"
                            style={{ width: '100%', background: 'rgba(244, 67, 54, 0.3)', fontSize: '1rem', padding: '12px' }}
                        >
                            ⚠️ İşi İade Et / Yapılamadı
                        </button>
                    </div>
                )}
            </div>

            {/* Return Modal */}
            {showReturnModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', padding: '30px', background: '#1e1e1e' }}>
                        <h3 style={{ marginTop: 0 }}>Görevi İade Et</h3>
                        <p style={{ opacity: 0.8 }}>Bu görevi neden yapamadığınızı veya neden iade ettiğinizi açıklayın:</p>
                        <textarea
                            className="glass-input"
                            rows="4"
                            value={returnReason}
                            onChange={(e) => setReturnReason(e.target.value)}
                            placeholder="Örn: Müşteri evde yok, malzeme eksik..."
                        />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={handleReturnSubmit} className="glass-btn" style={{ flex: 1, background: 'rgba(244, 67, 54, 0.4)' }}>İade Et</button>
                            <button onClick={() => setShowReturnModal(false)} className="glass-btn" style={{ flex: 1 }}>Vazgeç</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TechTaskDetail;
