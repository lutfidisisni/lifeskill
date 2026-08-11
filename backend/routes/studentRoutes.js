const express = require('express');
const router = express.Router();
const {
    getQuotas,
    getStudents,
    addStudent,
    updateStudent,
    deleteStudent,
    bulkDeleteStudents,
    clearAllStudents,
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

router.delete('/students-clear-all', protect, clearAllStudents);
router.post('/students-bulk-delete', protect, bulkDeleteStudents);
router.post('/students/bulk-delete', protect, bulkDeleteStudents);
router.delete('/students/bulk', protect, bulkDeleteStudents);

router.route('/students')
    .get(protect, getStudents)
    .post(protect, addStudent);

router.route('/students/:id')
    .put(protect, updateStudent)
    .delete(protect, deleteStudent);

module.exports = router;
