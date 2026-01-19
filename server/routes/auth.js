const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', authController.login);
router.get('/users', authController.getUsers);
router.post('/register', authController.createUser); // Ideally protected
router.delete('/:id', authController.deleteUser);

module.exports = router;
