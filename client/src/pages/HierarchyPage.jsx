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

    const PersonCard = ({ person, roleKey }) => {
        const isExpanded = expandedRoles[person.id];
        const desc = jobDescriptions[roleKey] || { title: person.job_title || person.role, tasks: [] };

        const levelColors = {
            owner: 'rgba(99, 102, 241, 0.8)',
            coordinator: 'rgba(168, 85, 247, 0.8)',
            accounting: 'rgba(236, 72, 153, 0.8)',
            site_manager: 'rgba(245, 158, 11, 0.8)',
            depocu: 'rgba(16, 185, 129, 0.8)',
            technician: 'rgba(59, 130, 246, 0.8)'
        };

        const accentColor = levelColors[roleKey] || 'var(--accent-color)';

        return (
            <div className={`glass-panel hierarchy-card card-level-${roleKey}`} style={{
                width: '100%',
                maxWidth: '350px',
                margin: '15px',
                padding: '20px',
                border: '1px solid var(--glass-border)',
                borderLeft: `4px solid ${accentColor}`,
                borderRadius: '16px',
                textAlign: 'left',
                position: 'relative',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: `0 10px 30px -10px rgba(0,0,0,0.5)`,
                background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)`
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{
                        width: '55px',
                        height: '55px',
                        borderRadius: '14px',
                        background: person.photo_url ? `url(${person.photo_url}) center/cover` : 'rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `2px solid ${accentColor}`,
                        boxShadow: `0 0 15px ${accentColor}44`
                    }}>
                        {!person.photo_url && <User size={26} color={accentColor} />}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#fff' }}>{person.full_name || person.username}</h4>
                        <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: accentColor, fontWeight: '600', letterSpacing: '0.5px' }}>
                            {person.job_title || desc.title}
                        </p>
                    </div>
                    <button
                        onClick={() => toggleRole(person.id)}
                        className="expand-btn"
                        style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '10px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                </div>

                {isExpanded && (
                    <div className="fade-in" style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: accentColor }}>
                            <Briefcase size={14} /> <strong style={{ letterSpacing: '0.5px' }}>GÖREV TANIMI</strong>
                        </div>
                        <ul style={{ paddingLeft: '18px', margin: '0 0 18px 0', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                            {desc.tasks.map((task, idx) => (
                                <li key={idx} style={{ marginBottom: '6px' }}>{task}</li>
                            ))}
                        </ul>
                        {person.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontSize: '0.85rem', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <Phone size={14} style={{ opacity: 0.7 }} /> {person.phone}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Yükleniyor...</div>;

    // Dynamic Filtering based on Job Titles (Excluding 'admin' user)
    const owners = users.filter(u => u.username !== 'admin' && (u.job_title === 'Şirket Sahibi'));
    const coordinators = users.filter(u => u.username !== 'admin' && (u.job_title === 'Şirket Koordinatörü'));
    const accounting = users.filter(u => u.username !== 'admin' && (u.job_title === 'Muhasebe'));
    const siteManagers = users.filter(u => u.username !== 'admin' && (u.job_title === 'Şantiye Şefleri' || u.job_title === 'Şantiye Şefi'));
    const warehouse = users.filter(u => u.username !== 'admin' && (u.job_title === 'Depo Sorumlusu' || (u.role === 'depocu' && !u.job_title)));
    const technicians = users.filter(u => u.username !== 'admin' && (u.job_title === 'Teknisyen' || (u.role === 'technician' && !u.job_title)));

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
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {owners.length > 0 ? (
                            owners.map(u => <PersonCard key={u.id} person={u} roleKey="owner" />)
                        ) : (
                            <div className="glass-panel" style={{ padding: '15px', color: '#666' }}>Atanmamış</div>
                        )}
                    </div>
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
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {accounting.length > 0 ? (
                                accounting.map(u => <PersonCard key={u.id} person={u} roleKey="accounting" />)
                            ) : (
                                <div style={{ fontStyle: 'italic', color: '#555', fontSize: '0.8rem', marginTop: '10px' }}>Atama Bekleniyor</div>
                            )}
                        </div>
                    </div>

                    <div className="hierarchy-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 10px' }}>
                        <div className="level-badge" style={{ background: '#f59e0b' }}>Şantiye Şefleri</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {siteManagers.length > 0 ? (
                                siteManagers.map(u => <PersonCard key={u.id} person={u} roleKey="site_manager" />)
                            ) : (
                                <div style={{ fontStyle: 'italic', color: '#555', fontSize: '0.8rem', marginTop: '10px' }}>Atama Bekleniyor</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="connector-v" style={{ height: '50px' }}></div>

                {/* Level 4: Depocu & Teknisyenler */}
                <div className="hierarchy-row" style={{ display: 'flex', width: '100%', maxWidth: '1200px', justifyContent: 'space-around', position: 'relative' }}>
                    <div className="connector-horizontal" style={{ position: 'absolute', top: '-25px', left: '15%', right: '15%', height: '2px', background: 'var(--accent-color)', opacity: 0.3 }}></div>

                    <div className="hierarchy-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className="level-badge" style={{ background: '#10b981' }}>Depo Ekibi</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {warehouse.length > 0 ? (
                                warehouse.map(u => <PersonCard key={u.id} person={u} roleKey="depocu" />)
                            ) : (
                                <div style={{ color: '#555', fontSize: '0.8rem' }}>Bulunamadı</div>
                            )}
                        </div>
                    </div>

                    <div className="hierarchy-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className="level-badge" style={{ background: '#3b82f6' }}>Teknik Ekip</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {technicians.length > 0 ? (
                                technicians.map(u => <PersonCard key={u.id} person={u} roleKey="technician" />)
                            ) : (
                                <div style={{ color: '#555', fontSize: '0.8rem' }}>Bulunamadı</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .hierarchy-container {
                    padding: 40px 0;
                    position: relative;
                }
                .hierarchy-level {
                    margin-bottom: 20px;
                }
                .level-badge {
                    background: #312e81;
                    color: #fff;
                    padding: 10px 30px;
                    border-radius: 12px;
                    font-weight: 800;
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    margin-bottom: 30px;
                    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4), 0 0 15px rgba(99, 102, 241, 0.3);
                    border: 1px solid rgba(165, 180, 252, 0.2);
                    z-index: 2;
                    position: relative;
                }
                .connector-v {
                    width: 3px;
                    height: 60px;
                    background: linear-gradient(to bottom, #6366f1, #4338ca);
                    opacity: 0.6;
                    margin: 0 auto 15px;
                    position: relative;
                    border-radius: 2px;
                }
                .connector-v::after {
                    content: '';
                    position: absolute;
                    bottom: -6px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 10px;
                    height: 10px;
                    background: #6366f1;
                    border-radius: 50%;
                    box-shadow: 0 0 10px #6366f1;
                }
                .connector-horizontal {
                    position: absolute;
                    top: -40px;
                    left: 20%;
                    right: 20%;
                    height: 3px;
                    background: linear-gradient(to right, transparent, #6366f1, transparent);
                    opacity: 0.6;
                }
                .hierarchy-card:hover {
                    transform: translateY(-8px) scale(1.02);
                    border-color: rgba(255,255,255,0.2) !important;
                    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.7);
                }
                .card-level-owner:hover { box-shadow: 0 20px 40px -10px rgba(99, 102, 241, 0.2); }
                .card-level-coordinator:hover { box-shadow: 0 20px 40px -10px rgba(168, 85, 247, 0.2); }
                .card-level-accounting:hover { box-shadow: 0 20px 40px -10px rgba(236, 72, 153, 0.2); }
                .card-level-site_manager:hover { box-shadow: 0 20px 40px -10px rgba(245, 158, 11, 0.2); }
                .card-level-depocu:hover { box-shadow: 0 20px 40px -10px rgba(16, 185, 129, 0.2); }
                .card-level-technician:hover { box-shadow: 0 20px 40px -10px rgba(59, 130, 246, 0.2); }

                .hierarchy-row {
                    margin-top: 40px;
                    gap: 20px;
                }
                @media (max-width: 768px) {
                    .hierarchy-row {
                        flex-direction: column;
                        align-items: center;
                    }
                    .connector-horizontal {
                        display: none;
                    }
                    .connector-v {
                        height: 40px;
                    }
                }
            `}</style>
        </div>
    );
};

export default HierarchyPage;
