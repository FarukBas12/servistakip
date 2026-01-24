import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ShoppingBag, PlusCircle, TrendingUp, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../utils/api';

const AdminDashboard = () => {
    const [stocks, setStocks] = useState([]);
    const [totalValue, setTotalValue] = useState(0);
    const [categoryData, setCategoryData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/stock-tracking');
                const data = res.data;
                setStocks(data);

                // Calculate Totals
                let sum = 0;
                const catMap = {};

                data.forEach(item => {
                    const val = (parseFloat(item.quantity) || 0) * (parseFloat(item.purchase_price) || 0);
                    sum += val;

                    const cat = item.category || 'Diğer';
                    catMap[cat] = (catMap[cat] || 0) + val;
                });

                setTotalValue(sum);

                // Prepare Chart Data
                const chartData = Object.keys(catMap).map(key => ({
                    name: key,
                    value: catMap[key]
                })).filter(i => i.value > 0); // Only show categories with value

                setCategoryData(chartData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
    };

    return (
        <div className="dashboard">
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                <h1 style={{ marginBottom: '10px' }}>Yönetici Paneli & Varlık Raporu</h1>
                <p style={{ opacity: 0.7, marginBottom: '40px' }}>Şirket envanter durumu ve yönetim kısayolları.</p>

                {/* --- TOTAL VALUE CARD --- */}
                <div style={{
                    marginBottom: '40px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '20px',
                    justifyContent: 'center'
                }}>
                    {/* TOTAL CARD */}
                    <div className="glass-panel" style={{ padding: '20px', minWidth: '300px', flex: 1, background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#818cf8', marginBottom: '10px' }}>
                            <TrendingUp size={24} />
                            <h3 style={{ margin: 0, background: 'none', WebkitTextFillColor: 'initial', color: '#818cf8' }}>Toplam Stok Değeri</h3>
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', textShadow: '0 0 20px rgba(99, 102, 241, 0.5)' }}>
                            {loading ? '...' : formatCurrency(totalValue)}
                        </div>
                        <p style={{ fontSize: '0.9rem', opacity: 0.6, marginTop: '5px' }}>
                            {stocks.length} Kalem Ürün
                        </p>
                    </div>

                    {/* CHART */}
                    {totalValue > 0 && (
                        <div className="glass-panel" style={{ padding: '20px', minWidth: '300px', flex: 1, height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <h4 style={{ margin: '0 0 10px 0', opacity: 0.8 }}>Kategori Bazlı Değer Dağılımı</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => formatCurrency(value)}
                                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: 'white' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>


                {/* ACTION BUTTONS */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '40px' }}>
                    <Link to="/admin/create-task" className="glass-btn" style={{
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px',
                        width: '150px',
                        background: 'rgba(76, 175, 80, 0.2)'
                    }}>
                        <PlusCircle size={32} />
                        <span>Yeni Görev</span>
                    </Link>

                    <Link to="/admin/create-user" className="glass-btn" style={{
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px',
                        width: '150px',
                        background: 'rgba(33, 150, 243, 0.2)'
                    }}>
                        <Users size={32} />
                        <span>Personel Ekle</span>
                    </Link>



                    <Link to="/admin/import-stores" className="glass-btn" style={{
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px',
                        width: '150px',
                        background: 'rgba(255, 193, 7, 0.2)'
                    }}>
                        <ShoppingBag size={32} />
                        <span>Mağaza Yükle</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
