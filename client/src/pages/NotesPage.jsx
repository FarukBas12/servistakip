import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Trash2, ChevronLeft, Search } from 'lucide-react';
import api from '../utils/api';

const NotesPage = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const res = await api.get('/calendar');
            // Sort by date (descending)
            const sorted = res.data.sort((a, b) => new Date(b.date) - new Date(a.date));
            setNotes(sorted);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/calendar/${id}`);
            setNotes(notes.filter(n => n.id !== id));
        } catch (err) {
            alert('Silme işlemi sırasında bir hata oluştu.');
        }
    };

    const handleComplete = async (id) => {
        try {
            await api.put(`/calendar/${id}`, { completed: true });
            setNotes(notes.map(n => n.id === id ? { ...n, completed: true } : n));
        } catch (err) {
            alert('Güncellenemedi');
        }
    };

    const filteredNotes = notes.filter(n =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.description && n.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getNoteColor = (dateStr) => {
        const today = new Date();
        const target = new Date(dateStr);
        const diffTime = target - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'var(--text-secondary)'; // Past
        if (diffDays <= 3) return '#ef5350'; // Red
        if (diffDays <= 7) return '#ffa726'; // Orange
        return '#66bb6a'; // Green
    };

    if (loading) return <div className="dashboard">Yükleniyor...</div>;

    return (
        <div className="dashboard fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => navigate('/admin')} className="icon-btn" style={{ background: 'var(--glass-surface)' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '2rem' }}>Not Arşivi</h1>
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Tüm ajanda notları ve hatırlatıcılar</p>
                    </div>
                </div>

                <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '8px 15px', gap: '10px' }}>
                    <Search size={18} color="var(--text-secondary)" />
                    <input
                        type="text"
                        placeholder="Notlarda ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '200px' }}
                    />
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--glass-surface)' }}>
                            <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>TARİH</th>
                            <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>BAŞLIK</th>
                            <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>AÇIKLAMA</th>
                            <th style={{ padding: '15px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>İŞLEMLER</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredNotes.length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    Not bulunamadı.
                                </td>
                            </tr>
                        ) : (
                            filteredNotes.map(note => (
                                <tr key={note.id} style={{
                                    borderBottom: '1px solid var(--glass-border)',
                                    transition: 'background 0.2s',
                                    opacity: note.completed ? 0.6 : 1
                                }} className="table-row-hover">
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '4px', height: '24px', borderRadius: '2px', background: note.completed ? '#aaa' : getNoteColor(note.date) }}></div>
                                            <span style={{ fontWeight: 500, textDecoration: note.completed ? 'line-through' : 'none' }}>{new Date(note.date).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '15px', fontWeight: 600, textDecoration: note.completed ? 'line-through' : 'none' }}>{note.title}</td>
                                    <td style={{ padding: '15px', color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: note.completed ? 'line-through' : 'none' }}>{note.description || '—'}</td>
                                    <td style={{ padding: '15px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                            {!note.completed && (
                                                <button onClick={() => handleComplete(note.id)} title="Tamamlandı" className="icon-btn" style={{ color: 'var(--success)', opacity: 0.7 }}>
                                                    <Calendar size={18} />
                                                </button>
                                            )}
                                            <button onClick={() => handleDelete(note.id)} title="Sil" className="icon-btn" style={{ color: 'var(--danger)', opacity: 0.7 }}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default NotesPage;
