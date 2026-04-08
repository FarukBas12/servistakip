import React, { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Camera, CreditCard, ChevronLeft, UploadCloud } from 'lucide-react';

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
            // 1. Upload receipt image (reuse photo upload or similar)
            const formData = new FormData();
            formData.append('photo', image);
            
            const photoRes = await api.post('/auth/upload-photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // 2. Create expense record
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
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="ml-2 text-lg font-bold">Masraf / Fiş Ekle</h1>
            </div>

            <div className="p-4 max-w-md mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Amount Input */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <label className="block text-sm font-medium text-slate-500 mb-2">Harcama Tutarı (₺)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">₺</span>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full pl-10 pr-4 py-3 text-2xl font-bold bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Category Selection */}
                    <div className="grid grid-cols-2 gap-3">
                        {['Fuel', 'Food', 'Material', 'Other'].map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setCategory(cat)}
                                className={`py-4 px-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                    category === cat 
                                    ? 'border-blue-500 bg-blue-50 text-blue-600' 
                                    : 'border-white bg-white text-slate-500 shadow-sm'
                                }`}
                            >
                                <span className="text-sm font-semibold">
                                    {cat === 'Fuel' ? '⛽ Yakıt' : cat === 'Food' ? '🍔 Yemek' : cat === 'Material' ? '🛠️ Malzeme' : '➕ Diğer'}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Receipt Image */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <label className="block text-sm font-medium text-slate-500 mb-4">Fiş / Fatura Fotoğrafı</label>
                        
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                            {preview ? (
                                <img src={preview} alt="Fiş Önizleme" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center">
                                    <Camera size={48} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-sm text-slate-400">Fişi Fotoğrafla</p>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleImageChange}
                                required
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <label className="block text-sm font-medium text-slate-500 mb-2">Açıklama (Opsiyonel)</label>
                        <textarea
                            rows="2"
                            className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500"
                            placeholder="Harcama hakkında kısa bilgi..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        ></textarea>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all ${
                            loading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                        }`}
                    >
                        {loading ? 'Gönderiliyor...' : 'Harcamayı Kaydet'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ExpenseCreate;
