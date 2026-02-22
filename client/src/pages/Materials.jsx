import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const Materials = () => {
    const navigate = useNavigate();
    const [materials, setMaterials] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        unit: 'Adet',
        price: '',
        category: 'Yapı'
    });

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            const res = await api.get('/materials');
            setMaterials(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/materials', formData);
            setFormData({ name: '', unit: 'Adet', price: '', category: 'Yapı' });
            fetchMaterials();
        } catch (err) {
            alert('Malzeme eklenirken hata oluştu');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu malzemeyi silmek istediğinize emin misiniz?')) {
            try {
                await api.delete(`/materials/${id}`);
                fetchMaterials();
            } catch (err) {
                alert('Silinemedi');
            }
        }
    };

    return (
        <div className="dashboard">
            <button onClick={() => navigate('/admin')} className="glass-btn" style={{ marginBottom: '1rem' }}>&larr; Geri</button>
            <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h2 style={{ marginTop: 0 }}>🧱 Malzeme Yönetimi</h2>

                {/* Add Material Form */}
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'center' }}>
                        <input className="glass-input" name="name" placeholder="Malzeme Adı (Örn: Alçıpan)" value={formData.name} onChange={handleChange} required />
                        <select className="glass-input" name="unit" value={formData.unit} onChange={handleChange}>
                            <option>Adet</option>
                            <option>Metre</option>
                            <option>m2</option>
                            <option>Paket</option>
                            <option>Torba</option>
                            <option>Kutu</option>
                        </select>
                        <input className="glass-input" name="price" type="number" step="0.01" placeholder="Fiyat (TL)" value={formData.price} onChange={handleChange} required />
                        <select className="glass-input" name="category" value={formData.category} onChange={handleChange}>
                            <option>Yapı</option>
                            <option>Boya</option>
                            <option>Elektrik</option>
                            <option>Tesisat</option>
                            <option>Hırdavat</option>
                            <option>Diğer</option>
                        </select>
                        <button type="submit" className="glass-btn" style={{ background: 'rgba(76, 175, 80, 0.4)' }}>Ekle</button>
                    </form>
                </div>

                {/* Materials List table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                                <th style={{ padding: '10px', textAlign: 'left' }}>Malzeme</th>
                                <th style={{ padding: '10px', textAlign: 'left' }}>Kategori</th>
                                <th style={{ padding: '10px', textAlign: 'left' }}>Birim</th>
                                <th style={{ padding: '10px', textAlign: 'right' }}>Birim Fiyat</th>
                                <th style={{ padding: '10px', textAlign: 'center' }}>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {materials.map(m => (
                                <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <td style={{ padding: '10px' }}>{m.name}</td>
                                    <td style={{ padding: '10px' }}>
                                        <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                            {m.category}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px' }}>{m.unit}</td>
                                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#4CAF50' }}>
                                        {parseFloat(m.price).toFixed(2)} ₺
                                    </td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>
                                        <button onClick={() => handleDelete(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>❌</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Materials;
