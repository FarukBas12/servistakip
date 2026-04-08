const db = require('../db');
const notificationController = require('./notificationController');

exports.getTasks = async (req, res) => {
    try {
        let query = `
            SELECT t.*, 
            COALESCE(
                (SELECT json_agg(json_build_object('id', u.id, 'username', u.username))
                 FROM task_assignments ta
                 JOIN users u ON ta.user_id = u.id
                 WHERE ta.task_id = t.id),
                '[]'
            ) as assigned_users,
            editor.username as last_editor,
            verifier.username as verified_by_user,
            (SELECT description FROM task_logs tl WHERE tl.task_id = t.id AND tl.action = 'cancelled' ORDER BY tl.created_at DESC LIMIT 1) as last_cancel_reason,
            (SELECT COUNT(*) FROM task_logs tl WHERE tl.task_id = t.id AND tl.action = 'cancelled') as cancel_count
            FROM tasks t
            LEFT JOIN users editor ON t.updated_by = editor.id
            LEFT JOIN users verifier ON t.verified_by = verifier.id
        `;
        const params = [];

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
        console.error('getTasks error:', err);
        res.status(500).json({ message: 'Görev listesi alınamadı.', error: err.message });
    }
};

exports.createTask = async (req, res) => {
    const { title, description, address, maps_link, due_date, assigned_to, lat, lng } = req.body;

    try {
        if (!title || !address) {
            return res.status(400).json({ message: 'Başlık ve Adres zorunludur.' });
        }

        const { rows } = await db.query(
            'INSERT INTO tasks (title, description, address, maps_link, due_date, lat, lng, region) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [title, description, address, maps_link, due_date || null, lat || null, lng || null, req.body.region || 'Diğer']
        );
        const task = rows[0];

        if (assigned_to && Array.isArray(assigned_to) && assigned_to.length > 0) {
            for (const userId of assigned_to) {
                await db.query(
                    'INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [task.id, userId]
                );
                await notificationController.createNotification(userId, `Yeni Gezici Görev: ${title}`, 'task');
            }
        }
        else if (assigned_to && !Array.isArray(assigned_to)) {
            await db.query(
                'INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [task.id, assigned_to]
            );
        }

        res.json(task);
    } catch (err) {
        console.error('createTask error:', err);
        res.status(500).json({ message: 'Görev oluşturulamadı.', error: err.message });
    }
};

exports.updateTask = async (req, res) => {
    const { id } = req.params;
    const { status, assigned_to, title, description } = req.body;

    try {
        let updatedTask = null;
        let query = 'UPDATE tasks SET ';
        const params = [id];
        const updates = [];
        let counter = 2;

        if (status) { updates.push(`status = $${counter++}`); params.push(status); }
        if (req.body.due_date !== undefined) {
            updates.push(`due_date = $${counter++}`);
            params.push(req.body.due_date || null);
        }
        if (title) { updates.push(`title = $${counter++}`); params.push(title); }
        if (description) { updates.push(`description = $${counter++}`); params.push(description); }
        if (req.body.address) { updates.push(`address = $${counter++}`); params.push(req.body.address); }
        if (req.body.maps_link) { updates.push(`maps_link = $${counter++}`); params.push(req.body.maps_link); }
        if (req.body.region) { updates.push(`region = $${counter++}`); params.push(req.body.region); }
        if (req.body.service_form_no) { updates.push(`service_form_no = $${counter++}`); params.push(req.body.service_form_no); }
        if (req.body.is_quoted !== undefined) { updates.push(`is_quoted = $${counter++}`); params.push(req.body.is_quoted); }
        if (req.body.is_retry !== undefined) { updates.push(`is_retry = $${counter++}`); params.push(req.body.is_retry); }

        updates.push(`updated_by = $${counter++}`);
        params.push(req.user.id);

        if (updates.length > 0) {
            query += updates.join(', ') + ' WHERE id = $1 RETURNING *';
            const { rows } = await db.query(query, params);
            updatedTask = rows[0];
        } else {
            updatedTask = await exports.getTaskByIdInternal(id);
        }

        if (assigned_to !== undefined) {
            await db.query('DELETE FROM task_assignments WHERE task_id = $1', [id]);
            const userIds = Array.isArray(assigned_to) ? assigned_to : [assigned_to];
            const validIds = userIds.filter(uid => uid);

            if (validIds.length > 0) {
                const values = [];
                const valueParams = [id];
                let paramCounter = 2;
                validIds.forEach(uid => {
                    values.push(`($1, $${paramCounter++})`);
                    valueParams.push(uid);
                });
                const insertQuery = `INSERT INTO task_assignments (task_id, user_id) VALUES ${values.join(', ')}`;
                await db.query(insertQuery, valueParams);

                const notificationPromises = validIds.map(uid =>
                    notificationController.createNotification(uid, `Size yeni bir görev atandı: ${updatedTask ? updatedTask.title : 'Görev'}`, 'task')
                );
                await Promise.all(notificationPromises);
            }
        }

        res.json(updatedTask);
    } catch (err) {
        console.error('updateTask error:', err);
        res.status(500).json({ message: 'Görev güncellenemedi.', error: err.message });
    }
};

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
        if (rowCount === 0) return res.status(404).json({ message: 'Görev bulunamadı.' });
        res.json({ message: 'Görev silindi.' });
    } catch (err) {
        console.error('deleteTask error:', err);
        res.status(500).json({ message: 'Görev silinemedi.', error: err.message });
    }
};

exports.addPhoto = async (req, res) => {
    const { id } = req.params;
    const files = req.files || (req.file ? [req.file] : []);
    if (files.length === 0) return res.status(400).json({ message: 'Dosya yüklenmedi.' });

    const { type, gps_lat, gps_lng } = req.body;
    const uploadedPhotos = [];

    try {
        for (const file of files) {
            const url = file.path;
            const { rows } = await db.query(
                'INSERT INTO photos (task_id, url, type, gps_lat, gps_lng) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [id, url, type, gps_lat, gps_lng]
            );
            uploadedPhotos.push(rows[0]);
        }
        res.json(uploadedPhotos);
    } catch (err) {
        console.error('addPhoto error:', err);
        res.status(500).json({ message: 'Fotoğraf yüklenemedi.', error: err.message });
    }
};

exports.getTaskById = async (req, res) => {
    const { id } = req.params;
    try {
        const taskQuery = await db.query(`
            SELECT t.*, 
            COALESCE(
                (SELECT json_agg(json_build_object('id', u.id, 'username', u.username))
                 FROM task_assignments ta
                 JOIN users u ON ta.user_id = u.id
                 WHERE ta.task_id = t.id),
                '[]'
            ) as assigned_users
            FROM tasks t WHERE t.id = $1
        `, [id]);

        if (taskQuery.rows.length === 0) return res.status(404).json({ message: 'Görev bulunamadı.' });

        const photosQuery = await db.query('SELECT * FROM photos WHERE task_id = $1', [id]);
        const task = taskQuery.rows[0];
        task.photos = photosQuery.rows;

        res.json(task);
    } catch (err) {
        console.error('getTaskById error:', err);
        res.status(500).json({ message: 'Görev detayı alınamadı.', error: err.message });
    }
};

exports.cancelTask = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    try {
        await db.query(
            'INSERT INTO task_logs (task_id, user_id, action, description) VALUES ($1, $2, $3, $4)',
            [id, userId, 'cancelled', reason]
        );
        await db.query('DELETE FROM task_assignments WHERE task_id = $1', [id]);
        const { rows } = await db.query(
            'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
            ['pending', id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Görev bulunamadı.' });
        res.json({ message: 'Görev havuza iade edildi.', task: rows[0] });
    } catch (err) {
        console.error('cancelTask error:', err);
        res.status(500).json({ message: 'İşlem başarısız.', error: err.message });
    }
};

exports.deletePhoto = async (req, res) => {
    const { id, photoId } = req.params;
    try {
        const { rowCount } = await db.query('DELETE FROM photos WHERE id = $1 AND task_id = $2', [photoId, id]);
        if (rowCount === 0) return res.status(404).json({ message: 'Fotoğraf bulunamadı.' });
        res.json({ message: 'Fotoğraf silindi.' });
    } catch (err) {
        console.error('deletePhoto error:', err);
        res.status(500).json({ message: 'Fotoğraf silinemedi.', error: err.message });
    }
};

exports.verifyTask = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('UPDATE tasks SET verified_by = $1 WHERE id = $2', [req.user.id, id]);
        res.json({ message: 'Görev doğrulandı.' });
    } catch (err) {
        console.error('verifyTask error:', err);
        res.status(500).json({ message: 'Doğrulama başarısız.', error: err.message });
    }
};

exports.toggleRetry = async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query(
            'UPDATE tasks SET is_retry = NOT is_retry WHERE id = $1 RETURNING is_retry',
            [id]
        );
        res.json({ is_retry: rows[0].is_retry });
    } catch (err) {
        res.status(500).json({ message: 'Hata oluştu' });
    }
};
