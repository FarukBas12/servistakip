import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Save, Lock, Shield } from 'lucide-react';

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
        </div>
    );
};

export default Settings;
