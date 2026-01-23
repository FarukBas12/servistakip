import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Upload, FileText, Grid, Box, Image as ImageIcon, Download, DollarSign, Calendar, Edit, Trash2, Printer, Eye, X } from 'lucide-react';

const ProjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isTech = user?.role === 'technician';

    const [project, setProject] = useState(null);
    const [files, setFiles] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('files');

    // Modals
    const [showFileModal, setShowFileModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showEditProjectModal, setShowEditProjectModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    // Edit Expense State (null means create mode)
    const [editingExpense, setEditingExpense] = useState(null);

    // Forms
    const [fileForm, setFileForm] = useState({ file: null, name: '' });
    const [expenseForm, setExpenseForm] = useState({ amount: '', category: '', description: '', receipt: null, date: new Date().toISOString().slice(0, 10) });
    const [projectForm, setProjectForm] = useState({ name: '', description: '', start_date: '', end_date: '', status: '' });

    useEffect(() => {
        fetchData();
        // Add print styles
        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                body * { visibility: hidden; }
                .print-section, .print-section * { visibility: visible; }
                .print-section { position: absolute; left: 0; top: 0; width: 100%; background: white; color: black; padding: 20px; }
                .no-print { display: none !important; }
            }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, [id]);

    const fetchData = async () => {
        try {
            const res = await api.get(`/projects/${id}`);
            setProject(res.data.project);
            setFiles(res.data.files);
            setExpenses(res.data.expenses);
            setProjectForm({
                name: res.data.project.name,
                description: res.data.project.description,
                start_date: res.data.project.start_date.slice(0, 10),
                end_date: res.data.project.end_date.slice(0, 10),
                status: res.data.project.status
            });
            setLoading(false);
        } catch (err) {
            console.error(err);
            navigate('/admin/projects');
        }
    };

    // --- ACTIONS ---

    const handleProjectUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/projects/${id}`, projectForm);
            setShowEditProjectModal(false);
            fetchData();
        } catch (err) {
            alert('Güncelleme başarısız: ' + (err.response?.data || err.message));
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
            alert('Dosya yüklenemedi: ' + (err.response?.data || err.message));
        }
    };

    const handleExpenseSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('amount', expenseForm.amount);
        formData.append('category', expenseForm.category);
        formData.append('description', expenseForm.description);
        formData.append('expense_date', expenseForm.date);
        if (expenseForm.receipt) formData.append('receipt', expenseForm.receipt);

        try {
            if (editingExpense) {
                // Update
                await api.put(`/projects/${id}/expenses/${editingExpense.id}`, {
                    amount: expenseForm.amount,
                    category: expenseForm.category,
                    description: expenseForm.description,
                    expense_date: expenseForm.date
                });
            } else {
                // Create
                await api.post(`/projects/${id}/expenses`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            setShowExpenseModal(false);
            setEditingExpense(null);
            setExpenseForm({ amount: '', category: '', description: '', receipt: null, date: new Date().toISOString().slice(0, 10) });
            fetchData();
        } catch (err) {
            alert('İşlem başarısız: ' + (err.response?.data || err.message));
        }
    };

    const handleDeleteExpense = async (expenseId) => {
        if (!window.confirm('Bu gideri silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/projects/${id}/expenses/${expenseId}`);
            fetchData();
        } catch (err) {
            alert('Silme başarısız');
        }
    };

    const openEditExpense = (exp) => {
        setEditingExpense(exp);
        setExpenseForm({
            amount: exp.amount,
            category: exp.category,
            description: exp.description || '',
            expense_date: exp.expense_date.slice(0, 10),
            receipt: null // Can't edit receipt file easily via PUT yet without mulipart handling update, keeping simple
        });
        setShowExpenseModal(true);
    };

    const handlePrint = () => {
        window.print();
    };

    const getFileIcon = (type) => {
        if (type?.includes('pdf')) return <FileText color="#e74c3c" />;
        if (type?.includes('excel') || type?.includes('sheet')) return <Grid color="#27ae60" />;
        if (type?.includes('image')) return <ImageIcon color="#f39c12" />;
        if (type?.includes('raw') || type?.includes('dwg')) return <Box color="#3498db" />;
        return <FileText color="#aaa" />;
    };

    if (loading) return <div style={{ padding: '20px', color: 'white' }}>Yükleniyor...</div>;

    const totalExpenses = expenses.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

    return (
        <div style={{ padding: '20px', minHeight: '100vh', color: 'white' }}>
            {/* HEADER */}
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => navigate('/admin/projects')} className="glass-btn">
                        <ArrowLeft size={18} /> Geri
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {project.name}
                            {!isTech && (
                                <button onClick={() => setShowEditProjectModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa' }} title="Projeyi Düzenle">
                                    <Edit size={18} />
                                </button>
                            )}
                        </h1>
                        <div style={{ display: 'flex', gap: '15px', color: '#aaa', fontSize: '0.9rem', marginTop: '5px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Calendar size={14} /> {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {!isTech && (
                    <button onClick={() => setShowPreviewModal(true)} className="glass-btn" style={{ background: '#8e44ad', borderColor: '#9b59b6' }}>
                        <Eye size={18} style={{ marginRight: '5px' }} /> Detaylı Önizleme
                    </button>
                )}
            </div>

            {/* TABS (No Print) */}
            <div className="no-print" style={{ display: 'flex', borderBottom: '1px solid #333', marginBottom: '20px' }}>
                <button
                    onClick={() => setActiveTab('files')}
                    style={{ padding: '10px 20px', background: 'transparent', border: 'none', borderBottom: activeTab === 'files' ? '2px solid #4facfe' : 'none', color: activeTab === 'files' ? '#4facfe' : '#aaa', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    📂 PROJE DOSYALARI
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
                <div className="print-section">
                    {/* Buttons hidden on print */}
                    <div className="no-print" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                        <button onClick={() => { setEditingExpense(null); setShowExpenseModal(true); }} className="glass-btn" style={{ background: '#e67e22' }}>
                            <DollarSign size={16} style={{ marginRight: '5px' }} /> Gider Fişi Ekle
                        </button>
                        <button onClick={handlePrint} className="glass-btn" style={{ background: '#fff', color: '#000' }}>
                            <Printer size={16} style={{ marginRight: '5px' }} /> Tabloyu Yazdır
                        </button>
                    </div>

                    {/* Summary for Print */}
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', border: '1px solid #444' }}>
                        <h3 style={{ margin: 0, color: '#f0932b' }}>Toplam Gider: {totalExpenses.toFixed(2)} TL</h3>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ddd' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #444', textAlign: 'left', background: '#333' }}>
                                    <th style={{ padding: '10px' }}>Tarih</th>
                                    <th style={{ padding: '10px' }}>Kategori</th>
                                    <th style={{ padding: '10px' }}>Açıklama</th>
                                    <th style={{ padding: '10px' }}>Tutar</th>
                                    <th style={{ padding: '10px' }} className="no-print">Fiş</th>
                                    <th style={{ padding: '10px' }} className="no-print">İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map(exp => (
                                    <tr key={exp.id} style={{ borderBottom: '1px solid #333' }}>
                                        <td style={{ padding: '10px' }}>{new Date(exp.expense_date).toLocaleDateString()}</td>
                                        <td style={{ padding: '10px' }}>{exp.category}</td>
                                        <td style={{ padding: '10px' }}>{exp.description}</td>
                                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#e67e22' }}>{exp.amount} TL</td>
                                        <td style={{ padding: '10px' }} className="no-print">
                                            {exp.receipt_url ? (
                                                <a href={exp.receipt_url} target="_blank" rel="noopener noreferrer" style={{ color: '#3498db' }}>Görüntüle</a>
                                            ) : '-'}
                                        </td>
                                        <td style={{ padding: '10px', display: 'flex', gap: '10px' }} className="no-print">
                                            <button onClick={() => openEditExpense(exp)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4facfe' }}><Edit size={16} /></button>
                                            <button onClick={() => handleDeleteExpense(exp.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e74c3c' }}><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {expenses.length === 0 && <p style={{ color: '#666', marginTop: '10px' }}>Henüz gider kaydı yok.</p>}
                </div>
            )}

            {/* MODALS */}

            {/* FILE UPLOAD MODAL */}
            {showFileModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#1e1e1e', padding: '30px', borderRadius: '15px', width: '400px', border: '1px solid #333' }}>
                        <h3>Dosya Yükle</h3>
                        <form onSubmit={handleFileUpload}>
                            <input type="text" placeholder="Dosya Görünür Adı" required value={fileForm.name} onChange={e => setFileForm({ ...fileForm, name: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#333', border: 'none', color: 'white', borderRadius: '5px' }} />
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
                        <h3>{editingExpense ? 'Gideri Düzenle' : 'Gider Ekle'}</h3>
                        <form onSubmit={handleExpenseSubmit}>
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

                            {!editingExpense && (
                                <>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#aaa' }}>Fiş/Fatura Fotoğrafı (Opsiyonel)</label>
                                    <input type="file" accept="image/*,application/pdf" onChange={e => setExpenseForm({ ...expenseForm, receipt: e.target.files[0] })} style={{ marginBottom: '15px', color: 'white' }} />
                                </>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowExpenseModal(false)} style={{ marginRight: '10px', padding: '8px 15px', borderRadius: '5px', border: 'none', background: '#444', color: 'white' }}>İptal</button>
                                <button type="submit" style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', background: '#e67e22', color: 'white' }}>Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT PROJECT MODAL */}
            {showEditProjectModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#1e1e1e', padding: '30px', borderRadius: '15px', width: '400px', border: '1px solid #333' }}>
                        <h3>Projeyi Düzenle</h3>
                        <form onSubmit={handleProjectUpdate}>
                            <input type="text" placeholder="Proje Adı" required value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#333', border: 'none', color: 'white', borderRadius: '5px' }} />
                            <textarea placeholder="Açıklama" value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#333', border: 'none', color: 'white', borderRadius: '5px' }}></textarea>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label>Başlangıç</label>
                                    <input type="date" required value={projectForm.start_date} onChange={e => setProjectForm({ ...projectForm, start_date: e.target.value })} className="dark-input" style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#333', border: 'none', color: 'white', borderRadius: '5px' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label>Bitiş</label>
                                    <input type="date" required value={projectForm.end_date} onChange={e => setProjectForm({ ...projectForm, end_date: e.target.value })} className="dark-input" style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#333', border: 'none', color: 'white', borderRadius: '5px' }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
                                <button type="button" onClick={() => setShowEditProjectModal(false)} style={{ marginRight: '10px', padding: '8px 15px', borderRadius: '5px', border: 'none', background: '#444', color: 'white' }}>İptal</button>
                                <button type="submit" style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', background: '#4facfe', color: 'white' }}>Güncelle</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PREVIEW MODAL */}
            {showPreviewModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 1100, overflowY: 'auto' }}>
                    <div style={{ width: '800px', margin: '50px auto', background: 'white', color: 'black', padding: '40px', borderRadius: '5px', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
                        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                            <button onClick={handlePrint} style={{ marginRight: '10px', padding: '10px 20px', background: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}><Printer size={16} /> Yazdır</button>
                            <button onClick={() => setShowPreviewModal(false)} style={{ padding: '10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}><X size={16} /></button>
                        </div>

                        <div className="print-section" style={{ color: '#000' }}>
                            <h1 style={{ borderBottom: '2px solid #333', paddingBottom: '10px', color: '#000', background: 'none', WebkitTextFillColor: 'initial' }}>{project.name}</h1>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.9rem', color: '#000' }}>
                                <span><strong>Tarih:</strong> {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}</span>
                                <span><strong>Durum:</strong> {project.status}</span>
                            </div>
                            <p style={{ marginBottom: '30px', padding: '15px', background: '#f5f5f5', borderRadius: '5px', color: '#000' }}>{project.description}</p>

                            <h3 style={{ color: '#000', background: 'none', WebkitTextFillColor: 'initial' }}>Proje Özeti</h3>
                            <table style={{ width: '100%', marginBottom: '30px', borderCollapse: 'collapse', color: '#000' }}>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid #ddd' }}><td style={{ padding: '8px', color: '#000' }}>Toplam Gider:</td><td style={{ padding: '8px', fontWeight: 'bold', color: '#000' }}>{totalExpenses.toFixed(2)} TL</td></tr>
                                    <tr style={{ borderBottom: '1px solid #ddd' }}><td style={{ padding: '8px', color: '#000' }}>Yüklenen Dosya Sayısı:</td><td style={{ padding: '8px', color: '#000' }}>{files.length}</td></tr>
                                    <tr style={{ borderBottom: '1px solid #ddd' }}><td style={{ padding: '8px', color: '#000' }}>Gider Kalemi Sayısı:</td><td style={{ padding: '8px', color: '#000' }}>{expenses.length}</td></tr>
                                </tbody>
                            </table>

                            <h3 style={{ color: '#000', background: 'none', WebkitTextFillColor: 'initial' }}>Gider Listesi</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', color: '#000' }}>
                                <thead>
                                    <tr style={{ background: '#333', color: 'white' }}>
                                        <th style={{ padding: '8px', textAlign: 'left', color: '#fff' }}>Tarih</th>
                                        <th style={{ padding: '8px', textAlign: 'left', color: '#fff' }}>Kategori</th>
                                        <th style={{ padding: '8px', textAlign: 'left', color: '#fff' }}>Açıklama</th>
                                        <th style={{ padding: '8px', textAlign: 'right', color: '#fff' }}>Tutar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.map(exp => (
                                        <tr key={exp.id} style={{ borderBottom: '1px solid #ddd' }}>
                                            <td style={{ padding: '8px', color: '#000' }}>{new Date(exp.expense_date).toLocaleDateString()}</td>
                                            <td style={{ padding: '8px', color: '#000' }}>{exp.category}</td>
                                            <td style={{ padding: '8px', color: '#000' }}>{exp.description}</td>
                                            <td style={{ padding: '8px', textAlign: 'right', color: '#000' }}>{exp.amount} TL</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetail;
