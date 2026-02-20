const express = require('express');
const router = express.Router();
const authorize = require('../middleware/authorize');
const taskController = require('../controllers/taskController');
const { upload } = require('../utils/cloudinary');
const { validate, schemas } = require('../middleware/validation'); // Import validation

// Get All Tasks (Technician sees assigned, Admin sees all)
router.get('/', authorize(['admin', 'technician', 'depocu']), taskController.getTasks);

// Get Single Task
router.get('/:id', authorize(['admin', 'technician', 'depocu']), taskController.getTaskById);

// Create Task
router.post('/', authorize(['admin']), validate(schemas.createTask), taskController.createTask); // Added validation

// Update Task
router.put('/:id', authorize(['admin', 'technician']), validate(schemas.updateTask), taskController.updateTask); // Added validation

// Add Photo (Uses Multer -> Cloudinary)
// 'photos' is the field name in FormData, max 5 photos at once
router.post('/:id/photos', authorize(['admin', 'technician']), upload.array('photos', 5), taskController.addPhoto);

// Delete Photo
router.delete('/:id/photos/:photoId', authorize(['admin']), taskController.deletePhoto);

// Delete Task
router.delete('/:id', authorize(['admin']), taskController.deleteTask);

// Cancel Task (Return to Pool)
router.post('/:id/cancel', authorize(['technician', 'admin']), taskController.cancelTask);

// Verify Task
router.put('/:id/verify', authorize(['admin']), taskController.verifyTask);

module.exports = router;
