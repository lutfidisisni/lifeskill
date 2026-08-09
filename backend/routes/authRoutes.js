const express = require('express');
const router = express.Router();
const { loginAdmin, updateCredentials } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', loginAdmin);
router.put('/change-credentials', protect, updateCredentials);

module.exports = router;
