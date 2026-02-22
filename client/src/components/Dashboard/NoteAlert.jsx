import React from 'react';
import { Bell, CheckCircle, X } from 'lucide-react';

const NoteAlert = ({ notes, onComplete, onClose }) => {
    if (notes.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            zIndex: 3000,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxWidth: '350px',
            animation: 'slideInRight 0.3s ease-out'
        }}>
            {notes.map(note => (
                <div key={note.id} className="glass-panel" style={{
                    padding: '16px',
                    background: 'var(--glass-bg)',
                    borderLeft: '4px solid var(--warning)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                    position: 'relative',
                    animation: 'fadeIn 0.3s'
                }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '8px', borderRadius: '10px' }}>
                            <Bell size={18} color="var(--warning)" />
                        </div>
                        <div style={{ flex: 1, paddingRight: '20px' }}>
                            <div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '2px' }}>Günü Gelen Not</div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>{note.title}</div>
                            {note.description && (
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {note.description}
                                </div>
                            )}
                            <button
                                onClick={() => onComplete(note.id)}
                                className="glass-btn"
                                style={{
                                    marginTop: '12px',
                                    padding: '6px 12px',
                                    fontSize: '0.8rem',
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    borderColor: 'rgba(16, 185, 129, 0.2)',
                                    color: 'var(--success)'
                                }}
                            >
                                <CheckCircle size={14} /> Tamamlandı Olarak İşaretle
                            </button>
                        </div>
                        <button
                            onClick={() => onClose(note.id)}
                            style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default NoteAlert;
