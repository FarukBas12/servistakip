import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { User, Mail, Phone, Lock, Save, Camera, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [photoUploading, setPhotoUploading] = useState(false);
    
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/me');
            setUser(res.data);
            setFormData({
                full_name: res.data.full_name || '',
                phone: res.data.phone || '',
                password: '',
                confirmPassword: ''
            });
            setLoading(false);
        } catch (err) {
            toast.error('Profil bilgileri alınamadı');
            setLoading(false);
        }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setPhotoUploading(true);
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('photo', file);
            const res = await api.post('/auth/upload-photo', uploadFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Profil resmini veritabanında güncelle
            await api.put(`/auth/${user.id}`, { photo_url: res.data.url });
            
            setUser({ ...user, photo_url: res.data.url });
            toast.success('Profil fotoğrafı güncellendi');
        } catch (err) {
            toast.error('Fotoğraf yüklenemedi');
        }
        setPhotoUploading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password && formData.password !== formData.confirmPassword) {
            return toast.error('Şifreler eşleşmiyor');
        }

        setSaving(true);
        try {
            const updateData = {
                full_name: formData.full_name,
                phone: formData.phone
            };
            
            if (formData.password) {
                updateData.password = formData.password;
            }

            await api.put(`/auth/${user.id}`, updateData);
            toast.success('Profil başarıyla güncellendi');
            setFormData({ ...formData, password: '', confirmPassword: '' });
            fetchProfile();
        } catch (err) {
            toast.error('Güncelleme başarısız');
        }
        setSaving(false);
    };

    if (loading) return <div className="dashboard"><div className="spinner"></div></div>;

    const roleLabels = { admin: 'Yönetici', technician: 'Teknisyen', depocu: 'Depo Sorumlusu' };

    return (
        <div className="dashboard fade-in">
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ marginBottom: '30px' }}>
                    <h2 style={{ margin: 0, fontSize: '2rem', background: 'linear-gradient(90deg, #fff, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Profil Ayarları</h2>
                    <p style={{ color: '#5a6d8a', marginTop: '5px' }}>Kişisel bilgilerinizi ve şifrenizi buradan yönetebilirsiniz.</p>
                </div>

                <div className="glass-panel" style={{ padding: '40px', borderRadius: '24px' }}>
                    <form onSubmit={handleSubmit}>
                        {/* Profile Photo Section */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{ 
                                    width: '120px', height: '120px', borderRadius: '50%', 
                                    background: user.photo_url ? `url(${user.photo_url}) center/cover` : 'var(--glass-surface)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '4px solid var(--primary)',
                                    boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)'
                                }}>
                                    {!user.photo_url && <User size={50} color="var(--primary)" />}
                                </div>
                                <label style={{ 
                                    position: 'absolute', bottom: '5px', right: '5px', 
                                    background: 'var(--primary)', padding: '8px', borderRadius: '50%',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)', transition: 'transform 0.2s'
                                }} className="hover-scale">
                                    {photoUploading ? '...' : <Camera size={18} color="white" />}
                                    <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                                </label>
                            </div>
                            <h3 style={{ marginTop: '15px', marginBottom: '5px' }}>{user.full_name || user.username}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                <ShieldCheck size={14} /> {roleLabels[user.role]}
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#94a3b8' }}>Ad Soyad</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
                                    <input className="glass-input" name="full_name" value={formData.full_name} onChange={handleChange} style={{ paddingLeft: '45px', width: '100%' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#94a3b8' }}>Telefon Numarası</label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
                                    <input className="glass-input" name="phone" value={formData.phone} onChange={handleChange} style={{ paddingLeft: '45px', width: '100%' }} />
                                </div>
                            </div>
                        </div>

                        <div style={{ height: '1px', background: 'var(--glass-border)', margin: '40px 0' }}></div>

                        <h4 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Lock size={18} color="var(--primary)" /> Şifre Değiştir
                        </h4>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#94a3b8' }}>Yeni Şifre</label>
                                <input type="password" className="glass-input" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" style={{ width: '100%' }} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#94a3b8' }}>Şifre Tekrar</label>
                                <input type="password" className="glass-input" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" style={{ width: '100%' }} />
                            </div>
                        </div>

                        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="glass-btn glass-btn-primary" disabled={saving} style={{ padding: '12px 30px', minWidth: '160px' }}>
                                {saving ? 'Kaydediliyor...' : <><Save size={18} style={{ marginRight: '8px' }} /> Değişiklikleri Kaydet</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
