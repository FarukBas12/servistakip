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
            backgroundColor: '#ffffff',
            scale: 2 // High resolution
        });

        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.href = image;
        link.download = `Gunluk_Plan_${new Date().toISOString().slice(0, 10)}.png`;
        link.click();
    };

    return (
        <div style={{ padding: '20px', minHeight: '100vh', background: '#121212', color: 'white' }}>
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
                /* REPORT CONTAINER (White Background for Screenshot) */
                <div
                    ref={reportRef}
                    style={{
                        background: 'white',
                        color: 'black',
                        padding: '20px',
                        maxWidth: '1200px',
                        margin: '0 auto',
                        fontFamily: 'Arial, sans-serif'
                    }}
                >
                    <h3 style={{ textAlign: 'center', borderBottom: '2px solid black', paddingBottom: '10px' }}>
                        GÜNLÜK SAHA ÇALIŞMA PLANI - {new Date().toLocaleDateString('tr-TR')}
                    </h3>

                    {Object.keys(groupedTasks).length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '20px' }}>Atanmış aktif görev bulunmamaktadır.</p>
                    ) : (
                        Object.keys(groupedTasks).map((groupName, index) => (
                            <div key={index} style={{ marginBottom: '30px', border: '2px solid #000' }}>

                                {/* HEADER ROW (Pink/Red) */}
                                <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>

                                    {/* PERSONNEL -> Left */}
                                    <div style={{
                                        flex: 1,
                                        background: '#ffcccc', // Light red
                                        padding: '5px',
                                        fontWeight: 'bold',
                                        color: '#cc0000',
                                        borderRight: '1px solid #000',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{ width: '80px' }}>PERSONEL:</span>
                                        <span style={{ fontSize: '1.1rem' }}>{groupName}</span>
                                    </div>

                                    {/* DRIVER -> Right */}
                                    <div style={{
                                        flex: 1,
                                        background: '#ffcccc',
                                        padding: '5px',
                                        fontWeight: 'bold',
                                        color: '#cc0000',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{ marginRight: '10px' }}>ŞOFÖR:</span>
                                        <input
                                            type="text"
                                            placeholder="Şoför Adı..."
                                            value={manualData[groupName]?.driver || ''}
                                            onChange={(e) => handleInputChange(groupName, 'driver', e.target.value)}
                                            style={{
                                                border: 'none',
                                                background: 'transparent',
                                                borderBottom: '1px dashed #cc0000',
                                                flex: 1,
                                                fontWeight: 'bold',
                                                color: '#000',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* VEHICLE ROW (Blue/Gray) */}
                                <div style={{ display: 'flex', borderBottom: '1px solid #000', background: '#e6f3ff' }}>
                                    <div style={{ flex: 1, padding: '5px', display: 'flex', alignItems: 'center', fontWeight: 'bold', color: '#cc0000' }}>
                                        <span style={{ width: '80px' }}>ARAÇ:</span>
                                        <input
                                            type="text"
                                            placeholder="Plaka Giriniz..."
                                            value={manualData[groupName]?.plate || ''}
                                            onChange={(e) => handleInputChange(groupName, 'plate', e.target.value)}
                                            style={{
                                                border: 'none',
                                                background: 'transparent',
                                                borderBottom: '1px dashed #cc0000',
                                                flex: 1,
                                                fontWeight: 'bold',
                                                color: '#000',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* TASKS TABLE */}
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#ffead9', fontSize: '0.9rem' }}>
                                            <th style={{ border: '1px solid #000', padding: '5px', width: '30px' }}>NO</th>
                                            <th style={{ border: '1px solid #000', padding: '5px', width: '200px' }}>MAĞAZA KODU / ADI</th>
                                            <th style={{ border: '1px solid #000', padding: '5px' }}>YAPILACAK İŞ</th>
                                            <th style={{ border: '1px solid #000', padding: '5px', width: '200px' }}>ADRES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupedTasks[groupName].map((task, idx) => (
                                            <tr key={task.id} style={{ fontSize: '0.9rem' }}>
                                                <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{idx + 1}</td>
                                                <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>{task.title}</td>
                                                <td style={{ border: '1px solid #000', padding: '5px' }}>
                                                    {task.description ? task.description : '-'}
                                                </td>
                                                <td style={{ border: '1px solid #000', padding: '5px', fontSize: '0.8rem' }}>{task.address}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                            </div>
                        ))
                    )}

                    <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.8rem', color: '#666' }}>
                        * Bu rapor {new Date().toLocaleString()} tarihinde sistemden otomatik oluşturulmuştur.
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyPlanReport;
