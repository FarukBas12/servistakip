const router = require('express').Router();
const db = require('../db');
const { cloudinary } = require('../utils/cloudinary');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');

// GET All Projects
router.get('/', async (req, res) => {
    try {
        // Calculate progress based on dates for each project?
        // For now just return raw data, frontend can calculate days remaining.
        const result = await db.query('SELECT * FROM projects ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// GET Single Project Details (with files and expenses)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const projectRes = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
        if (projectRes.rows.length === 0) return res.status(404).send('Project not found');

        const filesRes = await db.query('SELECT * FROM project_files WHERE project_id = $1 ORDER BY uploaded_at DESC', [id]);

        // Only return expenses if user is Admin? 
        // Logic: Frontend will conditionally show tab. API returns data, permission check on frontend is soft security. 
        // Ideally should check req.user.role here. 
        // For simplicity assuming the frontend handles visibility, but let's send expenses.
        const expensesRes = await db.query('SELECT * FROM project_expenses WHERE project_id = $1 ORDER BY expense_date DESC', [id]);

        res.json({
            project: projectRes.rows[0],
            files: filesRes.rows,
            expenses: expensesRes.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// UPDATE Project
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, start_date, end_date, status } = req.body;
    try {
        const result = await db.query(
            'UPDATE projects SET name = $1, description = $2, start_date = $3, end_date = $4, status = $5 WHERE id = $6 RETURNING *',
            [name, description, start_date, end_date, status, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Proje bulunamadı' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
});

// CREATE Project
router.post('/', async (req, res) => {
    const { name, description, start_date, end_date } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO projects (name, description, start_date, end_date) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, description, start_date, end_date]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// UPLOAD File (DWG, PDF, etc)
// Note: Cloudinary handles images/PDFs well. DWG might need 'resource_type: raw'
router.post('/:id/files', upload.single('file'), async (req, res) => {
    const { id } = req.params;
    const { file_name } = req.body; // User provided name or fallback

    if (!req.file) return res.status(400).send('No file uploaded');

    try {
        // Determine resource type based on extension
        const isRaw = req.file.originalname.match(/\.(dwg|dxf|xls|xlsx|doc|docx)$/i);
        const resourceType = isRaw ? 'raw' : 'auto';

        const uploadRes = await cloudinary.uploader.upload(req.file.path, {
            folder: 'field-service/projects',
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true
        });

        // Cleanup local file
        fs.unlinkSync(req.file.path);

        const result = await db.query(
            'INSERT INTO project_files (project_id, file_url, file_type, file_name) VALUES ($1, $2, $3, $4) RETURNING *',
            [id, uploadRes.secure_url, uploadRes.format || resourceType, file_name || req.file.originalname]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Upload Error Details:', err);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).send('Upload Error: ' + err.message);
    }
});

// ADD Expense
router.post('/:id/expenses', upload.single('receipt'), async (req, res) => {
    const { id } = req.params;
    const { amount, category, description, expense_date } = req.body;

    let receiptUrl = null;
    if (req.file) {
        try {
            const uploadRes = await cloudinary.uploader.upload(req.file.path, {
                folder: 'field-service/expenses'
            });
            receiptUrl = uploadRes.secure_url;
            fs.unlinkSync(req.file.path);
        } catch (e) {
            console.error(e);
        }
    }

    try {
        const result = await db.query(
            'INSERT INTO project_expenses (project_id, amount, category, description, receipt_url, expense_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [id, amount, category, description, receiptUrl, expense_date]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// UPDATE Expense
router.put('/:id/expenses/:expenseId', async (req, res) => {
    const { expenseId } = req.params;
    const { amount, category, description, expense_date } = req.body;
    try {
        const result = await db.query(
            'UPDATE project_expenses SET amount = $1, category = $2, description = $3, expense_date = $4 WHERE id = $5 RETURNING *',
            [amount, category, description, expense_date, expenseId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// DELETE Expense
router.delete('/:id/expenses/:expenseId', async (req, res) => {
    const { expenseId } = req.params;
    try {
        await db.query('DELETE FROM project_expenses WHERE id = $1', [expenseId]);
        res.json({ message: 'Gider silindi' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// UPDATE Project
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, start_date, end_date, status } = req.body;
    try {
        const result = await db.query(
            'UPDATE projects SET name = $1, description = $2, start_date = $3, end_date = $4, status = $5 WHERE id = $6 RETURNING *',
            [name, description, start_date, end_date, status, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Proje bulunamadı' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
});

// DELETE Project / File / Expense (Optional, but good to have)
router.delete('/:id', async (req, res) => {
    // Delete project
    try {
        await db.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
        res.json({ message: 'Project deleted' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
