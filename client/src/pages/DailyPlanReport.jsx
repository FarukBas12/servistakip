import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { Printer, Calendar, ArrowLeft, Truck, User } from 'lucide-react';

const DailyPlanReport = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [formattedDate, setFormattedDate] = useState('');
    const [teams, setTeams] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTasks();
        // Update formatted date
        if (selectedDate) {
            const dateObj = new Date(selectedDate + 'T00:00:00');
            setFormattedDate(dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }));
        }
    }, [selectedDate]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tasks');
            // Filter tasks for the selected date
            const filtered = res.data.filter(t => {
                if (!t.due_date) return false;
                return t.due_date.split('T')[0] === selectedDate;
            });
            setTasks(filtered);
            groupTasksByTeam(filtered);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const groupTasksByTeam = (taskList) => {
        const teamGroups = {};

        taskList.forEach(task => {
            // Create a unique key based on assigned user IDs
            // Sort to ensure same team gets same key regardless of order
            const userIds = task.assigned_users ? task.assigned_users.map(u => u.id).sort().join('-') : 'unassigned';
            const userNames = task.assigned_user_names || 'Atanmadı';

            if (!teamGroups[userIds]) {
                teamGroups[userIds] = {
                    teamId: userIds,
                    teamName: userNames,
                    plate: '',
                    driver: '',
                    tasks: []
                };
            }
            teamGroups[userIds].tasks.push(task);
        });

        setTeams(Object.values(teamGroups));
    };

    const handleTeamInfoChange = (teamId, field, value) => {
        setTeams(prevTeams => prevTeams.map(team =>
            team.teamId === teamId ? { ...team, [field]: value } : team
        ));
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="dashboard">
            <style>{`
                @media print {
                    body { background: white !important; color: black !important; }
                    .dashboard, .sidebar, .glass-btn, .no-print { display: none !important; }
                    .print-layout { display: block !important; }
                    .print-section { 
                        page-break-after: always; 
                        margin-bottom: 30px; 
                        border: 2px solid #000;
                        padding: 0;
                    }
                    .print-header {
                        display: grid;
                        grid-template-columns: 100px 1fr 1fr;
                        border-bottom: 2px solid #000;
                    }
                    .header-item {
                        padding: 8px;
                        border-right: 2px solid #000;
                        font-weight: bold;
                        font-size: 12px;
                    }
                    .header-item:last-child { border-right: none; }
                    .print-table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .print-table th, .print-table td {
                        border: 1px solid #000;
                        padding: 8px;
                        font-size: 11px;
                        text-align: left;
                    }
                    .print-table th {
                        background-color: #fce4dc !important;
                        -webkit-print-color-adjust: exact;
                    }
                    .team-label { font-size: 10px; color: #666; display: block; }
                    .team-value { font-size: 13px; color: #d32f2f; font-weight: bold; }
                }
                .print-layout { display: none; }
                .team-card { margin-bottom: 30px; animation: slideUp 0.4s ease-out; }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div className="no-print">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div>
                        <button onClick={() => navigate('/admin/pool')} className="glass-btn" style={{ marginBottom: '10px' }}>
                            <ArrowLeft size={18} /> Geri Dön
                        </button>
                        <h1 style={{ margin: 0 }}>Günlük İş Planı</h1>
                        <p style={{ opacity: 0.7 }}>{formattedDate} tarihli ekip listesi</p>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div className="glass-panel" style={{ padding: '5px 15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Calendar size={18} />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', cursor: 'pointer' }}
                            />
                        </div>
                        <button onClick={handlePrint} className="glass-btn" style={{ background: 'var(--primary)' }}>
                            <Printer size={18} /> Yazdır / PDF
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>Yükleniyor...</div>
                ) : teams.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '50px', textAlign: 'center' }}>
                        <p style={{ opacity: 0.5 }}>Seçilen tarihte atanmış herhangi bir iş bulunamadı.</p>
                    </div>
                ) : (
                    teams.map(team => (
                        <div key={team.teamId} className="glass-panel team-card" style={{ padding: '25px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--primary)' }}></div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>PERSONEL</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: 600 }}>
                                        <User size={20} style={{ color: 'var(--primary)' }} />
                                        {team.teamName}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>ARAÇ PLAKASI</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Truck size={20} style={{ opacity: 0.5 }} />
                                        <input
                                            className="glass-input"
                                            placeholder="Plaka Giriniz"
                                            value={team.plate}
                                            onChange={(e) => handleTeamInfoChange(team.teamId, 'plate', e.target.value.toUpperCase())}
                                            style={{ padding: '8px 12px' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>ŞOFÖR</label>
                                    <input
                                        className="glass-input"
                                        placeholder="Şoför Adı"
                                        value={team.driver}
                                        onChange={(e) => handleTeamInfoChange(team.teamId, 'driver', e.target.value)}
                                        style={{ padding: '8px 12px' }}
                                    />
                                </div>
                            </div>

                            <table style={{ margin: 0 }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '50px' }}>NO</th>
                                        <th>MAĞAZA KODU / ADI</th>
                                        <th>YAPILACAK İŞ</th>
                                        <th>ADRES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {team.tasks.map((task, idx) => (
                                        <tr key={task.id}>
                                            <td style={{ fontWeight: 600 }}>{idx + 1}</td>
                                            <td>{task.title}</td>
                                            <td style={{ maxWidth: '300px' }}>{task.description || '—'}</td>
                                            <td style={{ fontSize: '0.85rem', opacity: 0.8 }}>{task.address}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))
                )}
            </div>

            {/* Print View Layout */}
            <div className="print-layout">
                {teams.map(team => (
                    <div key={team.teamId} className="print-section">
                        <div className="print-header">
                            <div className="header-item" style={{ fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>PERSONEL</div>
                            <div className="header-item">
                                <span className="team-value" style={{ textTransform: 'uppercase' }}>{team.teamName}</span>
                            </div>
                            <div className="header-item">
                                <span className="team-label">ŞOFÖR:</span>
                                <span className="team-value">{team.driver || '..............'}</span>
                            </div>
                        </div>
                        <div className="print-header" style={{ borderTop: 'none' }}>
                            <div className="header-item" style={{ fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>ARAÇ</div>
                            <div className="header-item">
                                <span className="team-value">{team.plate || '..............'}</span>
                            </div>
                            <div className="header-item" style={{ background: '#fce4dc' }}>
                                <span className="team-label">TARİH:</span>
                                <span>{formattedDate}</span>
                            </div>
                        </div>
                        <table className="print-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '30px' }}>NO</th>
                                    <th style={{ width: '150px' }}>MAĞAZA KODU / ADI</th>
                                    <th>YAPILACAK İŞ</th>
                                    <th style={{ width: '200px' }}>ADRES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {team.tasks.map((task, idx) => (
                                    <tr key={task.id}>
                                        <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                                        <td>{task.title}</td>
                                        <td>{task.description}</td>
                                        <td>{task.address}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DailyPlanReport;
