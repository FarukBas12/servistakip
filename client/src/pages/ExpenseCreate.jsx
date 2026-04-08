import React, { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Camera, CreditCard, ChevronLeft, Wallet, Upload } from 'lucide-react';

const ExpenseCreate = () => {
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Fuel');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || !image) {
            return toast.error('Lütfen tutar girin ve fiş fotoğrafı ekleyin!');
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('photo', image);
            
            const photoRes = await api.post('/auth/upload-photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            await api.post('/expenses', {
                amount: parseFloat(amount),
                category,
                description,
                receipt_url: photoRes.data.url
            });

            toast.success('Harcamanız onaya gönderildi!');
            navigate(-1);
        } catch (err) {
            toast.error('Harcama kaydedilemedi!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard" style={{ paddingBottom: '100px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                <button 
                    onClick={() => navigate(-1)} 
                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'white' }}>Masraf / Fiş Ekle</h1>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* TUTAR KARTI */}
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '12px', fontWeight: '500' }}>Harcama Tutarı</label>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.4rem', fontWeight: 'bold', color: '#818cf8' }}>₺</span>
                        <input
                            type="number"
                            step="0.01"
                            className="premium-input"
                            style={{ 
                                paddingLeft: '45px', 
                                fontSize: '1.8rem', 
                                fontWeight: 'bold', 
                                background: 'rgba(0,0,0,0.3)', 
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white'
                            }}
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {/* KATEGORİ SEÇİMİ */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[
                        { id: 'Fuel', label: '⛽ Yakıt' },
                        { id: 'Food', label: '🍔 Yemek' },
                        { id: 'Material', label: '🛠️ Malzeme' },
                        { id: 'Other', label: '➕ Diğer' }
                    ].map(cat => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategory(cat.id)}
                            style={{
                                padding: '16px',
                                borderRadius: '14px',
                                border: category === cat.id ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.05)',
                                background: category === cat.id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255,255,255,0.03)',
                                color: category === cat.id ? 'white' : 'rgba(255,255,255,0.5)',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontSize: '0.95rem'
                            }}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* FİŞ FOTOĞRAFI */}
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '15px', fontWeight: '500' }}>Fiş / Fatura Fotoğrafı</label>
                    
                    <div style={{ 
                        position: 'relative', 
                        aspectRatio: '16/9', 
                        borderRadius: '16px', 
                        overflow: 'hidden', 
                        background: 'rgba(0,0,0,0.4)',
                        border: '2px dashed rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {preview ? (
                            <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)' }}>
                                <Camera size={44} style={{ marginBottom: '12px' }} />
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>Fişi Fotoğrafla</p>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleImageChange}
                            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                            required
                        />
                    </div>
                </div>

                {/* AÇIKLAMA */}
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '12px', fontWeight: '500' }}>Harcama Hakkında Not</label>
                    <textarea
                        className="premium-input"
                        style={{ 
                            minHeight: '90px', 
                            paddingTop: '12px',
                            background: 'rgba(0,0,0,0.3)', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white'
                        }}
                        placeholder="Kısa bir açıklama yazın..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                </div>

                {/* GÖNDER BUTONU */}
                <button
                    disabled={loading}
                    type="submit"
                    style={{ 
                        background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        border: 'none',
                        color: 'white',
                        padding: '18px', 
                        borderRadius: '16px',
                        fontSize: '1.05rem', 
                        fontWeight: 'bold',
                        marginTop: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)',
                        transition: 'all 0.3s'
                    }}
                >
                    {loading ? 'Gönderiliyor...' : <><Upload size={20} /> Harcamayı Sisteme Kaydet</>}
                </button>

            </form>
        </div>
    );
};

export default ExpenseCreate;

