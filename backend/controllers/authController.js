const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1d', // Token expires in 1 day
    });
};

const loginAdmin = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please provide username and password' });
    }

    try {
        const [rows] = await db.execute('SELECT * FROM admins WHERE username = ?', [username]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const admin = rows[0];

        const isMatch = await bcrypt.compare(password, admin.password);

        if (isMatch) {
            res.json({
                message: 'Login successful',
                token: generateToken(admin.id),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { loginAdmin };
