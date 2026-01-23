import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Upload, FileText, Grid, Box, Image as ImageIcon, Download, DollarSign, Calendar } from 'lucide-react';

const ProjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isTech = user?.role === 'technician';

    const [project, setProject] = useState(null);
    const [files, setFiles] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('files'); // Default to files for ease

    // Modal States
    const [showFileModal, setShowFileModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);

    // Forms
    const [fileForm, setFileForm] = useState({ file: null, name: '' });
    const [expenseForm, setExpenseForm] = useState({ amount: '', category: '', description: '', receipt: null, date: new Date().toISOString().slice(0, 10) });

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const res = await api.get(`/projects/${id}`);
            setProject(res.data.project);
            setFiles(res.data.files);
            setExpenses(res.data.expenses);
            setLoading(false);
        } catch (err) {
            console.error(err);
            navigate('/admin/projects'); // Fallback
        }
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('file', fileForm.file);
        formData.append('file_name', fileForm.name);

        try {
            await api.post(`/projects/${id}/files`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setShowFileModal(false);
            setFileForm({ file: null, name: '' });
            fetchData();
        } catch (err) {
            alert('Dosya yüklenemedi');
        }
    };

    const handleExpenseAdd = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('amount', expenseForm.amount);
        formData.append('category', expenseForm.category);
        formData.append('description', expenseForm.description);
        formData.append('expense_date', expenseForm.date);
        if (expenseForm.receipt) formData.append('receipt', expenseForm.receipt);

        try {
            await api.post(`/projects/${id}/expenses`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setShowExpenseModal(false);
            setExpenseForm({ amount: '', category: '', description: '', receipt: null, date: new Date().toISOString().slice(0, 10) });
            fetchData();
        } catch (err) {
            alert('Gider eklenemedi');
        }
    };

    const getFileIcon = (type) => {
        if (type.includes('pdf')) return <FileText color="#e74c3c" />;
        if (type.includes('excel') || type.includes('sheet')) return <Grid color="#27ae60" />;
        if (type.includes('image')) return <ImageIcon color="#f39c12" />;
        if (type.includes('raw') || type.includes('dwg')) return <Box color="#3498db" />; // DWG essentially
        return <FileText color="#aaa" />;
    };

    if (loading) return <div style={{ padding: '20px', color: 'white' }}>Yükleniyor...</div>;

    return (
        <div style={{ padding: '20px', minHeight: '100vh', color: 'white' }}>
            {/* HERADER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <button onClick={() => navigate('/admin/projects')} className="glass-btn">
                    <ArrowLeft size={18} /> Geri
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem' }}>{project.name}</h1>
                    <div style={{ display: 'flex', gap: '15px', color: '#aaa', fontSize: '0.9rem', marginTop: '5px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Calendar size={14} /> {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            {/* TABS */}
            <div style={{ display: 'flex', borderBottom: '1px solid #333', marginBottom: '20px' }}>
                <button
                    onClick={() => setActiveTab('files')}
                    style={{ padding: '10px 20px', background: 'transparent', border: 'none', borderBottom: activeTab === 'files' ? '2px solid #4facfe' : 'none', color: activeTab === 'files' ? '#4facfe' : '#aaa', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    📂 PROJE DOSYALARI (DWG/PDF)
                </button>
                {!isTech && (
                    <button
                        onClick={() => setActiveTab('expenses')}
                        style={{ padding: '10px 20px', background: 'transparent', border: 'none', borderBottom: activeTab === 'expenses' ? '2px solid #f0932b' : 'none', color: activeTab === 'expenses' ? '#f0932b' : '#aaa', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        💰 GİDERLER & FİŞLER
                    </button>
                )}
            </div>

            {/* FILES CONTENT */}
            {activeTab === 'files' && (
                <div>
                    {!isTech && (
                        <button onClick={() => setShowFileModal(true)} className="glass-btn" style={{ marginBottom: '20px', background: '#3498db' }}>
                            <Upload size={16} style={{ marginRight: '5px' }} /> Dosya Yükle
                        </button>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                        {files.map(file => (
                            <div key={file.id} style={{ background: '#252525', padding: '15px', borderRadius: '10px', border: '1px solid #444', textAlign: 'center' }}>
                                <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
                                    {getFileIcon(file.file_type || 'raw')}
                                </div>
                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {file.file_name}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '10px' }}>
                                    {new Date(file.uploaded_at).toLocaleDateString()}
                                </div>
                                <a href={file.file_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', background: '#333', borderRadius: '5px', color: 'white', textDecoration: 'none', fontSize: '0.8rem' }}>
                                    <Download size={14} /> İndir
                                </a>
                            </div>
                        ))}
                    </div>
                    {files.length === 0 && <p style={{ color: '#666' }}>Henüz dosya yüklenmemiş.</p>}
                </div>
            )}

            {/* EXPENSES CONTENT (Admin Only) */}
            {activeTab === 'expenses' && !isTech && (
                <div>
                    <button onClick={() => setShowExpenseModal(true)} className="glass-btn" style={{ marginBottom: '20px', background: '#e67e22' }}>
                        <DollarSign size={16} style={{ marginRight: '5px' }} /> Gider Fişi Ekle
                    </button>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ddd' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #444', textAlign: 'left' }}>
                                    <th style={{ padding: '10px' }}>Tarih</th>
                                    <th style={{ padding: '10px' }}>Kategori</th>
                                    <th style={{ padding: '10px' }}>Açıklama</th>
                                    <th style={{ padding: '10px' }}>Tutar</th>
                                    <th style={{ padding: '10px' }}>Fiş</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map(exp => (
                                    <tr key={exp.id} style={{ borderBottom: '1px solid #333' }}>
                                        <td style={{ padding: '10px' }}>{new Date(exp.expense_date).toLocaleDateString()}</td>
                                        <td style={{ padding: '10px' }}>{exp.category}</td>
                                        <td style={{ padding: '10px' }}>{exp.description}</td>
                                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#e67e22' }}>{exp.amount} TL</td>
                                        <td style={{ padding: '10px' }}>
                                            {exp.receipt_url ? (
                                                <a href={exp.receipt_url} target="_blank" rel="noopener noreferrer" style={{ color: '#3498db' }}>Görüntüle</a>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {expenses.length === 0 && <p style={{ color: '#666', marginTop: '10px' }}>Henüz gider kaydı yok.</p>}
                </div>
            )}

            {/* UPLOAD FILE MODAL */}
            {showFileModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#1e1e1e', padding: '30px', borderRadius: '15px', width: '400px', border: '1px solid #333' }}>
                        <h3>Dosya Yükle</h3>
                        <form onSubmit={handleFileUpload}>
                            <input type="text" placeholder="Dosya Görünür Adı (örn: Mimari Plan)" required value={fileForm.name} onChange={e => setFileForm({ ...fileForm, name: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#333', border: 'none', color: 'white', borderRadius: '5px' }} />
                            <input type="file" required onChange={e => setFileForm({ ...fileForm, file: e.target.files[0] })} style={{ marginBottom: '15px', color: 'white' }} />
                            <br />
                            <button type="button" onClick={() => setShowFileModal(false)} style={{ marginRight: '10px', padding: '8px 15px', borderRadius: '5px', border: 'none', background: '#444', color: 'white' }}>İptal</button>
                            <button type="submit" style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', background: '#3498db', color: 'white' }}>Yükle</button>
                        </form>
                    </div>
                </div>
            )}

            {/* EXPENSE MODAL */}
            {showExpenseModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#1e1e1e', padding: '30px', borderRadius: '15px', width: '400px', border: '1px solid #333' }}>
                        <h3>Gider Ekle</h3>
                        <form onSubmit={handleExpenseAdd}>
                            <input type="date" required value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} className="dark-input" style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#333', border: 'none', color: 'white', borderRadius: '5px' }} />
                            <input type="number" placeholder="Tutar (TL)" required value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#333', border: 'none', color: 'white', borderRadius: '5px' }} />
                            <select value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#333', border: 'none', color: 'white', borderRadius: '5px' }}>
                                <option value="">Kategori Seçin</option>
                                <option value="Malzeme">Malzeme</option>
                                <option value="Yemek">Yemek</option>
                                <option value="Yakıt">Yakıt</option>
                                <option value="Konaklama">Konaklama</option>
                                <option value="Diğer">Diğer</option>
                            </select>
                            <textarea placeholder="Açıklama" value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#333', border: 'none', color: 'white', borderRadius: '5px' }}></textarea>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#aaa' }}>Fiş/Fatura Fotoğrafı (Opsiyonel)</label>
                            <input type="file" accept="image/*,application/pdf" onChange={e => setExpenseForm({ ...expenseForm, receipt: e.target.files[0] })} style={{ marginBottom: '15px', color: 'white' }} />

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowExpenseModal(false)} style={{ marginRight: '10px', padding: '8px 15px', borderRadius: '5px', border: 'none', background: '#444', color: 'white' }}>İptal</button>
                                <button type="submit" style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', background: '#e67e22', color: 'white' }}>Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetail;
