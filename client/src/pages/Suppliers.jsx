import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Truck, Plus, Trash2, Edit2, Phone, Mail, User, Package, Search } from 'lucide-react';

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

    if (loading) return <div>Yükleniyor...</div>;

    return (
        <div className="dashboard">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                    <Truck size={32} color="#f59e0b" />
                    Tedarikçiler
                </h1>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                    {/* Search Bar */}
                    <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)' }} />
                        <input
                            type="text"
                            className="glass-input"
                            placeholder="Tedarikçi Ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '35px', width: '100%' }}
                        />
                    </div>

                    <button onClick={() => { setEditingSupplier(null); setFormData({ company_name: '', contact_name: '', email: '', phone: '', supply_items: '' }); setShowModal(true); }} className="glass-btn" style={{ background: '#f59e0b', color: 'white', whiteSpace: 'nowrap' }}>
                        <Plus size={20} style={{ marginRight: '5px' }} /> Yeni Tedarikçi
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                {filteredSuppliers.map(sup => (
                    <div key={sup.id} className="glass-panel" style={{ padding: '20px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '10px' }}>

                        {/* Header Section */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>{sup.company_name}</h3>
                                {sup.contact_name && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#aaa', fontSize: '0.9rem', marginTop: '5px' }}>
                                        <User size={14} /> {sup.contact_name}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button onClick={() => openEdit(sup)} className="icon-btn" style={{ color: '#60a5fa', padding: '5px' }} title="Düzenle">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(sup.id)} className="icon-btn" style={{ color: '#ef4444', padding: '5px' }} title="Sil">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Contact Info Chips */}
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {sup.phone && (
                                <a href={`tel:${sup.phone}`} className="glass-btn" style={{ fontSize: '0.8rem', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', color: '#fff', background: 'rgba(59, 130, 246, 0.2)' }}>
                                    <Phone size={14} /> {sup.phone}
                                </a>
                            )}
                            {sup.email && (
                                <a href={`mailto:${sup.email}`} className="glass-btn" style={{ fontSize: '0.8rem', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', color: '#fff', background: 'rgba(16, 185, 129, 0.2)' }}>
                                    <Mail size={14} /> E-Posta Gönder
                                </a>
                            )}
                        </div>

                        {/* Supply Items Tags */}
                        {sup.supply_items && (
                            <div style={{ marginTop: '5px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px', color: '#f59e0b', fontSize: '0.85rem' }}>
                                    <Package size={14} /> Tedarik Kalemleri
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                    {sup.supply_items.split(',').map((item, idx) => (
                                        <span key={idx} style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            borderRadius: '4px',
                                            padding: '2px 8px',
                                            fontSize: '0.8rem',
                                            color: '#ddd'
                                        }}>
                                            {item.trim()}
                                        </span>
                                    ))}
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
