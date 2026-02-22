import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { Download, ArrowLeft } from 'lucide-react';

const DailyPlanReport = () => {
    const [tasks, setTasks] = useState([]);
    const [groupedTasks, setGroupedTasks] = useState({});
    const [loading, setLoading] = useState(true);
    const reportRef = useRef(null);
    const navigate = useNavigate();

    // State for manual inputs (Vehicle & Driver) keyed by group name
    const [manualData, setManualData] = useState({});

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/tasks');
            // Filter: Only assigned tasks that are NOT completed/cancelled
            const activeTasks = res.data.filter(t =>
                t.status !== 'completed' && t.status !== 'cancelled' &&
                t.assigned_users && t.assigned_users.length > 0
            );
            groupTasks(activeTasks);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const groupTasks = (taskList) => {
        const groups = {};

        taskList.forEach(task => {
            // Create a unique key for the group based on assigned users
            // Sort names to ensure "Ali, Veli" is same group as "Veli, Ali"
            const names = task.assigned_users.map(u => u.username).sort().join(' - ').toUpperCase();

            if (!groups[names]) {
                groups[names] = [];
            }
            groups[names].push(task);
        });

        setGroupedTasks(groups);
    };

    const handleInputChange = (groupKey, field, value) => {
        setManualData(prev => ({
            ...prev,
            [groupKey]: {
                ...prev[groupKey],
                [field]: value
            }
        }));
    };

    const downloadImage = async () => {
        if (!reportRef.current) return;

        const canvas = await html2canvas(reportRef.current, {
            backgroundColor: isDarkMode ? '#111827' : '#ffffff',
            scale: 2 // High resolution
        });

        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.href = image;
        link.download = `Gunluk_Plan_${new Date().toISOString().slice(0, 10)}.png`;
        link.click();
    };

    return (
        <div style={{ padding: '20px', minHeight: '100vh', color: 'var(--text-primary)' }}>
            {/* Control Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <button onClick={() => navigate('/admin')} className="glass-btn">
                    <ArrowLeft size={18} style={{ marginRight: '5px' }} /> Panela Dön
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <h2 style={{ margin: 0, marginRight: '20px' }}>Günlük Plan Raporu</h2>
                    <button onClick={downloadImage} className="glass-btn" style={{ background: '#4caf50' }}>
                        <Download size={18} style={{ marginRight: '5px' }} /> Resim Olarak İndir (WhatsApp)
                    </button>
                </div>
            </div>

            {loading ? <p>Yükleniyor...</p> : (
                /* REPORT CONTAINER (Dark Mode for Modern Look) */
                <div
                    ref={reportRef}
                    style={{
                        background: '#121212', // Dark background matching app
                        color: '#ecf0f1', // Off-white text
                        padding: '40px',
                        maxWidth: '1200px',
                        margin: '0 auto',
                        fontFamily: "'Segoe UI', Roboto, Helvetica, sans-serif",
                        border: '1px solid #333'
                    }}
                >
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <h2 style={{ margin: '0', fontSize: '2rem', background: 'linear-gradient(90deg, #e0e7ff, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textTransform: 'uppercase', letterSpacing: '2px' }}>
                            Günlük Saha Çalışma Planı
                        </h2>
                        <div style={{ color: '#888', marginTop: '5px', fontSize: '1.1rem' }}>📅 {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>

                    {Object.keys(groupedTasks).length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '40px', color: '#666', fontSize: '1.2rem', border: '2px dashed #333', borderRadius: '10px' }}>Atanmış aktif görev bulunmamaktadır.</p>
                    ) : (
                        Object.keys(groupedTasks).map((groupName, index) => (
                            <div key={index} style={{ marginBottom: '40px', background: '#1e1e1e', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', border: '1px solid #333' }}>

                                {/* HEADER ROW (Gradient) */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #1e1e1e 0%, #252525 100%)',
                                    borderBottom: '1px solid #333',
                                    padding: '20px',
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '20px',
                                    alignItems: 'center'
                                }}>

                                    {/* PERSONNEL */}
                                    <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ padding: '8px 15px', background: 'rgba(255, 107, 107, 0.15)', color: '#ff6b6b', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '1px' }}>
                                            EKİP
                                        </div>
                                        <span style={{ fontSize: '1.3rem', fontWeight: '600', color: 'var(--text-primary)' }}>{groupName}</span>
                                    </div>

                                    {/* DRIVER INPUT */}
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '5px 15px', borderRadius: '8px', border: '1px solid #333' }}>
                                        <span style={{ color: '#888', fontSize: '0.8rem', marginRight: '10px', fontWeight: 'bold' }}>ŞOFÖR:</span>
                                        <input
                                            type="text"
                                            placeholder="İsim giriniz..."
                                            value={manualData[groupName]?.driver || ''}
                                            onChange={(e) => handleInputChange(groupName, 'driver', e.target.value)}
                                            style={{
                                                border: 'none',
                                                background: 'transparent',
                                                color: '#4facfe',
                                                fontSize: '1rem',
                                                fontWeight: 'bold',
                                                width: '100%',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>

                                    {/* VEHICLE INPUT */}
                                    {/* Break to new line on mobile/print but keep inline here if space permits */}
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '5px 15px', borderRadius: '8px', border: '1px solid #333' }}>
                                        <span style={{ color: '#888', fontSize: '0.8rem', marginRight: '10px', fontWeight: 'bold' }}>ARAÇ:</span>
                                        <input
                                            type="text"
                                            placeholder="Plaka..."
                                            value={manualData[groupName]?.plate || ''}
                                            onChange={(e) => handleInputChange(groupName, 'plate', e.target.value)}
                                            style={{
                                                border: 'none',
                                                background: 'transparent',
                                                color: '#f0932b',
                                                fontSize: '1rem',
                                                fontWeight: 'bold',
                                                width: '100%',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* TASKS TABLE */}
                                <div style={{ padding: '10px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 5px' }}>
                                        <thead>
                                            <tr style={{ fontSize: '0.85rem', color: '#666', textAlign: 'left' }}>
                                                <th style={{ padding: '10px 15px', width: '50px' }}>#</th>
                                                <th style={{ padding: '10px 15px', width: '25%' }}>MAĞAZA / LOKASYON</th>
                                                <th style={{ padding: '10px 15px' }}>YAPILACAK İŞLEM</th>
                                                <th style={{ padding: '10px 15px', width: '30%' }}>ADRES</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupedTasks[groupName].map((task, idx) => (
                                                <tr key={task.id} style={{ background: '#222', borderRadius: '8px', color: '#ddd' }}>
                                                    <td style={{ padding: '15px', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px', fontWeight: 'bold', color: '#4facfe' }}>
                                                        {idx + 1}
                                                    </td>
                                                    <td style={{ padding: '15px', fontWeight: '600' }}>
                                                        {task.title}
                                                    </td>
                                                    <td style={{ padding: '15px', color: '#aaa', lineHeight: '1.4' }}>
                                                        {task.description || '-'}
                                                    </td>
                                                    <td style={{ padding: '15px', borderTopRightRadius: '8px', borderBottomRightRadius: '8px', fontSize: '0.9rem', color: '#888' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            📍 {task.address}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))
                    )}

                    <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #333', paddingTop: '20px', color: '#555', fontSize: '0.9rem' }}>
                        <div>SAHA YÖNETİM SİSTEMİ</div>
                        <div>Oluşturulma: {new Date().toLocaleTimeString()}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyPlanReport;
