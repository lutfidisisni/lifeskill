const express = require('express');
const router = express.Router();
const {
    getStudents,
    addStudent,
    updateStudent,
    deleteStudent
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/students')
    .get(protect, getStudents)
    .post(protect, addStudent);

router.route('/students/:id')
    .put(protect, updateStudent)
    .delete(protect, deleteStudent);

module.exports = router;
