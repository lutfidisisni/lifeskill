
const db = require('../config/db');
const { randomUUID } = require('crypto');

const LIFE_SKILL_QUOTAS = {
    'Desain Grafis': 35,
    'Otomotif': 42,
    'Tata Boga': 70,
    'Clothing Line': 35,
    'Setir Mobil': 63,
    'Tata Rias': 40
};

// @desc    Get quota status for all life skills
// @route   GET /api/quotas
// @access  Public
const getQuotas = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                CASE 
                    WHEN lifeSkill = 'Tata Busana' THEN 'Clothing Line'
                    ELSE lifeSkill 
                END as skill,
                COUNT(*) as count 
            FROM students 
            GROUP BY skill
        `);

        const registeredMap = {};
        rows.forEach(r => {
            if (r.skill) {
                registeredMap[r.skill] = (registeredMap[r.skill] || 0) + Number(r.count);
            }
        });

        const quotas = Object.keys(LIFE_SKILL_QUOTAS).map(skill => {
            const quota = LIFE_SKILL_QUOTAS[skill];
            const registered = registeredMap[skill] || 0;
            const remaining = Math.max(0, quota - registered);
            return {
                skill,
                quota,
                registered,
                remaining,
                isFull: registered >= quota
            };
        });

        res.json(quotas);
    } catch (error) {
        console.error('Get quotas error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all students
// @route   GET /api/students
// @access  Private
const getStudents = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM students ORDER BY fullName ASC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Register a new student (public)
// @route   POST /api/register
// @access  Public
const registerStudent = async (req, res) => {
    const { fullName, classLevel, whatsappNumber, jenisKelamin, lifeSkill } = req.body;
    
    if (!fullName || !classLevel || !whatsappNumber || !jenisKelamin || !lifeSkill) {
        return res.status(400).json({ message: 'Mohon lengkapi semua kolom isian.' });
    }

    const normalizedSkill = lifeSkill === 'Tata Busana' ? 'Clothing Line' : lifeSkill;
    const quotaLimit = LIFE_SKILL_QUOTAS[normalizedSkill];

    try {
        if (quotaLimit !== undefined) {
            const [countResult] = await db.query(
                'SELECT COUNT(*) as count FROM students WHERE lifeSkill = ? OR (lifeSkill = "Tata Busana" AND ? = "Clothing Line")',
                [normalizedSkill, normalizedSkill]
            );
            const currentCount = countResult[0]?.count || 0;
            if (currentCount >= quotaLimit) {
                return res.status(400).json({
                    message: `Mohon maaf, kuota untuk program Life Skill "${normalizedSkill}" telah penuh (${quotaLimit}/${quotaLimit} siswa). Silakan pilih program lain yang masih tersedia.`
                });
            }
        }

        const id = randomUUID();
        const query = 'INSERT INTO students (id, fullName, classLevel, whatsappNumber, jenisKelamin, lifeSkill) VALUES (?, ?, ?, ?, ?, ?)';
        await db.execute(query, [id, fullName, classLevel, whatsappNumber, jenisKelamin, normalizedSkill]);
        
        const [newStudent] = await db.query('SELECT * FROM students WHERE id = ?', [id]);
        res.status(201).json(newStudent[0]);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Add a new student (by Admin)
// @route   POST /api/students
// @access  Private
const addStudent = async (req, res) => {
    const { fullName, classLevel, whatsappNumber, lifeSkill, jenisKelamin } = req.body;
    
    if (!fullName || !classLevel || !whatsappNumber || !lifeSkill || !jenisKelamin) {
        return res.status(400).json({ message: 'Please fill all fields' });
    }

    const normalizedSkill = lifeSkill === 'Tata Busana' ? 'Clothing Line' : lifeSkill;
    const id = randomUUID();

    try {
        const query = 'INSERT INTO students (id, fullName, classLevel, whatsappNumber, lifeSkill, jenisKelamin) VALUES (?, ?, ?, ?, ?, ?)';
        await db.execute(query, [id, fullName, classLevel, whatsappNumber, normalizedSkill, jenisKelamin]);
        
        const [newStudent] = await db.query('SELECT * FROM students WHERE id = ?', [id]);
        res.status(201).json(newStudent[0]);
    } catch (error) {
        console.error('Admin add student error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a student
// @route   PUT /api/students/:id
// @access  Private
const updateStudent = async (req, res) => {
    const { id } = req.params;
    const { fullName, classLevel, whatsappNumber, lifeSkill, jenisKelamin } = req.body;
    
    if (!fullName || !classLevel || !whatsappNumber || !lifeSkill || !jenisKelamin) {
        return res.status(400).json({ message: 'Please fill all fields' });
    }

    const normalizedSkill = lifeSkill === 'Tata Busana' ? 'Clothing Line' : lifeSkill;

    try {
        const query = 'UPDATE students SET fullName = ?, classLevel = ?, whatsappNumber = ?, lifeSkill = ?, jenisKelamin = ? WHERE id = ?';
        const [result] = await db.execute(query, [fullName, classLevel, whatsappNumber, normalizedSkill, jenisKelamin, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        const [updatedStudent] = await db.query('SELECT * FROM students WHERE id = ?', [id]);
        res.json(updatedStudent[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a student
// @route   DELETE /api/students/:id
// @access  Private
const deleteStudent = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.execute('DELETE FROM students WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json({ message: 'Student removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Clear all students (by Admin)
// @route   DELETE /api/students-clear-all
// @access  Private
const clearAllStudents = async (req, res) => {
    try {
        await db.execute('DELETE FROM students');
        res.json({ message: 'Semua data siswa berhasil dibersihkan' });
    } catch (error) {
        console.error('Clear all students error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getQuotas,
    getStudents,
    registerStudent,
    addStudent,
    updateStudent,
    deleteStudent,
    clearAllStudents,
};

