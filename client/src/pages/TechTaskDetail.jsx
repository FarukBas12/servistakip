import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { MapPin, Camera, Image as ImageIcon, Upload, ArrowLeft, Play, XCircle, CheckSquare, FileText } from 'lucide-react';
import TaskTimer from '../components/TaskTimer';


const TechTaskDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [files, setFiles] = useState([]);
    const [filePreviews, setFilePreviews] = useState([]); // For thumbnails
    const [uploading, setUploading] = useState(false);
    const [uploadType, setUploadType] = useState('completion'); // 'service_form' or 'completion'

    // Form states
    const [serviceFormNo, setServiceFormNo] = useState('');
    const [isQuoted, setIsQuoted] = useState(false);

    // Return/Cancel Modal State
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnReason, setReturnReason] = useState('');

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const res = await api.get(`/tasks/${id}`);
                setTask(res.data);
                if (res.data.service_form_no) setServiceFormNo(res.data.service_form_no);
                if (res.data.is_quoted) setIsQuoted(res.data.is_quoted);
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

    const handleFileChange = (e, type) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(selectedFiles);
        setUploadType(type);

        // Generate previews
        const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
        setFilePreviews(newPreviews);
    };

    const handleUpload = async () => {
        if (files.length === 0) return alert('Dosya seçilmedi.');

        const formData = new FormData();
        files.forEach(file => formData.append('photos', file));
        formData.append('type', uploadType);
        formData.append('gps_lat', 0); // Mock
        formData.append('gps_lng', 0);

        setUploading(true);
        try {
            await api.post(`/tasks/${id}/photos`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setFiles([]);
            setFilePreviews([]);

            // Refresh
            const res = await api.get(`/tasks/${id}`);
            setTask(res.data);
            alert('Yüklendi!');
        } catch (err) {
            console.error(err);
            alert('Yükleme hatası');
        } finally {
            setUploading(false);
        }
    };

    const handleStart = async () => {
        try {
            await api.put(`/tasks/${id}`, { status: 'in_progress' });
            const res = await api.get(`/tasks/${id}`);
            setTask(res.data);
        } catch (err) {
            alert('Hata!');
        }
    };

    const handleComplete = async () => {
        // Validation logic
        if (!isQuoted) {
            if (!serviceFormNo.trim()) return alert('Servis Form No giriniz!');
            const hasServiceFormPhoto = task.photos && task.photos.some(p => p.type === 'service_form');
            if (!hasServiceFormPhoto) return alert('Servis Formu fotoğrafı yükleyiniz!');
        }

        try {
            await api.put(`/tasks/${id}`, {
                status: 'completed',
                service_form_no: serviceFormNo,
                is_quoted: isQuoted,
                due_date: new Date().toISOString()
            });
            alert('Görev tamamlandı!');
            navigate('/tech');
        } catch (err) {
            console.error(err);
            alert('Hata');
        }
    };

    const handleReturnSubmit = async () => {
        if (!returnReason.trim()) return alert('Gerekçe giriniz.');
        try {
            await api.post(`/tasks/${id}/cancel`, { reason: returnReason });
            navigate('/tech');
        } catch (err) {
            alert('Hata');
        }
    };

    if (!task) return <div style={{ padding: '20px', textAlign: 'center' }}>Yükleniyor...</div>;

    return (
        <div className="dashboard" style={{ paddingBottom: '100px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => navigate('/tech')} className="icon-btn" style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '50%' }}>
                    <ArrowLeft size={24} />
                </button>
                <h2 style={{ margin: 0, fontSize: '1.2rem', lineHeight: '1.3' }}>{task.title}</h2>
            </div>

            {/* Address Card */}
            <div className="glass-panel" style={{ padding: '15px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'start', marginBottom: '15px', opacity: 0.9 }}>
                    <MapPin size={20} style={{ minWidth: '20px', marginTop: '2px', color: '#64b5f6' }} />
                    <span style={{ fontSize: '1rem' }}>{task.address}</span>
                </div>
                <button onClick={openMap} className="glass-btn" style={{ width: '100%', background: 'rgba(33, 150, 243, 0.2)', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={18} /> Haritada Git
                </button>
            </div>

            {/* Description */}
            <div className="glass-panel" style={{ padding: '15px', marginBottom: '15px' }}>
                <h4 style={{ margin: '0 0 10px 0', opacity: 0.7 }}>Açıklama</h4>
                <p style={{ margin: 0, lineHeight: '1.5', fontSize: '1rem' }}>{task.description}</p>
            </div>

            {/* Photos Gallery */}
            <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 10px', opacity: 0.7 }}>Fotoğraflar ({task.photos ? task.photos.length : 0})</h4>
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '0 10px 10px 10px' }}>
                    {task.photos && task.photos.map(p => (
                        <div key={p.id} style={{ position: 'relative', flexShrink: 0 }}>
                            <img src={p.url} alt="Task" style={{ height: '120px', width: '120px', objectFit: 'cover', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
                            {p.type === 'service_form' && <span style={{ position: 'absolute', bottom: 5, left: 5, background: '#2196f3', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>FORM</span>}
                        </div>
                    ))}
                    {(!task.photos || task.photos.length === 0) && <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', width: '100%', textAlign: 'center', color: '#aaa' }}>Henüz fotoğraf yok.</div>}
                </div>
            </div>

            {/* ACTION AREA */}
            {task.status === 'pending' ? (
                <div style={{ padding: '0 10px' }}>
                    <button onClick={handleStart} className="glass-btn" style={{ width: '100%', padding: '20px', background: 'linear-gradient(135deg, #ffb300 0%, #ff8f00 100%)', color: 'black', fontWeight: 'bold', fontSize: '1.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(255, 179, 0, 0.3)' }}>
                        <Play size={24} fill="black" /> İşi Başlat
                    </button>
                </div>
            ) : (
                task.status !== 'completed' && (
                    <div style={{ padding: '0 10px' }}>
                        {/* Service Form Toggle */}
                        <div className="glass-panel" style={{ padding: '15px', marginBottom: '20px', border: isQuoted ? '1px solid #4caf50' : 'none' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}>
                                <div style={{
                                    width: '24px', height: '24px', borderRadius: '4px',
                                    border: '2px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: isQuoted ? '#4caf50' : 'transparent',
                                    borderColor: isQuoted ? '#4caf50' : '#ddd'
                                }}>
                                    {isQuoted && <CheckSquare size={18} color="white" />}
                                </div>
                                <input type="checkbox" checked={isQuoted} onChange={(e) => setIsQuoted(e.target.checked)} style={{ display: 'none' }} />
                                Teklifli İş (Formsuz)
                            </label>

                            {!isQuoted && (
                                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ fontSize: '0.9rem', opacity: 0.8, display: 'block', marginBottom: '5px' }}>Servis Form No</label>
                                        <input
                                            value={serviceFormNo} onChange={(e) => setServiceFormNo(e.target.value)}
                                            className="glass-input"
                                            style={{ fontSize: '1.2rem', padding: '12px' }}
                                            placeholder="12345"
                                            type="number"
                                        />
                                    </div>

                                    <label style={{ fontSize: '0.9rem', opacity: 0.8, display: 'block', marginBottom: '5px' }}>Form Fotoğrafı</label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <label className="glass-btn" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '20px', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', border: '1px dashed #666' }}>
                                            <Camera size={24} color="#64b5f6" />
                                            <span style={{ fontSize: '0.9rem' }}>Fotoğraf Çek</span>
                                            <input type="file" hidden accept="image/*" capture="environment" onChange={(e) => handleFileChange(e, 'service_form')} />
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* General Photos */}
                        <div className="glass-panel" style={{ padding: '15px', marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 15px 0' }}>İş Fotoğrafları (Örn: Cihaz Etiketi, Arıza)</h4>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <label className="glass-btn" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '20px', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', border: '1px dashed #666' }}>
                                    <ImageIcon size={24} color="#ffa726" />
                                    <span style={{ fontSize: '0.9rem' }}>Galeri / Kamera</span>
                                    <input type="file" hidden multiple accept="image/*" onChange={(e) => handleFileChange(e, 'completion')} />
                                </label>
                            </div>
                        </div>

                        {/* UPLOAD PREVIEW MODAL / AREA */}
                        {files.length > 0 && (
                            <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', background: '#222', padding: '20px', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', boxShadow: '0 -5px 20px rgba(0,0,0,0.5)', zIndex: 100 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <h3>{files.length} Fotoğraf Seçildi</h3>
                                    <button onClick={() => { setFiles([]); setFilePreviews([]); }} style={{ background: 'none', border: 'none', color: '#ff5252' }}>İptal</button>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '15px' }}>
                                    {filePreviews.map((src, i) => (
                                        <img key={i} src={src} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} alt="preview" />
                                    ))}
                                </div>
                                <button onClick={handleUpload} className="glass-btn" style={{ width: '100%', background: '#2196f3', padding: '15px', fontSize: '1.1rem' }}>
                                    {uploading ? 'Yükleniyor...' : (uploadType === 'service_form' ? 'Formu Yükle' : 'Fotoğrafları Yükle')}
                                </button>
                            </div>
                        )}

                        <div style={{ height: '80px' }}></div> {/* Spacer for sticky footer */}
                    </div>
                )
            )}

            {/* STICKY FOOTER ACTIONS */}
            {task.status === 'in_progress' && (
                <div style={{
                    position: 'fixed', bottom: 0, left: 0, width: '100%',
                    background: 'rgba(20,20,20,0.95)', backdropFilter: 'blur(10px)',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    padding: '10px 15px',
                    display: 'flex', flexDirection: 'column', gap: '10px',
                    zIndex: 90
                }}>
                    {/* Task Timer */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <TaskTimer taskId={task.id || id} taskTitle={task.title} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => setShowReturnModal(true)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #ff5252', background: 'rgba(255, 82, 82, 0.1)', color: '#ff5252', fontWeight: 'bold' }}>
                            İade Et
                        </button>
                        <button onClick={handleComplete} style={{ flex: 2, padding: '12px', borderRadius: '12px', border: 'none', background: '#4caf50', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
                            <CheckSquare size={20} /> İşi Tamamla
                        </button>
                    </div>
                </div>
            )}


            {/* RETURN MODAL */}
            {showReturnModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-panel" style={{ width: '90%', padding: '25px', background: '#222' }}>
                        <h3>İade Nedeni</h3>
                        <textarea value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="glass-input" rows="4" placeholder="Neden yapılamadı?" style={{ marginBottom: '15px' }}></textarea>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleReturnSubmit} className="glass-btn" style={{ flex: 1, background: '#ff5252' }}>Onayla</button>
                            <button onClick={() => setShowReturnModal(false)} className="glass-btn" style={{ flex: 1 }}>Vazgeç</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TechTaskDetail;
