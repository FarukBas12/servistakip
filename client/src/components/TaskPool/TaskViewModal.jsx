import React from 'react';
import { MapPin, CheckCircle } from 'lucide-react';
import Modal from '../Modal';

const TaskViewModal = ({ task, onClose }) => {
    return (
        <Modal title={task.title} onClose={onClose} maxWidth="600px">
            <div>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={16} /> {task.address}</p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <span className={`tp-status ${task.status === 'in_progress' ? 'tp-status--active' : 'tp-status--waiting'}`}>
                        {task.status === 'in_progress' ? 'SAHADA' : 'BEKLİYOR'}
                    </span>
                </div>
                <div style={{ marginTop: '24px', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h4 style={{ marginTop: 0, color: '#cbd5e1', fontSize: '0.95rem' }}>Açıklama</h4>
                    <p style={{ whiteSpace: 'pre-wrap', color: '#94a3b8', lineHeight: '1.7' }}>{task.description || 'Açıklama yok.'}</p>
                </div>
                {task.maps_link && <a href={task.maps_link} target="_blank" rel="noopener noreferrer" className="glass-btn glass-btn-primary" style={{ marginTop: '20px', padding: '10px 20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}><MapPin size={16} /> Haritada Git</a>}

                {task.photos && task.photos.length > 0 && (
                    <>
                        <h4 style={{ marginTop: '28px', color: '#cbd5e1' }}>📸 Fotoğraflar ({task.photos.length})</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', marginTop: '12px' }}>
                            {task.photos.map(photo => (
                                <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer">
                                    <img src={photo.url} alt="Task" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }} />
                                </a>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default TaskViewModal;
