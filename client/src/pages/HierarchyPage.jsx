import React, { useState, useEffect } from 'react';
import { Users, User, Briefcase, Phone, Mail, ChevronDown, ChevronUp, Network } from 'lucide-react';
import api from '../utils/api';

const HierarchyPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRoles, setExpandedRoles] = useState({});

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/auth/users');
            setUsers(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching users:', err);
            setLoading(false);
        }
    };

    const toggleRole = (roleId) => {
        setExpandedRoles(prev => ({ ...prev, [roleId]: !prev[roleId] }));
    };

    const jobDescriptions = {
        owner: {
            title: 'Şirket Sahibi',
            tasks: [
                'Genel şirket stratejisi ve vizyonunun belirlenmesi',
                'Üst düzey finansal yönetim ve bütçe onayı',
                'Kritik iş ortaklıkları ve sözleşme yönetimi',
                'Personel politikaları ve genel denetim'
            ]
        },
        coordinator: {
            title: 'Şirket Koordinatörü',
            tasks: [
                'Birimler arası operasyonel eşgüdümün sağlanması',
                'Günlük iş akışlarının planlanması ve takibi',
                'Performans raporlarının analizi ve iyileştirme önerileri',
                'Kaynak dağılımı ve verimlilik yönetimi'
            ]
        },
        accounting: {
            title: 'Muhasebe',
            tasks: [
                'Finansal kayıtların tutulması ve raporlanması',
                'Gelir-gider dengesi ve nakit akış takibi',
                'Fatura, hakediş ve ödeme süreçlerinin yönetimi',
                'Resmi bildirimler ve maliyet analizi'
            ]
        },
        site_manager: {
            title: 'Şantiye Şefi',
            tasks: [
                'Saha operasyonlarının teknik yönetimi',
                'İş güvenliği ve kalite standartlarının denetimi',
                'Malzeme ihtiyaç planlaması ve onay süreci',
                'Müşteri teknik temsilcisi ile koordinasyon'
            ]
        },
        depocu: {
            title: 'Depo Sorumlusu',
            tasks: [
                'Malzeme giriş-çıkış ve stok kayıtlarının tutulması',
                'Envanter sayımı ve kritik stok kontrolü',
                'Saha ekibine malzeme teslimatı ve araç stok takibi',
                'Depo düzeni ve güvenliğinin sağlanması'
            ]
        },
        technician: {
            title: 'Teknisyen',
            tasks: [
                'Saha servis ve arıza onarım işlemlerinin icrası',
                'Servis formlarının eksiksiz doldurulması',
                'Yedek parça kullanımı ve araç stok yönetimi',
                'Müşteri memnuniyeti odaklı teknik destek'
            ]
        }
    };

    // Helper to get users by role
    const getUsersByRole = (role) => users.filter(u => u.role === role);

    const PersonCard = ({ person, roleKey }) => {
        const isExpanded = expandedRoles[person.id];
        const desc = jobDescriptions[roleKey] || { title: person.role, tasks: [] };

        return (
            <div className="glass-panel hierarchy-card" style={{
                width: '100%',
                maxWidth: '350px',
                margin: '10px',
                padding: '15px',
                border: '1px solid var(--glass-border)',
                borderRadius: '16px',
                textAlign: 'left',
                position: 'relative',
                transition: 'all 0.3s ease'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: person.photo_url ? `url(${person.photo_url}) center/cover` : 'rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid var(--accent-color)',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                    }}>
                        {!person.photo_url && <User size={24} color="var(--accent-color)" />}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{person.full_name || person.username}</h4>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                            {desc.title}
                        </p>
                    </div>
                    <button
                        onClick={() => toggleRole(person.id)}
                        style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>

                {isExpanded && (
                    <div className="fade-in" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--accent-color)' }}>
                            <Briefcase size={14} /> <strong>Görev Tanımı</strong>
                        </div>
                        <ul style={{ paddingLeft: '18px', margin: '0 0 15px 0', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                            {desc.tasks.map((task, idx) => (
                                <li key={idx} style={{ marginBottom: '4px' }}>{task}</li>
                            ))}
                        </ul>
                        {person.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.8rem', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                <Phone size={14} /> {person.phone}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Yükleniyor...</div>;

    // Filter logic based on the user's specific request
    const owner = users.find(u => u.username === 'admin'); // Assuming admin is the owner
    const coordinators = users.filter(u => u.role === 'admin' && u.username !== 'admin');

    // For demo purposes, we'll split some users into the requested categories
    // In a real scenario, these would be based on 'job_title' or similar
    const technicians = users.filter(u => u.role === 'technician');
    const warehouse = users.filter(u => u.role === 'depocu');

    return (
        <div className="dashboard fade-in" style={{ padding: '20px', minHeight: '100vh', paddingBottom: '100px' }}>
            <div style={{ marginBottom: '50px', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '16px', marginBottom: '15px' }}>
                    <Network size={32} color="var(--accent-color)" />
                </div>
                <h2 style={{ fontSize: '2.2rem', margin: 0, fontWeight: '800', background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Organizasyon Şeması</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '1.1rem' }}>Şirket hiyerarşisi ve kurumsal görev tanımları</p>
            </div>

            <div className="hierarchy-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                {/* Level 1: Şirket Sahibi */}
                <div className="hierarchy-level" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="level-badge">Şirket Sahibi</div>
                    {owner ? <PersonCard person={owner} roleKey="owner" /> : <div className="glass-panel" style={{ padding: '15px', color: '#666' }}>Atanmamış</div>}
                </div>

                <div className="connector-v"></div>

                {/* Level 2: Şirket Koordinatörü */}
                <div className="hierarchy-level" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="level-badge">Şirket Koordinatörü</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {coordinators.length > 0 ? (
                            coordinators.map(u => <PersonCard key={u.id} person={u} roleKey="coordinator" />)
                        ) : (
                            <div className="glass-panel" style={{ padding: '15px', color: '#666', border: '1px dashed #444', borderRadius: '12px' }}>Pozisyon Boş</div>
                        )}
                    </div>
                </div>

                <div className="connector-v"></div>

                {/* Level 3: Muhasebe & Şantiye Şefleri */}
                <div className="hierarchy-row" style={{ display: 'flex', width: '100%', maxWidth: '1000px', justifyContent: 'space-between', position: 'relative' }}>
                    <div className="connector-horizontal" style={{ position: 'absolute', top: '-25px', left: '25%', right: '25%', height: '2px', background: 'var(--accent-color)', opacity: 0.3 }}></div>

                    <div className="hierarchy-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 10px' }}>
                        <div className="level-badge" style={{ background: '#ec4899' }}>Muhasebe</div>
                        <div style={{ fontStyle: 'italic', color: '#555', fontSize: '0.8rem', marginTop: '10px' }}>Genel Muhasebe Bölümü</div>
                    </div>

                    <div className="hierarchy-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 10px' }}>
                        <div className="level-badge" style={{ background: '#f59e0b' }}>Şantiye Şefleri</div>
                        {/* Static mapping for demo until job_title is added */}
                        {getUsersByRole('admin').slice(0, 1).map(u => <PersonCard key={u.id} person={u} roleKey="site_manager" />)}
                    </div>
                </div>

                <div className="connector-v" style={{ height: '50px' }}></div>

                {/* Level 4: Depocu & Teknisyenler */}
                <div className="hierarchy-row" style={{ display: 'flex', width: '100%', maxWidth: '1200px', justifyContent: 'space-around', position: 'relative' }}>
                    <div className="connector-horizontal" style={{ position: 'absolute', top: '-25px', left: '15%', right: '15%', height: '2px', background: 'var(--accent-color)', opacity: 0.3 }}></div>

                    <div className="hierarchy-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className="level-badge" style={{ background: '#10b981' }}>Depo Ekibi</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {warehouse.map(u => <PersonCard key={u.id} person={u} roleKey="depocu" />)}
                        </div>
                    </div>

                    <div className="hierarchy-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className="level-badge" style={{ background: '#3b82f6' }}>Teknik Ekip</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {technicians.map(u => <PersonCard key={u.id} person={u} roleKey="technician" />)}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .level-badge {
                    background: var(--accent-color);
                    color: white;
                    padding: 8px 25px;
                    border-radius: 30px;
                    font-weight: 700;
                    font-size: 0.85rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 20px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    z-index: 2;
                }
                .connector-v {
                    width: 2px;
                    height: 40px;
                    background: linear-gradient(to bottom, var(--accent-color), transparent);
                    opacity: 0.4;
                    margin-bottom: 10px;
                }
                .hierarchy-card:hover {
                    border-color: var(--accent-color);
                    box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
                    transform: translateY(-5px);
                }
                .hierarchy-row {
                    margin-top: 20px;
                }
                @media (max-width: 768px) {
                    .hierarchy-row {
                        flex-direction: column;
                        gap: 40px;
                    }
                    .connector-horizontal {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
};

export default HierarchyPage;
