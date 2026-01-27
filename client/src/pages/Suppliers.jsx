import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Truck, Plus, Trash2, Edit2, Phone, Mail, User, Package } from 'lucide-react';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
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

    if (loading) return <div>Yükleniyor...</div>;

    return (
        <div className="dashboard">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Truck size={32} color="#f59e0b" />
                    Tedarikçiler
                </h1>
                <button onClick={() => { setEditingSupplier(null); setFormData({ company_name: '', contact_name: '', email: '', phone: '', supply_items: '' }); setShowModal(true); }} className="glass-btn" style={{ background: '#f59e0b', color: 'white' }}>
                    <Plus size={20} style={{ marginRight: '5px' }} /> Yeni Tedarikçi
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                {suppliers.map(sup => (
                    <div key={sup.id} className="glass-panel" style={{ padding: '20px', position: 'relative' }}>
                        <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>{sup.company_name}</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: '#ccc' }}>
                            {sup.contact_name && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><User size={16} /> {sup.contact_name}</div>}
                            {sup.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={16} /> <a href={`tel:${sup.phone}`} style={{ color: '#60a5fa' }}>{sup.phone}</a></div>}
                            {sup.email && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={16} /> <a href={`mailto:${sup.email}`} style={{ color: '#60a5fa' }}>{sup.email}</a></div>}

                            {sup.supply_items && (
                                <div style={{ marginTop: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '5px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px', color: '#f59e0b' }}><Package size={14} /> Tedarik Kalemleri:</div>
                                    {sup.supply_items}
                                </div>
                            )}
                        </div>

                        <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '10px' }}>
                            <button onClick={() => openEdit(sup)} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer' }} title="Düzenle"><Edit2 size={18} /></button>
                            <button onClick={() => handleDelete(sup.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Sil"><Trash2 size={18} /></button>
                        </div>
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
