import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';

const Reports = () => {
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        pending: 0,
        inProgress: 0
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

        // General Stats
        const total = data.length;
        const completed = data.filter(t => t.status === 'completed').length;
        const inProgress = data.filter(t => t.status === 'in_progress').length;
        const pending = total - completed - inProgress;

        setStats({ total, completed, pending, inProgress });

        // Daily Data (Last 7 Days or All)
        // Group by due_date (or creation date if we had it, using due_date/completion logic)
        // For simplicity, let's group by Due Date for now to show "Upcoming Load"
        // And we can also visualize Status distribution.

        const groupedByDate = data.reduce((acc, task) => {
            if (!task.due_date) return acc;
            const date = new Date(task.due_date).toLocaleDateString();
            if (!acc[date]) acc[date] = { date, completed: 0, pending: 0 };

            if (task.status === 'completed') acc[date].completed += 1;
            else acc[date].pending += 1;

            return acc;
        }, {});

        const chartData = Object.values(groupedByDate).sort((a, b) => new Date(a.date) - new Date(b.date));
        setDailyData(chartData);
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    const pieData = [
        { name: 'Tamamlanan', value: stats.completed },
        { name: 'Devam Eden', value: stats.inProgress },
        { name: 'Bekleyen', value: stats.pending },
    ];

    return (
        <div className="dashboard">
            <button onClick={() => navigate('/admin')} className="glass-btn" style={{ marginBottom: '1rem' }}>&larr; Panela Dön</button>
            <h1 style={{ marginBottom: '20px' }}>Raporlar ve İstatistikler</h1>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                    <h3>Toplam İş</h3>
                    <h1 style={{ fontSize: '3rem', margin: '10px 0', color: '#64b5f6' }}>{stats.total}</h1>
                </div>
                <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                    <h3>Tamamlanan</h3>
                    <h1 style={{ fontSize: '3rem', margin: '10px 0', color: '#81c784' }}>{stats.completed}</h1>
                </div>
                <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                    <h3>Aktif / Süren</h3>
                    <h1 style={{ fontSize: '3rem', margin: '10px 0', color: '#ffb74d' }}>{stats.inProgress}</h1>
                </div>
                <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                    <h3>Bekleyen</h3>
                    <h1 style={{ fontSize: '3rem', margin: '10px 0', color: '#e57373' }}>{stats.pending}</h1>
                </div>
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>

                {/* Status Distribution */}
                <div className="glass-panel" style={{ padding: '20px', minHeight: '400px' }}>
                    <h3 style={{ textAlign: 'center' }}>İş Durumu Dağılımı</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Daily Workload */}
                <div className="glass-panel" style={{ padding: '20px', minHeight: '400px' }}>
                    <h3 style={{ textAlign: 'center' }}>Tarihe Göre İş Yükü (Tamamlanan vs Bekleyen)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={dailyData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="date" stroke="white" />
                            <YAxis stroke="white" />
                            <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
                            <Legend />
                            <Bar dataKey="completed" name="Tamamlanan" stackId="a" fill="#82ca9d" />
                            <Bar dataKey="pending" name="Bekleyen" stackId="a" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

            </div>
        </div>
    );
};

export default Reports;
