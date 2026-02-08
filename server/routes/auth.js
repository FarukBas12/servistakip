const express = require('express');
const router = express.Router();
const multer = require('multer');
const authController = require('../controllers/authController');

// Multer config for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', authController.login);

// @route   GET api/auth/users
// @desc    Get all users
router.get('/users', authController.getUsers);

// @route   POST api/auth/register
// @desc    Create new user
router.post('/register', authController.createUser);

// @route   PUT api/auth/:id
// @desc    Update user
router.put('/:id', authController.updateUser);

// @route   POST api/auth/upload-photo
// @desc    Upload user photo
router.post('/upload-photo', upload.single('photo'), authController.uploadPhoto);

// @route   POST api/auth/migrate
// @desc    Run database migration for new fields
router.post('/migrate', authController.migrateUsers);

// @route   DELETE api/auth/:id
// @desc    Delete user
router.delete('/:id', authController.deleteUser);

module.exports = router;
