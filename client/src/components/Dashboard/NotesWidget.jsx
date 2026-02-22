import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

const NotesWidget = ({ sortedNotes, getNoteColor, handleDeleteNote }) => {
    return (
        <div className="glass-panel" style={{ padding: '25px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>📌 Yaklaşan Notlar</h3>
                <Link to="/admin/daily-report" className="glass-btn" style={{ fontSize: '0.8rem', padding: '5px 10px' }}>Tümünü Gör</Link>
            </div>
            {sortedNotes.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic' }}>Hiç not bulunmuyor.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                    {sortedNotes.slice(0, 5).map(n => {
                        const color = getNoteColor(n.date);
                        return (
                            <div key={n.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'center', borderLeft: `3px solid ${color}` }}>
                                <div style={{ background: '#333', padding: '5px 10px', borderRadius: '6px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#888' }}>{new Date(n.date).toLocaleString('tr-TR', { month: 'short' })}</div>
                                    <div style={{ fontWeight: 'bold', fontSize: '1rem', color }}>{new Date(n.date).getDate()}</div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 500 }}>{n.title}</div>
                                    {n.description && <div style={{ fontSize: '0.8rem', color: '#5a6d8a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>{n.description}</div>}
                                </div>
                                <button onClick={() => handleDeleteNote(n.id)} className="icon-btn" style={{ color: '#ef5350', opacity: 0.5 }}><Trash2 size={14} /></button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default NotesWidget;
