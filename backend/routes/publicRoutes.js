const express = require('express');
const router = express.Router();
const { registerStudent, getQuotas } = require('../controllers/studentController');

// @route   GET /api/quotas
// @desc    Get quota availability status for all life skills
// @access  Public
router.get('/quotas', getQuotas);

// @route   POST /api/register
// @desc    Register a new student without authentication
// @access  Public
router.post('/register', registerStudent);

module.exports = router;
