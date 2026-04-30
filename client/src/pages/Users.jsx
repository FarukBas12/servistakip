import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Users, Plus, Save, Trash2, Search, Phone, Calendar, User, Shield, Upload, FileText } from 'lucide-react';
import { getInitials, stringToColor } from '../utils/helpers';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '', password: '', role: 'technician',
        full_name: '', phone: '', start_date: new Date().toLocaleDateString('en-CA'), photo_url: '',
        job_title: '', status: 'active'
    });
    const [documents, setDocuments] = useState([]);
    const [docType, setDocType] = useState('Giriş Evrağı');
    const [docUploading, setDocUploading] = useState(false);
    const [photoUploading, setPhotoUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/auth/users');
            setUsers(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleEditUser = async (user) => {
        setFormData({
            username: user.username,
            password: '',
            role: user.role,
            full_name: user.full_name || '',
            phone: user.phone || '',
            start_date: user.start_date ? user.start_date.split('T')[0] : '',
            photo_url: user.photo_url || '',
            job_title: user.job_title || '',
            status: user.status || 'active'
        });
        setEditingUser(user);
        setShowUserForm(true);
        try {
            const res = await api.get(`/auth/${user.id}/documents`);
            setDocuments(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const resetForm = () => {
        setFormData({
            username: '', password: '', role: 'technician',
            full_name: '', phone: '', start_date: new Date().toLocaleDateString('en-CA'), photo_url: '',
            job_title: '', status: 'active'
        });
        setEditingUser(null);
        setDocuments([]);
        setShowUserForm(true);
    };

    const handleUserChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setPhotoUploading(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('photo', file);
            const res = await api.post('/auth/upload-photo', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData({ ...formData, photo_url: res.data.url });
        } catch (err) {
            alert('Fotoğraf yüklenemedi');
        }
        setPhotoUploading(false);
    };

    const handleDocUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !editingUser) return;

        setDocUploading(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('document', file);
            formDataUpload.append('document_type', docType);

            const res = await api.post(`/auth/${editingUser.id}/documents`, formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setDocuments([res.data, ...documents]);
        } catch (err) {
            alert('Evrak yüklenemedi');
        }
        setDocUploading(false);
        e.target.value = null;
    };

    const handleDocDelete = async (docId) => {
        if (!window.confirm('Evrağı silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/auth/documents/${docId}`);
            setDocuments(documents.filter(d => d.id !== docId));
        } catch (err) {
            alert('Silme başarısız');
        }
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                const updateData = { ...formData };
                if (!updateData.password) delete updateData.password;
                await api.put(`/auth/${editingUser.id}`, updateData);
                alert('Kullanıcı güncellendi!');
            } else {
                await api.post('/auth/register', formData);
                alert('Kullanıcı oluşturuldu!');
            }
            resetForm();
            setShowUserForm(false);
            fetchUsers();
        } catch (err) {
            alert('İşlem başarısız: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
            try {
                await api.delete(`/auth/${id}`);
                fetchUsers();
                setShowUserForm(false);
            } catch (err) { alert('Silme başarısız'); }
        }
    };

    // Filter Logic
    const filteredUsers = users.filter(u =>
        (u.full_name || u.username).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.role || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const roleColors = {
        admin: { bg: 'rgba(239, 68, 68, 0.2)', text: '#fca5a5', border: 'rgba(239, 68, 68, 0.4)' },
        technician: { bg: 'rgba(59, 130, 246, 0.2)', text: '#93c5fd', border: 'rgba(59, 130, 246, 0.4)' },
        depocu: { bg: 'rgba(234, 179, 8, 0.2)', text: '#fde047', border: 'rgba(234, 179, 8, 0.4)' }
    };

    const roleLabels = {
        admin: 'Yönetici',
        technician: 'Teknisyen',
        depocu: 'Depo Sorumlusu'
    };

    return (
        <div className="dashboard fade-in">
            <style>{`
                .user-card {
                    transition: all 0.2s;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .user-card:hover {
                    transform: translateY(-3px);
                    background: rgba(255,255,255,0.03);
                    border-color: rgba(255,255,255,0.1);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', background: 'linear-gradient(90deg, #e0e7ff, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Personel Yönetimi</h2>
                    <p style={{ margin: '5px 0 0', color: '#5a6d8a' }}>Sistem kullanıcıları ve yetkilendirme</p>
                </div>
                <button onClick={resetForm} className="glass-btn primary-btn" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={20} /> Yeni Personel
                </button>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: '25px', position: 'relative', maxWidth: '400px' }}>
                <Search size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                <input
                    className="glass-input"
                    placeholder="İsim veya rol ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '45px', width: '100%', borderRadius: '12px', background: 'rgba(0,0,0,0.2)' }}
                />
            </div>

            {/* User Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {filteredUsers.map(user => (
                    <div key={user.id} className="glass-panel user-card" style={{ padding: '20px', borderRadius: '16px', position: 'relative', overflow: 'hidden', opacity: user.status === 'passive' ? 0.6 : 1, filter: user.status === 'passive' ? 'grayscale(0.5)' : 'none' }}>
                        {/* Header with Role */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                            <div style={{
                                width: '60px', height: '60px', borderRadius: '50%',
                                background: user.photo_url ? `url(${user.photo_url}) center/cover` : stringToColor(user.username),
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.5rem', fontWeight: 'bold', color: 'white',
                                border: '3px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
                            }}>
                                {!user.photo_url && getInitials(user.full_name || user.username)}
                            </div>
                            <span style={{
                                padding: '4px 12px', borderRadius: '20px',
                                background: user.status === 'passive' ? 'rgba(239, 68, 68, 0.2)' : (roleColors[user.role]?.bg || roleColors.technician.bg),
                                color: user.status === 'passive' ? '#ef4444' : (roleColors[user.role]?.text || roleColors.technician.text),
                                border: `1px solid ${user.status === 'passive' ? 'rgba(239, 68, 68, 0.4)' : (roleColors[user.role]?.border || 'transparent')}`,
                                fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase'
                            }}>
                                {user.status === 'passive' ? 'PASİF' : (roleLabels[user.role] || user.role)}
                            </span>
                        </div>

                        {/* Info */}
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem' }}>{user.full_name || user.username}</h3>
                        {user.job_title && (
                            <p style={{ margin: '0 0 10px 0', color: 'var(--accent-color)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                {user.job_title}
                            </p>
                        )}
                        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem', marginBottom: '15px' }}>@{user.username}</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: '#aaa' }}>
                            {user.phone && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Phone size={16} /> {user.phone}
                                </div>
                            )}
                            {user.start_date && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Calendar size={16} /> {new Date(user.start_date).toLocaleDateString('tr-TR')}
                                </div>
                            )}
                        </div>

                        {/* Action - Overlay Button */}
                        <button
                            onClick={() => handleEditUser(user)}
                            className="glass-btn"
                            style={{
                                marginTop: '20px', width: '100%', justifyContent: 'center',
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            Düzenle / Detay
                        </button>
                    </div>
                ))}
            </div>

            {/* MODAL FORM */}
            {showUserForm && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', background: '#1e1e1e', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <button onClick={() => setShowUserForm(false)} style={{ position: 'absolute', top: 15, right: 15, background: 'transparent', border: 'none', color: '#666', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>

                        <h3 style={{ marginBottom: '25px', color: '#fff' }}>{editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Oluştur'}</h3>

                        <form onSubmit={handleUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {/* Photo Upload */}
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: formData.photo_url ? `url(${formData.photo_url}) center/cover` : '#333', border: '2px dashed #666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {!formData.photo_url && <User size={40} color="#666" />}
                                    </div>
                                    <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                    <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#2196f3', borderRadius: '50%', padding: '5px', pointerEvents: 'none' }}>
                                        {photoUploading ? '...' : <Plus size={14} color="white" />}
                                    </div>
                                </div>
                            </div>

                            <input className="glass-input" name="full_name" placeholder="Ad Soyad" value={formData.full_name} onChange={handleUserChange} />
                            <input className="glass-input" name="phone" placeholder="Telefon" value={formData.phone} onChange={handleUserChange} />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <input className="glass-input" name="username" placeholder="Kullanıcı Adı" value={formData.username} onChange={handleUserChange} required disabled={!!editingUser} />
                                <input className="glass-input" name="password" type="password" placeholder={editingUser ? "Yeni Şifre (Boş bırakılabilir)" : "Şifre"} value={formData.password} onChange={handleUserChange} required={!editingUser} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <select className="glass-input" name="role" value={formData.role} onChange={handleUserChange} style={{ background: '#2a2a2a', color: 'white' }}>
                                    <option value="technician">Panel Yetkisi: Teknisyen</option>
                                    <option value="depocu">Panel Yetkisi: Depocu</option>
                                    <option value="admin">Panel Yetkisi: Admin</option>
                                </select>
                                <select className="glass-input" name="job_title" value={formData.job_title} onChange={handleUserChange} style={{ background: '#2a2a2a', color: 'white' }}>
                                    <option value="">Görev Ünvanı Seçin</option>
                                    <option value="Şirket Sahibi">Şirket Sahibi</option>
                                    <option value="Şirket Koordinatörü">Şirket Koordinatörü</option>
                                    <option value="Muhasebe">Muhasebe</option>
                                    <option value="Şantiye Şefi">Şantiye Şefi</option>
                                    <option value="Depo Sorumlusu">Depo Sorumlusu</option>
                                    <option value="Teknisyen">Teknisyen</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <select className="glass-input" name="status" value={formData.status} onChange={handleUserChange} style={{ background: '#2a2a2a', color: 'white' }}>
                                    <option value="active">Durum: Aktif</option>
                                    <option value="passive">Durum: Pasif</option>
                                </select>
                                <input type="date" className="glass-input" name="start_date" value={formData.start_date} onChange={handleUserChange} />
                            </div>

                            {editingUser && (
                                <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                                    <h4 style={{ margin: '0 0 15px 0', color: '#e2e8f0' }}>Evrak Yönetimi</h4>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                        <select className="glass-input" value={docType} onChange={e => setDocType(e.target.value)} style={{ flex: 1, background: '#2a2a2a', color: 'white' }}>
                                            <option value="Giriş Evrağı">Giriş Evrağı</option>
                                            <option value="Çıkış Evrağı">Çıkış Evrağı</option>
                                            <option value="Kimlik Fotokopisi">Kimlik Fotokopisi</option>
                                            <option value="Sağlık Raporu">Sağlık Raporu</option>
                                            <option value="Sözleşme">Sözleşme</option>
                                            <option value="Diğer Evrak">Diğer Evrak</option>
                                        </select>
                                        <label className="glass-btn primary-btn" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            {docUploading ? 'Yükleniyor...' : <><Upload size={16} /> Yükle</>}
                                            <input type="file" accept="image/*,.pdf" onChange={handleDocUpload} style={{ display: 'none' }} disabled={docUploading} />
                                        </label>
                                    </div>

                                    {documents.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                                            {documents.map(doc => (
                                                <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{doc.document_type}</span>
                                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(doc.created_at).toLocaleDateString('tr-TR')}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="glass-btn" style={{ padding: '6px' }} title="Görüntüle">
                                                            <FileText size={16} color="#3b82f6" />
                                                        </a>
                                                        <button type="button" onClick={() => handleDocDelete(doc.id)} className="glass-btn" style={{ padding: '6px' }} title="Sil">
                                                            <Trash2 size={16} color="#ef4444" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center', margin: 0 }}>Henüz evrak yüklenmemiş.</p>
                                    )}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <button type="submit" className="glass-btn primary-btn" style={{ flex: 1, padding: '12px' }}>
                                    <Save size={18} style={{ marginRight: '8px' }} /> Kaydet
                                </button>
                                {editingUser && editingUser.username !== 'admin' && (
                                    <button type="button" onClick={() => handleDeleteUser(editingUser.id)} className="glass-btn" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '12px' }}>
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPage;
