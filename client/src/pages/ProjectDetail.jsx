import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Upload, FileText, Grid, Box, Image as ImageIcon, Download, DollarSign, Calendar, Edit, Trash2, Printer, Eye, X, TrendingUp, TrendingDown, Wallet, CreditCard, Users, UserPlus } from 'lucide-react';

const ProjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isTech = user?.role === 'technician';

    const [project, setProject] = useState(null);
    const [files, setFiles] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [team, setTeam] = useState([]);
    const [allUsers, setAllUsers] = useState([]); // For selection
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('files');

    // Modals
    const [showFileModal, setShowFileModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showEditProjectModal, setShowEditProjectModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showTeamModal, setShowTeamModal] = useState(false);

    // Edit Expense State (null means create mode)
    const [editingExpense, setEditingExpense] = useState(null);

    // Forms
    const [fileForm, setFileForm] = useState({ file: null, name: '' });
    const [expenseForm, setExpenseForm] = useState({ amount: '', category: '', description: '', receipt: null, date: new Date().toISOString().slice(0, 10) });
    const [projectForm, setProjectForm] = useState({ name: '', description: '', start_date: '', end_date: '', status: '', tender_price: '', progress_payment: '' });

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
                status: res.data.project.status,
                tender_price: res.data.project.tender_price || '',
                progress_payment: res.data.project.progress_payment || ''

            });

            // Fetch Team
            const teamRes = await api.get(`/projects/${id}/team`);
            setTeam(teamRes.data);

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
            receipt: null
        });
        setShowExpenseModal(true);
    };

    const handleAddMember = async (userId) => {
        try {
            await api.post(`/projects/${id}/team`, { user_id: userId });
            setShowTeamModal(false);
            // Refresh team
            const teamRes = await api.get(`/projects/${id}/team`);
            setTeam(teamRes.data);
        } catch (err) {
            alert('Eklenemedi');
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!window.confirm('Bu kişiyi projeden çıkarmak istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/projects/${id}/team/${userId}`);
            // Refresh team
            const teamRes = await api.get(`/projects/${id}/team`);
            setTeam(teamRes.data);
        } catch (err) {
            alert('Çıkarılamadı');
        }
    };

    const openTeamModal = async () => {
        try {
            const res = await api.get('/auth/users'); // Assuming this exists or similar
            // Filter out already assigned
            const assignedIds = team.map(t => t.id);
            const available = res.data.filter(u => !assignedIds.includes(u.id));
            setAllUsers(available);
            setShowTeamModal(true);
        } catch (err) {
            alert('Kullanıcılar yüklenemedi');
        }
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0);
    };

    const handleDownload = (url, filename) => {
        if (!url) return;
        // Simple and robust: Open in new tab. Browser handles download or view.
        window.open(url, '_blank');
    };

    if (loading) return <div style={{ padding: '20px', color: 'white' }}>Yükleniyor...</div>;

    const totalExpenses = expenses.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const netProfit = (parseFloat(project.progress_payment) || 0) - totalExpenses;
    const isProfitable = netProfit >= 0;

    return (
        <div style={{ padding: '20px', minHeight: '100vh', color: 'white', fontFamily: "'Outfit', sans-serif" }}>
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

            {/* FINANCIAL DASHBOARD (Admin Only) */}
            {!isTech && (
                <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))', padding: '20px', borderRadius: '15px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#60a5fa', marginBottom: '5px', fontSize: '0.9rem' }}>
                            <Wallet size={16} /> İhale Bedeli
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatCurrency(project.tender_price)}</div>
                    </div>

                    <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))', padding: '20px', borderRadius: '15px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#34d399', marginBottom: '5px', fontSize: '0.9rem' }}>
                            <CreditCard size={16} /> Hakediş (Alınan)
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatCurrency(project.progress_payment)}</div>
                    </div>

                    <div style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))', padding: '20px', borderRadius: '15px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171', marginBottom: '5px', fontSize: '0.9rem' }}>
                            <TrendingDown size={16} /> Toplam Gider
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatCurrency(totalExpenses)}</div>
                    </div>

                    <div style={{ background: isProfitable ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))', padding: '20px', borderRadius: '15px', border: isProfitable ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: isProfitable ? '#34d399' : '#f87171', marginBottom: '5px', fontSize: '0.9rem' }}>
                            <TrendingUp size={16} /> Net Kar / Zarar
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: isProfitable ? '#34d399' : '#f87171' }}>
                            {isProfitable ? '+' : ''}{formatCurrency(netProfit)}
                        </div>
                    </div>
                </div>
            )}

            {/* TABS (No Print) */}
            <div className="no-print" style={{ display: 'flex', borderBottom: '1px solid #333', marginBottom: '20px' }}>
                {!isTech && (
                    <button
                        onClick={() => setActiveTab('files')}
                        style={{ padding: '10px 20px', background: 'transparent', border: 'none', borderBottom: activeTab === 'files' ? '2px solid #60a5fa' : 'none', color: activeTab === 'files' ? '#60a5fa' : '#aaa', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s' }}
                    >
                        📂 PROJE DOSYALARI
                    </button>
                )}
                {!isTech && (
                    <button
                        onClick={() => setActiveTab('expenses')}
                        style={{ padding: '10px 20px', background: 'transparent', border: 'none', borderBottom: activeTab === 'expenses' ? '2px solid #f59e0b' : 'none', color: activeTab === 'expenses' ? '#f59e0b' : '#aaa', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s' }}
                    >
                        💰 GİDERLER & FİŞLER
                    </button>
                )}
                {!isTech && (
                    <button
                        onClick={() => setActiveTab('team')}
                        style={{ padding: '10px 20px', background: 'transparent', border: 'none', borderBottom: activeTab === 'team' ? '2px solid #8b5cf6' : 'none', color: activeTab === 'team' ? '#8b5cf6' : '#aaa', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s' }}
                    >
                        👷 EKİP & PLANLAMA
                    </button>
                )}
            </div>

            {/* FILES CONTENT */}
            {activeTab === 'files' && !isTech && (
                <div>
                    {!isTech && (
                        <button onClick={() => setShowFileModal(true)} className="glass-btn" style={{ marginBottom: '20px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                            <Upload size={16} style={{ marginRight: '5px' }} /> Dosya Yükle
                        </button>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                        {files.map(file => (
                            <div key={file.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', transition: 'transform 0.2s', position: 'relative' }}>
                                <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
                                    {getFileIcon(file.file_type || 'raw')}
                                </div>
                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {file.file_name}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '10px' }}>
                                    {new Date(file.uploaded_at).toLocaleDateString()}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                    <button
                                        onClick={() => handleDownload(file.file_url, file.file_name, file.file_type)}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>
                                        <Download size={14} /> İndir
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!window.confirm('Bu dosyayı silmek istediğinize emin misiniz?')) return;
                                            try {
                                                await api.delete(`/projects/${id}/files/${file.id}`);
                                                fetchData();
                                            } catch (err) { alert('Silinemedi'); }
                                        }}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '5px', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>
                                        <Trash2 size={14} /> Sil
                                    </button>
                                </div>
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
                        <button onClick={() => { setEditingExpense(null); setShowExpenseModal(true); }} className="glass-btn" style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                            <DollarSign size={16} style={{ marginRight: '5px' }} /> Gider Fişi Ekle
                        </button>
                        <button onClick={handlePrint} className="glass-btn" style={{ background: '#fff', color: '#000' }}>
                            <Printer size={16} style={{ marginRight: '5px' }} /> Tabloyu Yazdır
                        </button>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ddd' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #444', textAlign: 'left', background: 'rgba(255,255,255,0.05)' }}>
                                    <th style={{ padding: '15px' }}>Tarih</th>
                                    <th style={{ padding: '15px' }}>Kategori</th>
                                    <th style={{ padding: '15px' }}>Açıklama</th>
                                    <th style={{ padding: '15px' }}>Tutar</th>
                                    <th style={{ padding: '15px' }} className="no-print">Fiş</th>
                                    <th style={{ padding: '15px' }} className="no-print">İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map(exp => (
                                    <tr key={exp.id} style={{ borderBottom: '1px solid #333' }}>
                                        <td style={{ padding: '15px' }}>{new Date(exp.expense_date).toLocaleDateString()}</td>
                                        <td style={{ padding: '15px' }}>
                                            <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', fontSize: '0.8rem' }}>{exp.category}</span>
                                        </td>
                                        <td style={{ padding: '15px' }}>{exp.description}</td>
                                        <td style={{ padding: '15px', fontWeight: 'bold', color: '#f59e0b' }}>{formatCurrency(exp.amount)}</td>
                                        <td style={{ padding: '15px' }} className="no-print">
                                            {exp.receipt_url ? (
                                                <a href={exp.receipt_url} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>Görüntüle</a>
                                            ) : '-'}
                                        </td>
                                        <td style={{ padding: '15px', display: 'flex', gap: '10px' }} className="no-print">
                                            <button onClick={() => openEditExpense(exp)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa' }}><Edit size={16} /></button>
                                            <button onClick={() => handleDeleteExpense(exp.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TEAM CONTENT */}
            {activeTab === 'team' && !isTech && (
                <div>
                    <button onClick={openTeamModal} className="glass-btn" style={{ marginBottom: '20px', background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                        <UserPlus size={16} style={{ marginRight: '5px' }} /> Personel Ekle
                    </button>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                        {team.map(member => (
                            <div key={member.id} className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff' }}>
                                        {member.username.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{member.username}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{member.role === 'technician' ? 'Tekniker' : member.role}</div>
                                    </div>
                                </div>
                                <button onClick={() => handleRemoveMember(member.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        {team.length === 0 && <p style={{ color: '#666' }}>Bu projeye atanmış personel yok.</p>}
                    </div>
                </div>
            )}

            {/* MODALS */}

            {/* FILE UPLOAD MODAL */}
            {showFileModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
                    <div style={{ background: '#1e1e1e', padding: '30px', borderRadius: '15px', width: '400px', border: '1px solid #333', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                        <h3>Dosya Yükle</h3>
                        <form onSubmit={handleFileUpload}>
                            <input type="text" placeholder="Dosya Görünür Adı" required value={fileForm.name} onChange={e => setFileForm({ ...fileForm, name: e.target.value })} className="glass-input" style={{ marginBottom: '10px' }} />
                            <input type="file" required onChange={e => setFileForm({ ...fileForm, file: e.target.files[0] })} style={{ marginBottom: '15px', color: 'white' }} />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
                                <button type="button" onClick={() => setShowFileModal(false)} style={{ marginRight: '10px', padding: '8px 15px', borderRadius: '5px', border: 'none', background: '#444', color: 'white' }}>İptal</button>
                                <button type="submit" style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', background: '#3b82f6', color: 'white' }}>Yükle</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EXPENSE MODAL */}
            {showExpenseModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
                    <div style={{ background: '#1e1e1e', padding: '30px', borderRadius: '15px', width: '400px', border: '1px solid #333', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                        <h3>{editingExpense ? 'Gideri Düzenle' : 'Gider Ekle'}</h3>
                        <form onSubmit={handleExpenseSubmit}>
                            <input type="date" required value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} className="glass-input" style={{ marginBottom: '10px' }} />
                            <input type="number" placeholder="Tutar (TL)" required value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} className="glass-input" style={{ marginBottom: '10px' }} />
                            <select value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })} className="glass-input" style={{ marginBottom: '10px' }}>
                                <option value="">Kategori Seçin</option>
                                <option value="Malzeme">Malzeme</option>
                                <option value="Yemek">Yemek</option>
                                <option value="Yakıt">Yakıt</option>
                                <option value="Konaklama">Konaklama</option>
                                <option value="Diğer">Diğer</option>
                            </select>
                            <textarea placeholder="Açıklama" value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} className="glass-input" style={{ marginBottom: '10px', minHeight: '80px' }}></textarea>

                            {!editingExpense && (
                                <>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#aaa' }}>Fiş/Fatura Fotoğrafı (Opsiyonel)</label>
                                    <input type="file" accept="image/*,application/pdf" onChange={e => setExpenseForm({ ...expenseForm, receipt: e.target.files[0] })} style={{ marginBottom: '15px', color: 'white' }} />
                                </>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
                                <button type="button" onClick={() => setShowExpenseModal(false)} style={{ marginRight: '10px', padding: '8px 15px', borderRadius: '5px', border: 'none', background: '#444', color: 'white' }}>İptal</button>
                                <button type="submit" style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', background: '#f59e0b', color: 'white' }}>Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT PROJECT MODAL */}
            {showEditProjectModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
                    <div style={{ background: '#1e1e1e', padding: '30px', borderRadius: '15px', width: '500px', border: '1px solid #333', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                        <h3>Projeyi Düzenle</h3>
                        <form onSubmit={handleProjectUpdate}>
                            <input type="text" placeholder="Proje Adı" required value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} className="glass-input" style={{ marginBottom: '10px' }} />
                            <textarea placeholder="Açıklama" value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} className="glass-input" style={{ marginBottom: '10px' }}></textarea>

                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem', color: '#aaa' }}>İhale Bedeli</label>
                                    <input type="number" placeholder="0.00" value={projectForm.tender_price} onChange={e => setProjectForm({ ...projectForm, tender_price: e.target.value })} className="glass-input" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem', color: '#aaa' }}>Hakediş (Alınan)</label>
                                    <input type="number" placeholder="0.00" value={projectForm.progress_payment} onChange={e => setProjectForm({ ...projectForm, progress_payment: e.target.value })} className="glass-input" />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem', color: '#aaa' }}>Başlangıç</label>
                                    <input type="date" required value={projectForm.start_date} onChange={e => setProjectForm({ ...projectForm, start_date: e.target.value })} className="glass-input" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem', color: '#aaa' }}>Bitiş</label>
                                    <input type="date" required value={projectForm.end_date} onChange={e => setProjectForm({ ...projectForm, end_date: e.target.value })} className="glass-input" />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
                                <button type="button" onClick={() => setShowEditProjectModal(false)} style={{ marginRight: '10px', padding: '8px 15px', borderRadius: '5px', border: 'none', background: '#444', color: 'white' }}>İptal</button>
                                <button type="submit" style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', background: '#3b82f6', color: 'white' }}>Güncelle</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* TEAM MODAL */}
            {
                showTeamModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
                        <div style={{ background: '#1e1e1e', padding: '30px', borderRadius: '15px', width: '400px', border: '1px solid #333', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                            <h3>Personel Seçin</h3>
                            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {allUsers.map(u => (
                                    <div key={u.id} onClick={() => handleAddMember(u.id)} style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid transparent' }}
                                        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}>
                                        <span style={{ fontWeight: 'bold' }}>{u.username}</span>
                                        <span style={{ fontSize: '0.8rem', color: '#aaa' }}>{u.role}</span>
                                    </div>
                                ))}
                                {allUsers.length === 0 && <p style={{ color: '#aaa', textAlign: 'center' }}>Eklenebilecek personel bulunamadı.</p>}
                            </div>
                            <button onClick={() => setShowTeamModal(false)} style={{ marginTop: '20px', width: '100%', padding: '10px', background: '#444', border: 'none', color: 'white', borderRadius: '5px', cursor: 'pointer' }}>Kapat</button>
                        </div>
                    </div>
                )
            }

            {/* PREVIEW MODAL */}
            {
                showPreviewModal && (
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

                                <h3 style={{ color: '#000', background: 'none', WebkitTextFillColor: 'initial' }}>Finansal Özet</h3>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '30px', border: '1px solid #ddd', padding: '10px' }}>
                                    <div><strong style={{ display: 'block', fontSize: '0.8rem', color: '#555' }}>İhale Bedeli</strong> {formatCurrency(project.tender_price)}</div>
                                    <div><strong style={{ display: 'block', fontSize: '0.8rem', color: '#555' }}>Hakediş</strong> {formatCurrency(project.progress_payment)}</div>
                                    <div><strong style={{ display: 'block', fontSize: '0.8rem', color: '#555' }}>Toplam Gider</strong> {formatCurrency(totalExpenses)}</div>
                                    <div style={{ color: isProfitable ? 'green' : 'red' }}>
                                        <strong style={{ display: 'block', fontSize: '0.8rem', color: '#555' }}>Net Kar</strong> {formatCurrency(netProfit)}
                                    </div>
                                </div>

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
                                                <td style={{ padding: '8px', textAlign: 'right', color: '#000' }}>{formatCurrency(exp.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ProjectDetail;
