import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import Modal from '../Modal';

const TaskEditModal = ({ task, regions, onDeletePhoto, onSave, onClose }) => {
    const [editForm, setEditForm] = useState({ title: '', description: '', address: '', maps_link: '', region: 'Diğer', due_date: '' });
    const [existingPhotos, setExistingPhotos] = useState([]);
    const [editFiles, setEditFiles] = useState([]);

    useEffect(() => {
        if (task) {
            let formattedDate = '';
            if (task.due_date) {
                const d = new Date(task.due_date);
                const localDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
                formattedDate = localDate.toISOString().slice(0, 16);
            }
            setEditForm({
                title: task.title,
                description: task.description || '',
                address: task.address,
                maps_link: task.maps_link || '',
                region: task.region || 'Diğer',
                due_date: formattedDate
            });
            setExistingPhotos(task.photos || []);
        }
    }, [task]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        onSave(task.id, editForm, editFiles);
    };

    return (
        <Modal title="Görevi Düzenle" onClose={onClose} maxWidth="600px">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <input className="glass-input" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required placeholder="Başlık" />
                <input className="glass-input" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} required placeholder="Adres" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <select className="glass-input" value={editForm.region} onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}>{regions.filter(r => r !== 'Hepsi').map(r => <option key={r} value={r}>{r}</option>)}</select>
                    <input type="datetime-local" className="glass-input" value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} />
                </div>
                <textarea className="glass-input" rows="4" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Açıklama" />
                <label style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Mevcut Fotoğraflar</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {existingPhotos.map(p => (
                        <div key={p.id} style={{ position: 'relative', width: '64px', height: '64px' }}>
                            <img src={p.url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
                            <button type="button" onClick={() => {
                                onDeletePhoto(task.id, p.id);
                                setExistingPhotos(prev => prev.filter(ph => ph.id !== p.id));
                            }} style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '11px', border: '2px solid #1e1e2e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                        </div>
                    ))}
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '14px', border: '1px dashed rgba(255,255,255,0.15)' }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.88rem', color: '#64748b' }}>Yeni Fotoğraf Ekle</p>
                    <input type="file" multiple accept="image/*" className="glass-input" onChange={(e) => setEditFiles(e.target.files)} />
                </div>
                <button type="submit" className="glass-btn glass-btn-primary" style={{ padding: '14px', fontWeight: '600', marginTop: '6px' }}>Değişiklikleri Kaydet</button>
            </form>
        </Modal>
    );
};

export default TaskEditModal;
