import { playNotificationSound } from '../utils/sound';

const TechDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [lastCount, setLastCount] = useState(0);

    const fetchTasks = async (playSound = false) => {
        try {
            const res = await api.get('/tasks');
            const newTasks = res.data;
            setTasks(newTasks);

            // If tasks increased, play sound!
            if (playSound && newTasks.length > lastCount && lastCount !== 0) {
                playNotificationSound();
            }
            if (newTasks.length !== lastCount) {
                setLastCount(newTasks.length);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchTasks(false); // Initial load

        // Poll every 30 seconds
        const interval = setInterval(() => {
            fetchTasks(true);
        }, 30000);

        return () => clearInterval(interval);
    }, [lastCount]); // Re-run if count changes (to update closure) or just rely on state

    return (
        <div className="dashboard">
            <h1 style={{ marginBottom: '1.5rem' }}>Görevlerim</h1>
            {tasks.length === 0 ? <p style={{ opacity: 0.6 }}>Atanmış görev yok.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {tasks.map(task => (
                        <div key={task.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{task.title}</h3>
                                <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    background: task.status === 'completed' ? 'rgba(244, 67, 54, 0.3)' : // Red
                                        task.status === 'in_progress' ? 'rgba(76, 175, 80, 0.3)' : // Green
                                            'rgba(255, 193, 7, 0.3)', // Yellow
                                    color: task.status === 'completed' ? '#ef5350' :
                                        task.status === 'in_progress' ? '#81c784' :
                                            '#ffd54f'
                                }}>
                                    {task.status === 'pending' ? 'Bekliyor' :
                                        task.status === 'in_progress' ? 'Aktif' : 'Bitti'}
                                </span>
                            </div>
                            <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>📍 {task.address}</p>
                            <p style={{ margin: 0, opacity: 0.6, fontSize: '0.85rem' }}>📅 Son Tarih: {new Date(task.due_date).toLocaleDateString()}</p>

                            <Link to={`/tech/task/${task.id}`} className="glass-btn" style={{ textAlign: 'center', marginTop: '10px', textDecoration: 'none', background: 'rgba(33, 150, 243, 0.3)' }}>
                                Detayları Gör
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TechDashboard;
