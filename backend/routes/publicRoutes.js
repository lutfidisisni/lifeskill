const express = require('express');
const router = express.Router();
const { registerStudent } = require('../controllers/studentController');

// @route   POST /api/register
// @desc    Register a new student without authentication
// @access  Public
router.post('/register', registerStudent);

module.exports = router;
