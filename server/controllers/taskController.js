const db = require('../db');
const notificationController = require('./notificationController');

exports.getTasks = async (req, res) => {
    try {
        // Enlanced Query: Get Task + Assigned Users (Array) + Last Cancellation
        let query = `
            SELECT t.*, 
            COALESCE(
                (SELECT json_agg(json_build_object('id', u.id, 'username', u.username))
                 FROM task_assignments ta
                 JOIN users u ON ta.user_id = u.id
                 WHERE ta.task_id = t.id),
                '[]'
            ) as assigned_users,
            (SELECT description FROM task_logs tl WHERE tl.task_id = t.id AND tl.action = 'cancelled' ORDER BY tl.created_at DESC LIMIT 1) as last_cancel_reason,
            (SELECT COUNT(*) FROM task_logs tl WHERE tl.task_id = t.id AND tl.action = 'cancelled') as cancel_count
            FROM tasks t
        `;
        const params = [];

        // If technician, only show assigned tasks
        if (req.user.role === 'technician') {
            query += ` 
                JOIN task_assignments ta_filter ON t.id = ta_filter.task_id 
                WHERE ta_filter.user_id = $1
            `;
            params.push(req.user.id);
        }

        query += ' ORDER BY t.due_date';

        const { rows } = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
};

exports.createTask = async (req, res) => {
    const { title, description, address, maps_link, due_date, assigned_to, lat, lng } = req.body;

    try {
        if (!title || !address) {
            return res.status(400).json({ message: 'Title and Address are required' });
        }

        // 1. Create Task
        const { rows } = await db.query(
            'INSERT INTO tasks (title, description, address, maps_link, due_date, lat, lng, region) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [title, description, address, maps_link, due_date || null, req.body.lat || null, req.body.lng || null, req.body.region || 'Diğer']
        );
        const task = rows[0];

        // 2. Handle Assignments (Expect Array of IDs)
        if (assigned_to && Array.isArray(assigned_to) && assigned_to.length > 0) {
            for (const userId of assigned_to) {
                await db.query(
                    'INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [task.id, userId]
                );
                // NOTIFICATION
                await notificationController.createNotification(userId, `Yeni Gezici Görev: ${title}`, 'task');
            }
        }
        // Backward compatibility for single ID
        else if (assigned_to && !Array.isArray(assigned_to)) {
            await db.query(
                'INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [task.id, assigned_to]
            );
        }

        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
};

exports.updateTask = async (req, res) => {
    const { id } = req.params;
    const { status, assigned_to, title, description } = req.body;

    try {
        // 1. Update Basic Fields
        let query = 'UPDATE tasks SET ';
        const params = [id];
        const updates = [];
        let counter = 2; // $1 is id

        if (status) { updates.push(`status = $${counter++}`); params.push(status); }
        if (req.body.due_date !== undefined) {
            updates.push(`due_date = $${counter++}`);
            params.push(req.body.due_date || null);
        }
        if (title) { updates.push(`title = $${counter++}`); params.push(title); }
        if (description) { updates.push(`description = $${counter++}`); params.push(description); }
        if (req.body.region) { updates.push(`region = $${counter++}`); params.push(req.body.region); }
        if (req.body.service_form_no) { updates.push(`service_form_no = $${counter++}`); params.push(req.body.service_form_no); }
        if (req.body.is_quoted !== undefined) { updates.push(`is_quoted = $${counter++}`); params.push(req.body.is_quoted); }

        // Only run update if there are fields (excluding assigned_to which is handled separately)
        if (updates.length > 0) {
            query += updates.join(', ') + ' WHERE id = $1 RETURNING *';
            await db.query(query, params);
        }

        // 2. Handle Assignments Update (If provided)
        if (assigned_to !== undefined) {
            // Clear existing
            await db.query('DELETE FROM task_assignments WHERE task_id = $1', [id]);

            // Insert New
            const userIds = Array.isArray(assigned_to) ? assigned_to : [assigned_to];
            // Filter out null/empty if any
            const validIds = userIds.filter(uid => uid);

            for (const uid of validIds) {
                await db.query('INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2)', [id, uid]);
            }
        }

        // Return updated task with new assignments
        const result = await exports.getTaskByIdInternal(id); // Helper to get full object

        // NOTIFICATION FOR NEW ASSIGNMENTS
        if (assigned_to !== undefined && result) {
            const userIds = Array.isArray(assigned_to) ? assigned_to : [assigned_to];
            const validIds = userIds.filter(uid => uid);
            for (const uid of validIds) {
                await notificationController.createNotification(uid, `Size yeni bir görev atandı: ${result.title}`, 'task');
            }
        }

        res.json(result);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
};

// Internal Helper to get fresh task data after update
exports.getTaskByIdInternal = async (id) => {
    const query = `
            SELECT t.*, 
            COALESCE(
                (SELECT json_agg(json_build_object('id', u.id, 'username', u.username))
                 FROM task_assignments ta
                 JOIN users u ON ta.user_id = u.id
                 WHERE ta.task_id = t.id),
                '[]'
            ) as assigned_users
            FROM tasks t WHERE t.id = $1
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
};

exports.deleteTask = async (req, res) => {
    const { id } = req.params;
    try {
        const { rowCount } = await db.query('DELETE FROM tasks WHERE id = $1', [id]);

        if (rowCount === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json({ message: 'Task deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
};

exports.addPhoto = async (req, res) => {
    const { id } = req.params;
    // req.file is from multer
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const { type, gps_lat, gps_lng } = req.body;

    // Cloudinary returns the full SSL URL in req.file.path
    const url = req.file.path;

    try {
        const { rows } = await db.query(
            'INSERT INTO photos (task_id, url, type, gps_lat, gps_lng) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [id, url, type, gps_lat, gps_lng]
        );
        res.json(rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
};

exports.getTaskById = async (req, res) => {
    const { id } = req.params;
    try {
        const taskQuery = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
        if (taskQuery.rows.length === 0) return res.status(404).json({ message: 'Task not found' });

        const photosQuery = await db.query('SELECT * FROM photos WHERE task_id = $1', [id]);

        const task = taskQuery.rows[0];
        task.photos = photosQuery.rows;

        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
};

// NEW: Cancel / Return Task to Pool
exports.cancelTask = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id; // From auth middleware

    try {
        // 1. Log to task_logs
        await db.query(
            'INSERT INTO task_logs (task_id, user_id, action, description) VALUES ($1, $2, $3, $4)',
            [id, userId, 'cancelled', reason]
        );

        // 2. Reset Task (Status: pending) & Clear Assignments
        await db.query('DELETE FROM task_assignments WHERE task_id = $1', [id]);

        const { rows } = await db.query(
            'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
            ['pending', id]
        );

        if (rows.length === 0) return res.status(404).json({ message: 'Task not found' });

        res.json({ message: 'Task returned to pool', task: rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
};


