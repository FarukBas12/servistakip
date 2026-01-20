import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Download, Eye, ArrowLeft } from 'lucide-react';

const CompletedTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCompletedTasks();
    }, []);

    const fetchCompletedTasks = async () => {
        try {
            const res = await api.get('/tasks');
            // Filter only completed tasks
            setTasks(res.data.filter(t => t.status === 'completed'));
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const exportToExcel = () => {
        const dataToExport = tasks.map(task => ({
            'İş Başlığı': task.title,
            'Adres': task.address,
            'Bölge': task.region || 'Diğer',
            'Personel': task.assigned_user || '—',
            'Tamamlanma Tarihi': new Date(task.due_date).toLocaleDateString(),
            'Açıklama': task.description || '',
            'İade Sayısı': task.cancel_count || 0,
            'Son İade Nedeni': task.last_cancel_reason || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Biten İşler");

        // Generate buffer and save
        XLSX.writeFile(workbook, `Biten_Isler_Raporu_${new Date().toLocaleDateString()}.xlsx`);
    };

    if (loading) return <div className="dashboard">Yükleniyor...</div>;

    return (
        <div className="dashboard">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => navigate('/admin')} className="glass-btn" style={{ padding: '8px' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h2 style={{ margin: 0 }}>Biten İşler Arşivi</h2>
                </div>
                <button onClick={exportToExcel} className="glass-btn" style={{ background: 'rgba(76, 175, 80, 0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Download size={18} /> Excel Olarak İndir
                </button>
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
                        {tasks.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '30px', textAlign: 'center', opacity: 0.5 }}>Henüz tamamlanmış iş bulunmuyor.</td>
                            </tr>
                        ) : (
                            tasks.map(task => (
                                <tr key={task.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ fontWeight: '500' }}>{task.title}</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{task.address.substring(0, 30)}...</div>
                                    </td>
                                    <td style={{ padding: '15px' }}>{task.region || 'Diğer'}</td>
                                    <td style={{ padding: '15px' }}>{task.assigned_user || '—'}</td>
                                    <td style={{ padding: '15px' }}>{new Date(task.due_date).toLocaleDateString()}</td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => setSelectedTask(task)}
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
            {selectedTask && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.85)', zIndex: 2000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '600px', padding: '30px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>İş Detayı</h3>
                            <button onClick={() => setSelectedTask(null)} className="glass-btn" style={{ padding: '5px 12px' }}>Kapat</button>
                        </div>

                        <div style={{ display: 'grid', gap: '15px' }}>
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
                            {selectedTask.cancel_count > 0 && (
                                <div style={{ border: '1px solid rgba(255, 193, 7, 0.3)', background: 'rgba(255, 193, 7, 0.05)', padding: '10px', borderRadius: '8px' }}>
                                    <div style={{ color: '#ffb300', fontSize: '0.85rem', fontWeight: 'bold' }}>⚠️ İade Geçmişi</div>
                                    <div style={{ fontSize: '0.85rem' }}>Bu iş {selectedTask.cancel_count} kez iade edildi.</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Son neden: {selectedTask.last_cancel_reason}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompletedTasks;
