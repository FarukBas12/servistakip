import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Truck, Plus, Trash2, Edit2, Phone, Mail, User, Package, Search } from 'lucide-react';
import { stringToColor, getInitials } from '../utils/helpers';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        supply_items: ''
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const res = await api.get('/suppliers');
            setSuppliers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSupplier) {
                await api.put(`/suppliers/${editingSupplier.id}`, formData);
            } else {
                await api.post('/suppliers', formData);
            }
            setShowModal(false);
            setEditingSupplier(null);
            setFormData({ company_name: '', contact_name: '', email: '', phone: '', supply_items: '' });
            fetchSuppliers();
        } catch (err) {
            alert('İşlem başarısız');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu tedarikçiyi silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/suppliers/${id}`);
            fetchSuppliers();
        } catch (err) {
            alert('Silme başarısız');
        }
    };

    const openEdit = (sup) => {
        setEditingSupplier(sup);
        setFormData({
            company_name: sup.company_name,
            contact_name: sup.contact_name || '',
            email: sup.email || '',
            phone: sup.phone || '',
            supply_items: sup.supply_items || ''
        });
        setShowModal(true);
    };

    // Filter suppliers based on search term
    const filteredSuppliers = suppliers.filter(sup => {
        const search = searchTerm.toLowerCase();
        return (
            sup.company_name?.toLowerCase().includes(search) ||
            sup.contact_name?.toLowerCase().includes(search) ||
            sup.supply_items?.toLowerCase().includes(search)
        );
    });

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: '#888' }}>
            <div className="spinner"></div> Yükleniyor...
        </div>
    );

    return (
        <div className="dashboard">
            {/* TOOLBAR */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '25px',
                flexWrap: 'wrap',
                gap: '15px',
                background: 'rgba(255,255,255,0.02)',
                padding: '15px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0, fontSize: '1.5rem', fontWeight: '600', letterSpacing: '-0.5px' }}>
                    <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '10px', borderRadius: '10px' }}>
                        <Truck size={28} color="#f59e0b" />
                    </div>
                </h1>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                    {/* Search Bar */}
                    <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                        <input
                            type="text"
                            className="glass-input"
                            placeholder="Tedarikçi, yetkili veya malzeme ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                paddingLeft: '40px',
                                width: '100%',
                                height: '42px',
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                transition: 'all 0.3s ease'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                    </div>

                    <button
                        onClick={() => { setEditingSupplier(null); setFormData({ company_name: '', contact_name: '', email: '', phone: '', supply_items: '' }); setShowModal(true); }}
                        className="glass-btn"
                        style={{
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            color: 'white',
                            whiteSpace: 'nowrap',
                            height: '42px',
                            padding: '0 20px',
                            fontSize: '0.95rem',
                            fontWeight: '500',
                            border: 'none',
                            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
                        }}
                    >
                        <Plus size={20} style={{ marginRight: '6px' }} /> Yeni Ekle
                    </button>
                </div>
            </div>

            {/* EMPTY STATE */}
            {filteredSuppliers.length === 0 && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '60px 20px',
                    textAlign: 'center',
                    opacity: 0.7
                }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '30px', borderRadius: '50%', marginBottom: '20px' }}>
                        <Search size={40} color="#666" />
                    </div>
                    <h3 style={{ margin: '0 0 10px 0', color: '#fff' }}>Sonuç Bulunamadı</h3>
                    <p style={{ margin: 0, color: '#888', maxWidth: '300px' }}>
                        "{searchTerm}" aramasına uygun tedarikçi bulunamadı. Yeni eklemeyi deneyin.
                    </p>
                </div>
            )}

            {/* GRID LAYOUT */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                {filteredSuppliers.map((sup, index) => (
                    <div
                        key={sup.id}
                        className="glass-panel supplier-card"
                        style={{
                            padding: '20px',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: '16px',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            animation: `fadeIn 0.5s ease backwards ${index * 0.05}s`
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3)';
                            e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.05)';
                        }}
                    >

                        {/* Header Section */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                {/* Avatar */}
                                <div style={{
                                    width: '45px',
                                    height: '45px',
                                    borderRadius: '12px',
                                    background: stringToColor(sup.company_name),
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    fontSize: '1.2rem',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                }}>
                                    {getInitials(sup.company_name)}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: '600' }}>{sup.company_name}</h3>
                                    {sup.contact_name && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: '2px' }}>
                                            <User size={12} /> {sup.contact_name}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button onClick={() => openEdit(sup)} className="icon-btn" style={{ color: 'rgba(255,255,255,0.6)', padding: '6px', borderRadius: '8px', transition: '0.2s' }} title="Düzenle"
                                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#60a5fa' }}
                                    onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(sup.id)} className="icon-btn" style={{ color: 'rgba(255,255,255,0.6)', padding: '6px', borderRadius: '8px', transition: '0.2s' }} title="Sil"
                                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.color = '#ef4444' }}
                                    onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Contact Info Chips - Minimalist Style */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '5px' }}>
                            {sup.phone && (
                                <a href={`tel:${sup.phone}`} className="glass-btn" style={{
                                    fontSize: '0.8rem',
                                    padding: '6px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    textDecoration: 'none',
                                    color: '#fff',
                                    background: 'rgba(59, 130, 246, 0.15)',
                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                    borderRadius: '8px',
                                    transition: 'all 0.2s'
                                }}
                                    onMouseOver={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'}
                                    onMouseOut={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'}
                                >
                                    <Phone size={13} /> {sup.phone}
                                </a>
                            )}
                            {sup.email && (
                                <a href={`mailto:${sup.email}`} className="glass-btn" style={{
                                    fontSize: '0.8rem',
                                    padding: '6px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    textDecoration: 'none',
                                    color: '#fff',
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    borderRadius: '8px',
                                    transition: 'all 0.2s'
                                }}
                                    onMouseOver={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)'}
                                    onMouseOut={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'}
                                >
                                    <Mail size={13} /> E-Posta
                                </a>
                            )}
                        </div>

                        {/* Supply Items Tags - Intelligent Color Coding */}
                        {sup.supply_items && (
                            <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {sup.supply_items.split(',').map((item, idx) => {
                                        const cleanItem = item.trim();
                                        if (!cleanItem) return null;
                                        const tagColor = stringToColor(cleanItem); // Consistent color per tag name
                                        return (
                                            <span key={idx} style={{
                                                background: 'rgba(255,255,255,0.05)',
                                                borderLeft: `3px solid ${tagColor}`,
                                                borderRadius: '4px',
                                                padding: '3px 8px',
                                                fontSize: '0.75rem',
                                                color: '#ddd',
                                                display: 'inline-block'
                                            }}>
                                                {cleanItem}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* MODAL */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
                    <div className="glass-panel" style={{ width: '500px', padding: '30px', background: '#1e1e1e' }}>
                        <h2 style={{ marginTop: 0 }}>{editingSupplier ? 'Tedarikçi Düzenle' : 'Yeni Tedarikçi'}</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input className="glass-input" placeholder="Şirket Adı *" required value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input className="glass-input" placeholder="Yetkili Kişi" value={formData.contact_name} onChange={e => setFormData({ ...formData, contact_name: e.target.value })} style={{ flex: 1 }} />
                                <input className="glass-input" placeholder="Telefon" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{ flex: 1 }} />
                            </div>
                            <input className="glass-input" placeholder="E-Posta" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            <textarea className="glass-input" placeholder="Tedarik Kalemleri (Örn: Kablo, Kamera, Vida...)" value={formData.supply_items} onChange={e => setFormData({ ...formData, supply_items: e.target.value })} style={{ minHeight: '100px' }} />

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="glass-btn" style={{ background: '#444' }}>İptal</button>
                                <button type="submit" className="glass-btn" style={{ background: '#f59e0b' }}>Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Suppliers;
