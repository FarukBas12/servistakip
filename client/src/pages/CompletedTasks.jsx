import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Download, Eye, ArrowLeft, Search } from 'lucide-react';

const CompletedTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTask, setSelectedTask] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCompletedTasks();
    }, []);

    // Filter effect
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredTasks(tasks);
        } else {
            const lowerTerm = searchTerm.toLowerCase();
            const filtered = tasks.filter(task =>
                (task.title && task.title.toLowerCase().includes(lowerTerm)) ||
                (task.address && task.address.toLowerCase().includes(lowerTerm)) ||
                (task.description && task.description.toLowerCase().includes(lowerTerm)) ||
                (task.service_form_no && task.service_form_no.toLowerCase().includes(lowerTerm)) ||
                (task.assigned_user && task.assigned_user.toLowerCase().includes(lowerTerm))
            );
            setFilteredTasks(filtered);
        }
    }, [searchTerm, tasks]);

    const fetchCompletedTasks = async () => {
        try {
            const res = await api.get('/tasks');
            const completed = res.data.filter(t => t.status === 'completed');
            setTasks(completed);
            setFilteredTasks(completed);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleOpenDetail = async (taskId) => {
        setDetailLoading(true);
        try {
            const res = await api.get(`/tasks/${taskId}`);
            setSelectedTask(res.data);
            setDetailLoading(false);
        } catch (err) {
            console.error(err);
            alert('Detaylar yüklenemedi.');
            setDetailLoading(false);
        }
    };

    const exportToExcel = () => {
        // Export filtered tasks if search is active, otherwise all? Usually users expect to export what they see.
        const dataToExport = filteredTasks.map(task => ({
            'İş Başlığı': task.title,
            'Adres': task.address,
            'Bölge': task.region || 'Diğer',
            'Personel': task.assigned_user || '—',
            'Tamamlanma Tarihi': new Date(task.due_date).toLocaleDateString(),
            'Açıklama': task.description || '',
            'Servis Formu No': task.service_form_no || '',
            'Teklifli İş': task.is_quoted ? 'Evet' : 'Hayır',
            'İade Sayısı': task.cancel_count || 0,
            'Son İade Nedeni': task.last_cancel_reason || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Biten İşler");

        XLSX.writeFile(workbook, `Biten_Isler_Raporu_${new Date().toLocaleDateString()}.xlsx`);
    };

    if (loading) return <div className="dashboard">Yükleniyor...</div>;

    return (
        <div className="dashboard">
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', background: 'linear-gradient(90deg, #e0e7ff, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Biten İşler Arşivi</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#5a6d8a' }}>Tamamlanan servis kayıtları</p>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                        <input
                            type="text"
                            placeholder="Mağaza, Adres, Form No..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="glass-input"
                            style={{ paddingLeft: '35px', width: '250px', margin: 0 }}
                        />
                    </div>
                    <button onClick={exportToExcel} className="glass-btn" style={{ background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Download size={18} /> Excel
                    </button>
                </div>
            </div>

            <div className="glass-panel" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                            <th style={{ padding: '15px', color: 'rgba(255,255,255,0.6)' }}>Başlık</th>
                            <th style={{ padding: '15px', color: 'rgba(255,255,255,0.6)' }}>Bölge</th>
                            <th style={{ padding: '15px', color: 'rgba(255,255,255,0.6)' }}>Personel</th>
                            <th style={{ padding: '15px', color: 'rgba(255,255,255,0.6)' }}>Tarih</th>
                            <th style={{ padding: '15px', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTasks.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '30px', textAlign: 'center', opacity: 0.5 }}>
                                    {searchTerm ? 'Aranan kriterlere uygun iş bulunamadı.' : 'Henüz tamamlanmış iş bulunmuyor.'}
                                </td>
                            </tr>
                        ) : (
                            filteredTasks.map(task => (
                                <tr key={task.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', cursor: 'pointer' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.05)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ fontWeight: '500' }}>{task.title}</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{task.address.substring(0, 30)}...</div>
                                    </td>
                                    <td style={{ padding: '15px' }}>{task.region || 'Diğer'}</td>
                                    <td style={{ padding: '15px' }}>{task.assigned_user || '—'}</td>
                                    <td style={{ padding: '15px' }}>{new Date(task.due_date).toLocaleDateString()}</td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleOpenDetail(task.id)}
                                            className="glass-btn"
                                            style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                                        >
                                            <Eye size={14} style={{ marginRight: '5px' }} /> Detay
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Detail Modal */}
            {(selectedTask || detailLoading) && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.85)', zIndex: 2000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '600px', padding: '30px', maxHeight: '90vh', overflowY: 'auto' }}>
                        {detailLoading ? (
                            <p style={{ textAlign: 'center' }}>Detaylar yükleniyor...</p>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <h3 style={{ margin: 0 }}>İş Detayı</h3>
                                    <button onClick={() => setSelectedTask(null)} className="glass-btn" style={{ padding: '5px 12px' }}>Kapat</button>
                                </div>

                                <div style={{ display: 'grid', gap: '15px' }}>
                                    {/* Service Information Header */}
                                    <div style={{ background: 'rgba(33, 150, 243, 0.1)', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Servis Formu No</label>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{selectedTask.service_form_no || '—'}</div>
                                        </div>
                                        {selectedTask.is_quoted && (
                                            <div style={{ background: '#ffb300', color: 'black', padding: '5px 10px', borderRadius: '5px', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                                🛠️ Teklifli İş
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label style={{ opacity: 0.5, fontSize: '0.8rem' }}>Başlık</label>
                                        <div>{selectedTask.title}</div>
                                    </div>
                                    <div>
                                        <label style={{ opacity: 0.5, fontSize: '0.8rem' }}>Adres</label>
                                        <div>{selectedTask.address}</div>
                                    </div>
                                    <div>
                                        <label style={{ opacity: 0.5, fontSize: '0.8rem' }}>Açıklama</label>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                                            {selectedTask.description || 'Açıklama girilmemiş.'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '20px' }}>
                                        <div>
                                            <label style={{ opacity: 0.5, fontSize: '0.8rem' }}>Personel</label>
                                            <div>{selectedTask.assigned_user || '—'}</div>
                                        </div>
                                        <div>
                                            <label style={{ opacity: 0.5, fontSize: '0.8rem' }}>Tarih</label>
                                            <div>{new Date(selectedTask.due_date).toLocaleDateString()}</div>
                                        </div>
                                    </div>

                                    {/* Photos Section */}
                                    <div style={{ marginTop: '10px' }}>
                                        <label style={{ opacity: 0.8, fontSize: '0.9rem', display: 'block', marginBottom: '10px' }}>📸 Servis Formu & Fotoğraflar</label>
                                        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                                            {selectedTask.photos && selectedTask.photos.length > 0 ? (
                                                selectedTask.photos.map(p => (
                                                    <div key={p.id} style={{ position: 'relative', flexShrink: 0 }}>
                                                        <a href={p.url} target="_blank" rel="noopener noreferrer">
                                                            <img src={p.url} alt={p.type} style={{ height: '100px', borderRadius: '8px', border: p.type === 'service_form' ? '2px solid #2196f3' : '1px solid rgba(255,255,255,0.2)' }} />
                                                        </a>
                                                        {p.type === 'service_form' && <span style={{ position: 'absolute', bottom: 5, left: 5, background: '#2196f3', color: 'white', fontSize: '9px', padding: '2px 5px', borderRadius: '4px' }}>Servis Formu</span>}
                                                    </div>
                                                ))
                                            ) : (
                                                <p style={{ opacity: 0.5, fontStyle: 'italic', fontSize: '0.9rem' }}>Fotoğraf yüklenmemiş.</p>
                                            )}
                                        </div>
                                    </div>

                                    {selectedTask.cancel_count > 0 && (
                                        <div style={{ border: '1px solid rgba(255, 193, 7, 0.3)', background: 'rgba(255, 193, 7, 0.05)', padding: '10px', borderRadius: '8px' }}>
                                            <div style={{ color: '#ffb300', fontSize: '0.85rem', fontWeight: 'bold' }}>⚠️ İade Geçmişi</div>
                                            <div style={{ fontSize: '0.85rem' }}>Bu iş {selectedTask.cancel_count} kez iade edildi.</div>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Son neden: {selectedTask.last_cancel_reason}</div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompletedTasks;
