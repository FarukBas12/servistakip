import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';

const Reports = () => {
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        longPending: 0
    });
    const [dailyData, setDailyData] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await api.get('/tasks');
                processData(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchTasks();
    }, []);

    const processData = (data) => {
        setTasks(data);

        // 1. Total Work
        const total = data.length;

        // 2. Completed Work
        const completed = data.filter(t => t.status === 'completed').length;

        // 3. Long Pending Work (> 7 Days from Due Date)
        const today = new Date();
        const longPending = data.filter(t => {
            if (t.status === 'completed') return false;
            if (!t.due_date) return false;

            const dueDate = new Date(t.due_date);
            const diffTime = Math.abs(today - dueDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // If overdue by more than 7 days
            return today > dueDate && diffDays > 7;
        }).length;

        setStats({ total, completed, longPending });

        // Chart Data: Group by Service Date (Due Date)
        // Show Load per Date
        const groupedByDate = data.reduce((acc, task) => {
            if (!task.due_date) return acc;
            const date = new Date(task.due_date).toLocaleDateString('tr-TR'); // DD.MM.YYYY

            if (!acc[date]) acc[date] = { date, completed: 0, pending: 0, total: 0 };

            acc[date].total += 1;
            if (task.status === 'completed') acc[date].completed += 1;
            else acc[date].pending += 1;

            return acc;
        }, {});

        // Sort by Date logic (DD.MM.YYYY needs parsing to sort correctly)
        const chartData = Object.values(groupedByDate).sort((a, b) => {
            const [d1, m1, y1] = a.date.split('.');
            const [d2, m2, y2] = b.date.split('.');
            return new Date(y1, m1 - 1, d1) - new Date(y2, m2 - 1, d2);
        });

        setDailyData(chartData);
    };

    const COLORS = ['#4caf50', '#f44336', '#FFBB28'];

    const pieData = [
        { name: 'Biten İş', value: stats.completed },
        { name: 'Uzun Süreli Bekleyen', value: stats.longPending },
        { name: 'Diğer Bekleyenler', value: stats.total - stats.completed - stats.longPending },
    ];

    return (
        <div className="dashboard">
            <button onClick={() => navigate('/admin/pool')} className="glass-btn" style={{ marginBottom: '1rem' }}>&larr; Havuza Dön</button>
            <h1 style={{ marginBottom: '20px' }}>İstatistikler</h1>

            {/* Custom KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div className="glass-panel" style={{ padding: '25px', textAlign: 'center', background: 'rgba(33, 150, 243, 0.1)', border: '1px solid rgba(33, 150, 243, 0.3)' }}>
                    <h3 style={{ margin: 0, opacity: 0.8 }}>Toplam İş</h3>
                    <h1 style={{ fontSize: '3.5rem', margin: '15px 0', color: '#64b5f6' }}>{stats.total}</h1>
                    <span style={{ fontSize: '0.9rem', opacity: 0.6 }}>Tüm zamanlar</span>
                </div>

                <div className="glass-panel" style={{ padding: '25px', textAlign: 'center', background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                    <h3 style={{ margin: 0, opacity: 0.8 }}>Biten İş</h3>
                    <h1 style={{ fontSize: '3.5rem', margin: '15px 0', color: '#81c784' }}>{stats.completed}</h1>
                    <span style={{ fontSize: '0.9rem', opacity: 0.6 }}>%{stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0} Başarı oranı</span>
                </div>

                <div className="glass-panel" style={{ padding: '25px', textAlign: 'center', background: 'rgba(244, 67, 54, 0.1)', border: '1px solid rgba(244, 67, 54, 0.3)' }}>
                    <h3 style={{ margin: 0, opacity: 0.8 }}>Uzun Zamandır Bekleyen</h3>
                    <h1 style={{ fontSize: '3.5rem', margin: '15px 0', color: '#e57373' }}>{stats.longPending}</h1>
                    <span style={{ fontSize: '0.9rem', opacity: 0.6 }}>7 Günden eski</span>
                </div>
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>

                {/* Status Distribution */}
                <div className="glass-panel" style={{ padding: '20px', minHeight: '400px' }}>
                    <h3 style={{ textAlign: 'center' }}>Genel Durum Dağılımı</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Daily Workload - Service Date Based */}
                <div className="glass-panel" style={{ padding: '20px', minHeight: '400px' }}>
                    <h3 style={{ textAlign: 'center' }}>Servis Tarihine Göre İş Yoğunluğu</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={dailyData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 12 }} />
                            <YAxis stroke="rgba(255,255,255,0.5)" />
                            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#2b2b2b', border: 'none', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} />
                            <Legend />
                            <Bar dataKey="completed" name="Tamamlanan" stackId="a" fill="#4caf50" radius={[0, 0, 4, 4]} />
                            <Bar dataKey="pending" name="Bekleyen" stackId="a" fill="#f44336" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

            </div>
        </div>
    );
};

export default Reports;
