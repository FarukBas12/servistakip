import React from 'react';
import {
    Activity, TrendingUp, Users, Clock,
    ArrowUpRight, ArrowDownRight, MoreHorizontal, Bell, Search
} from 'lucide-react';

// Pure CSS/SVG Chart Component (No external dependencies)
const SimpleAreaChart = ({ data, color = '#6366f1', height = 300 }) => {
    const maxVal = Math.max(...data.map(d => d.value));
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((d.value / maxVal) * 80); // Leave some top padding
        return `${x},${y}`;
    }).join(' ');

    const fillPath = `0,100 ${points} 100,100`;

    return (
        <div style={{ width: '100%', height: `${height}px`, position: 'relative', overflow: 'hidden' }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                <defs>
                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                {/* Area Fill */}
                <polygon points={fillPath} fill="url(#chartGradient)" />
                {/* Line */}
                <polyline points={points} fill="none" stroke={color} strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
            </svg>
            {/* Tooltip Hovers (simplified) */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 10px' }}>
                {data.map((d, i) => (
                    <div key={i} style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b', marginTop: '5px' }}>
                        {d.label}
                    </div>
                ))}
            </div>
        </div>
    );
};

const DashboardV2 = () => {
    // Mock Data for SVG Chart
    const chartData = [
        { label: 'Pzt', value: 4000 },
        { label: 'Sal', value: 3000 },
        { label: 'Çar', value: 2000 },
        { label: 'Per', value: 2780 },
        { label: 'Cum', value: 1890 },
        { label: 'Cmt', value: 2390 },
        { label: 'Paz', value: 3490 },
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0f172a', // Slate 900
            color: 'white',
            fontFamily: "'Inter', sans-serif",
            padding: '24px',
            backgroundImage: `
                radial-gradient(circle at 10% 10%, rgba(99, 102, 241, 0.15) 0%, transparent 40%),
                radial-gradient(circle at 90% 90%, rgba(139, 92, 246, 0.15) 0%, transparent 40%)
            `
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '4px', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Genel Bakış</h1>
                    <p style={{ color: '#64748b' }}>Hoş geldin, Faruk. Sistem sorunsuz çalışıyor.</p>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                        <input type="text" placeholder="Ara..." style={{
                            background: 'rgba(30, 41, 59, 0.5)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            padding: '10px 16px 10px 40px',
                            borderRadius: '12px',
                            color: 'white',
                            outline: 'none',
                            width: '240px'
                        }} />
                    </div>
                    <button style={{
                        background: 'rgba(30, 41, 59, 0.5)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '10px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        color: 'white'
                    }}>
                        <Bell size={20} />
                    </button>
                    <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '12px' }}></div>
                </div>
            </div>

            {/* KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                {/* KPI Card 1 */}
                <div className="glass-card" style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px',
                    padding: '24px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '10px', borderRadius: '12px', color: '#818cf8' }}>
                            <Activity size={24} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34d399', fontSize: '0.9rem', fontWeight: '600', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '20px' }}>
                            <ArrowUpRight size={16} /> +12.5%
                        </div>
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '4px' }}>Aktif Görevler</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-1px' }}>24</div>
                </div>

                {/* KPI Card 2 */}
                <div className="glass-card" style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px',
                    padding: '24px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ background: 'rgba(236, 72, 153, 0.2)', padding: '10px', borderRadius: '12px', color: '#f472b6' }}>
                            <TrendingUp size={24} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34d399', fontSize: '0.9rem', fontWeight: '600', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '20px' }}>
                            <ArrowUpRight size={16} /> +4.2%
                        </div>
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '4px' }}>Haftalık Performans</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-1px' }}>92%</div>
                </div>

                {/* KPI Card 3 */}
                <div className="glass-card" style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px',
                    padding: '24px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '10px', borderRadius: '12px', color: '#fbbf24' }}>
                            <Users size={24} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f87171', fontSize: '0.9rem', fontWeight: '600', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: '20px' }}>
                            <ArrowDownRight size={16} /> -2.1%
                        </div>
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '4px' }}>Müsait Personel</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-1px' }}>8<span style={{ fontSize: '1rem', color: '#64748b' }}>/12</span></div>
                </div>

                {/* KPI Card 4 */}
                <div className="glass-card" style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    borderRadius: '20px',
                    padding: '24px',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px -10px rgba(99, 102, 241, 0.5)'
                }}>
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '10px', borderRadius: '12px', color: 'white' }}>
                            <Clock size={24} />
                        </div>
                        <div style={{ color: 'white', opacity: 0.8 }}>
                            <MoreHorizontal size={20} />
                        </div>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '4px' }}>Bekleyen İşler</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-1px' }}>5</div>
                    <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>2 tanesi acil düzeyde</div>
                </div>
            </div>

            {/* Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>

                {/* Main Chart - CUSTOM SVG IMPLEMENTATION */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px',
                    padding: '24px',
                    minHeight: '400px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ margin: 0 }}>Haftalık Aktivite</h3>
                        <select style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', padding: '8px', borderRadius: '8px', outline: 'none' }}>
                            <option>Bu Hafta</option>
                            <option>Geçen Hafta</option>
                        </select>
                    </div>
                    <SimpleAreaChart data={chartData} />
                </div>

                {/* Right Panel - Recent Tasks */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <h3 style={{ margin: '0 0 20px 0' }}>Son İşlemler</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', transition: 'background 0.2s', cursor: 'pointer' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: i % 2 === 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: i % 2 === 0 ? '#34d399' : '#60a5fa' }}>
                                    {i % 2 === 0 ? <Clock size={20} /> : <Activity size={20} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '500', fontSize: '0.95rem' }}>Arıza Kaydı #{1000 + i}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>2 saat önce • Kadıköy</div>
                                </div>
                                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: i % 2 === 0 ? '#34d399' : '#fbbf24' }}>
                                    {i % 2 === 0 ? 'Tamamlandı' : 'İşlemde'}
                                </div>
                            </div>
                        ))}
                    </div>
                    <button style={{ marginTop: 'auto', width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '12px', color: '#94a3b8', cursor: 'pointer', fontWeight: '500' }}>
                        Tümünü Gör
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardV2;
