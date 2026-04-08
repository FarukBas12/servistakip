import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Check, X, Eye, FileText, Calendar, User, Tag } from 'lucide-react';

const ExpenseList = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);

    const fetchExpenses = async () => {
        try {
            const res = await api.get('/expenses');
            setExpenses(res.data);
        } catch (err) {
            toast.error('Harcamalar yüklenemedi!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.put(`/expenses/${id}/status`, { status });
            toast.success(status === 'approved' ? 'Harcama onaylandı' : 'Harcama reddedildi');
            fetchExpenses();
        } catch (err) {
            toast.error('Durum güncellenemedi!');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Yükleniyor...</div>;

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Masraf Takibi</h1>
                    <p className="text-slate-500 mt-1">Personel harcamalarını ve fişlerini buradan yönetin.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-sm font-semibold uppercase tracking-wider">
                                <th className="px-6 py-4">Tarih</th>
                                <th className="px-6 py-4">Personel</th>
                                <th className="px-6 py-4">Kategori</th>
                                <th className="px-6 py-4">Açıklama</th>
                                <th className="px-6 py-4">Tutar</th>
                                <th className="px-6 py-4 text-center">Fiş</th>
                                <th className="px-6 py-4">Durum</th>
                                <th className="px-6 py-4 text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {expenses.map((exp) => (
                                <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                        {new Date(exp.created_at).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                                                {exp.username.substring(0, 2)}
                                            </div>
                                            <span className="font-medium text-slate-700">{exp.full_name || exp.username}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
                                            {exp.category === 'Fuel' ? '⛽ Yakıt' : exp.category === 'Food' ? '🍔 Yemek' : exp.category === 'Material' ? '🛠️ Malzeme' : '➕ Diğer'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                                        {exp.description || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">
                                        ₺{parseFloat(exp.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {exp.receipt_url && (
                                            <button 
                                                onClick={() => setSelectedImage(exp.receipt_url)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Fişi Görüntüle"
                                            >
                                                <Eye size={20} />
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                            exp.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                            exp.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                            {exp.status === 'approved' ? 'Onaylandı' : exp.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {exp.status === 'pending' && (
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleStatusUpdate(exp.id, 'approved')}
                                                    className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all"
                                                >
                                                    <Check size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleStatusUpdate(exp.id, 'rejected')}
                                                    className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-all"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Image Preview Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
                    <div className="relative max-w-3xl w-full bg-white rounded-2xl p-2" onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-12 -right-4 p-2 text-white hover:text-slate-300"
                        >
                            <X size={32} />
                        </button>
                        <img src={selectedImage} alt="Receipt" className="w-full h-auto rounded-xl" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenseList;
