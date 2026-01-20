const db = require('../db');

exports.getTasks = async (req, res) => {
    try {
        let query = 'SELECT t.*, u.username as assigned_user FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id';
        const params = [];

        // If technician, only show assigned tasks
        if (req.user.role === 'technician') {
            query += ' WHERE t.assigned_to = $1';
            params.push(req.user.id);
        }

        query += ' ORDER BY t.due_date';

        const { rows } = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.createTask = async (req, res) => {
    const { title, description, address, maps_link, due_date, assigned_to, lat, lng } = req.body;

    try {
        // Basic validation
        if (!title || !address) {
            return res.status(400).json({ message: 'Title and Address are required' });
        }

        const { rows } = await db.query(
            'INSERT INTO tasks (title, description, address, maps_link, due_date, assigned_to, lat, lng, region) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [title, description, address, maps_link, due_date || null, assigned_to || null, req.body.lat || null, req.body.lng || null, req.body.region || 'Diğer']
        );

        res.json(rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
};

exports.updateTask = async (req, res) => {
    const { id } = req.params;
    // status, assigned_to, title, description can be updated
    const { status, assigned_to, title, description } = req.body;

    try {
        // Build dynamic query
        let query = 'UPDATE tasks SET ';
        const params = [id];
        const updates = [];
        let counter = 2; // $1 is id

        if (status) {
            updates.push(`status = $${counter}`);
            params.push(status);
            counter++;
        }
        if (assigned_to !== undefined) { // Check undefined because null is valid (unassign)
            updates.push(`assigned_to = $${counter}`);
            params.push(assigned_to);
            counter++;
        }
        if (title) {
            updates.push(`title = $${counter}`);
            params.push(title);
            counter++;
        }
        if (description) {
            updates.push(`description = $${counter}`);
            params.push(description);
            counter++;
        }
        if (req.body.region) {
            updates.push(`region = $${counter}`);
            params.push(req.body.region);
            counter++;
        }

        if (updates.length === 0) {
            return res.json({ message: 'No updates provided' });
        }

        query += updates.join(', ') + ' WHERE id = $1 RETURNING *';

        const { rows } = await db.query(query, params);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
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
        res.status(500).send('Server Error');
    }
};

exports.addPhoto = async (req, res) => {
    const { id } = req.params;
    // req.file is from multer
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const { type, gps_lat, gps_lng } = req.body;

    // In a real app, upload to S3/Cloudinary here.
    // Currently file is saved specific folder by multer.
    // We construct a URL (assuming static file serving).
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

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
        res.status(500).send('Server Error');
    }
}
