const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const { storage } = require('../utils/cloudinary');

// Init Upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 }, // 10MB
}).array('photos', 20); // 'photos' is the form field name, max 20 files

function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}


// All routes protected
router.use(auth);

// Routes
router.get('/', taskController.getTasks);
router.post('/', taskController.createTask); // Should ideally restrict to Admin
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.post('/:id/photos', upload, taskController.addPhoto);
router.delete('/:id/photos/:photoId', taskController.deletePhoto); // NEW: Delete photo
router.post('/:id/cancel', taskController.cancelTask); // NEW: Return task to pool


module.exports = router;
