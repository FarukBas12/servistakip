import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { ArrowLeft, Upload, Save, Trash2, Search, Plus } from 'lucide-react';

const PaymentCreate = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Header Data
    const [header, setHeader] = useState({
        title: '',
        payment_date: new Date().toISOString().split('T')[0],
        subcontractor_id: searchParams.get('subId') || ''
    });

    // Items Data
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState({ work_item: '', detail: '', quantity: '', unit_price: '' });

    // Excel Parser
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 }); // Array of arrays

            // Parse: Expect "İş Kalemi" in first column. 
            // We ignore price/qty from excel as per user request, but if they exist we can try to read 'detail'
            const parsed = [];
            data.forEach((cols, index) => {
                if (index === 0) return; // Skip potential header? Or simple logic: check if row has content

                const workItem = String(cols[0] || '').trim();
                if (!workItem || workItem.toLowerCase().includes('iş kalemi')) return;

                const detail = String(cols[1] || '').trim();

                parsed.push({
                    id: Date.now() + Math.random(),
                    work_item: workItem,
                    detail: detail,
                    quantity: '', // Manual
                    unit_price: '' // Manual
                });
            });

            setItems(prev => [...prev, ...parsed]);
        };
        reader.readAsBinaryString(file);
    };

    // Table Handlers
    const updateItem = (id, field, value) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const deleteItem = (id) => {
        setItems(items.filter(item => item.id !== id));
    };

    const calculateTotal = () => {
        return items.reduce((acc, item) => {
            const qty = parseFloat(item.quantity) || 0;
            const price = parseFloat(item.unit_price) || 0;
            return acc + (qty * price);
        }, 0);
    };

    const handleSubmit = async () => {
        if (!header.title) return alert('Lütfen Mağaza/Proje Adı giriniz.');
        if (items.length === 0) return alert('Lütfen kalem ekleyiniz.');

        try {
            await api.post('/payments', {
                ...header,
                items: items
            });
            alert('Hakediş başarıyla oluşturuldu!');
            navigate('/admin/payments');
        } catch (err) {
            console.error(err);
            alert('Kaydetme başarısız!');
        }
    };

    return (
        <div className="dashboard">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                <button onClick={() => navigate('/admin/payments')} className="glass-btn" style={{ padding: '8px' }}>
                    <ArrowLeft size={20} />
                </button>
                <h2 style={{ margin: 0 }}>Yeni Hakediş Oluştur</h2>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
                {/* Header Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', opacity: 0.7 }}>Mağaza / Proje Adı</label>
                        <input
                            className="glass-input"
                            value={header.title}
                            onChange={(e) => setHeader({ ...header, title: e.target.value })}
                            placeholder="Örn: Hacıoğlu Erenler / Sakarya"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', opacity: 0.7 }}>Tarih</label>
                        <input
                            type="date"
                            className="glass-input"
                            value={header.payment_date}
                            onChange={(e) => setHeader({ ...header, payment_date: e.target.value })}
                        />
                    </div>
                </div>

                {/* Import Area */}
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Upload size={18} /> Excel'den Kalem Aktar
                    </h4>
                    <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '15px' }}>
                        Yalnızca <b>İş Kalemi</b> ve <b>Detay</b> içeren Excel dosyanızı seçin. (Sütun 1: Kalem Adı, Sütun 2: Detay)
                    </p>
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileUpload}
                        className="glass-input"
                        style={{ width: 'auto' }}
                    />
                </div>

                {/* Items Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                <th style={{ padding: '10px' }}>İş Kalemi</th>
                                <th style={{ padding: '10px' }}>Detay</th>
                                <th style={{ padding: '10px', width: '120px' }}>Metraj</th>
                                <th style={{ padding: '10px', width: '150px' }}>Birim Fiyat</th>
                                <th style={{ padding: '10px', textAlign: 'right' }}>Tutar</th>
                                <th style={{ width: '50px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '10px' }}>{item.work_item}</td>
                                    <td style={{ padding: '10px', opacity: 0.8 }}>{item.detail}</td>
                                    <td style={{ padding: '5px' }}>
                                        <input
                                            className="glass-input"
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                            placeholder="0"
                                            style={{ textAlign: 'center' }}
                                        />
                                    </td>
                                    <td style={{ padding: '5px' }}>
                                        <input
                                            className="glass-input"
                                            type="number"
                                            value={item.unit_price}
                                            onChange={(e) => updateItem(item.id, 'unit_price', e.target.value)}
                                            placeholder="0.00"
                                            style={{ textAlign: 'center' }}
                                        />
                                    </td>
                                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                                        {((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button onClick={() => deleteItem(item.id)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ padding: '30px', textAlign: 'center', opacity: 0.5 }}>
                                        Henüz kalem eklenmedi. Excel yükleyin veya manuel ekleyin.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: 'rgba(76, 175, 80, 0.2)', fontSize: '1.2rem' }}>
                                <td colSpan="4" style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>TOPLAM HAKEDİŞ:</td>
                                <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: '#4caf50' }}>{calculateTotal().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleSubmit} className="glass-btn" style={{ background: 'rgba(76, 175, 80, 0.3)', padding: '15px 30px', fontSize: '1.1rem', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <Save size={20} /> Hakedişi Kaydet
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentCreate;
