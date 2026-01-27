import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Save, Lock, Shield, Database } from 'lucide-react';

const Settings = () => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/subs/settings/all');
            setPassword(res.data.delete_password);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleSave = async () => {
        try {
            await api.put('/subs/settings/all', { delete_password: password });
            alert('Ayarlar Kaydedildi');
        } catch (err) { console.error(err); alert('Hata'); }
    };

    if (loading) return <div>Yükleniyor...</div>;

    return (
        <div className="dashboard">
            <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield size={28} color="#4caf50" />
                Güvenlik Ayarları
            </h2>

            <div className="glass-panel" style={{ padding: '30px', maxWidth: '500px' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Lock size={20} />
                    Taşeron Silme Şifresi
                </h3>
                <p style={{ opacity: 0.7, marginBottom: '20px' }}>
                    Bu şifre, taşeronları veya kritik verileri silerken sorulacaktır.
                </p>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '10px' }}>Şifre Belirle</label>
                    <input
                        type="text"
                        className="glass-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Örn: 123456"
                    />
                </div>

                <button onClick={handleSave} className="glass-btn" style={{ background: '#4caf50', width: '100%', justifyContent: 'center' }}>
                    <Save size={18} style={{ marginRight: '10px' }} /> Kaydet
                </button>
            </div>

            {/* Backup Section */}
            <h2 style={{ marginBottom: '20px', marginTop: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Database size={28} color="#2196f3" />
                Veri Yönetimi
            </h2>

            <div className="glass-panel" style={{ padding: '30px', maxWidth: '500px' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Database size={20} />
                    Veritabanı Yedekle
                </h3>
                <p style={{ opacity: 0.7, marginBottom: '20px' }}>
                    Tüm verileri (Kullanıcılar, Stoklar, Projeler, Hakedişler vb.) tek bir dosya olarak Cloudinary'e yedekler.
                    Yedekleme her gece 03:00'te otomatik yapılır.
                </p>

                <button
                    onClick={async () => {
                        if (!window.confirm('Şimdi yedek almak istiyor musunuz?')) return;
                        try {
                            setLoading(true);
                            const res = await api.post('/backup');
                            alert('Yedek Başarıyla Oluşturuldu! URL: ' + res.data.url);
                            window.open(res.data.url, '_blank');
                        } catch (err) {
                            alert('Yedekleme Başarısız: ' + (err.response?.data?.message || err.message));
                        } finally {
                            setLoading(false);
                        }
                    }}
                    className="glass-btn"
                    style={{ background: '#2196f3', width: '100%', justifyContent: 'center' }}
                >
                    <Save size={18} style={{ marginRight: '10px' }} /> Şimdi Yedekle
                </button>
            </div>
        </div>
    );
};

export default Settings;
