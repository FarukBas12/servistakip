import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ShoppingBag, PlusCircle } from 'lucide-react';

const AdminDashboard = () => {
    return (
        <div className="dashboard">
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                <h1 style={{ marginBottom: '10px' }}>Yönetici Paneli</h1>
                <p style={{ opacity: 0.7, marginBottom: '40px' }}>Hoşgeldiniz. İşlemlerinizi soldaki menüden veya aşağıdaki hızlı butonlardan yapabilirsiniz.</p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
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
