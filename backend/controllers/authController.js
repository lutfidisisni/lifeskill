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

const updateCredentials = async (req, res) => {
    const { currentPassword, newUsername, newPassword } = req.body;

    if (!currentPassword || (!newUsername && !newPassword)) {
        return res.status(400).json({ message: 'Password saat ini dan data baru harus diisi' });
    }

    try {
        // Ambil admin pertama atau berdasarkan token id
        const [rows] = await db.execute('SELECT * FROM admins LIMIT 1');
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Admin tidak ditemukan' });
        }

        const admin = rows[0];
        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Password saat ini salah' });
        }

        let updatedUsername = admin.username;
        let updatedPassword = admin.password;

        if (newUsername && newUsername.trim() !== '') {
            updatedUsername = newUsername.trim();
        }

        if (newPassword && newPassword.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            updatedPassword = await bcrypt.hash(newPassword.trim(), salt);
        }

        await db.execute('UPDATE admins SET username = ?, password = ? WHERE id = ?', [
            updatedUsername,
            updatedPassword,
            admin.id,
        ]);

        res.json({
            message: 'Kredensial admin berhasil diperbarui',
            username: updatedUsername,
        });
    } catch (error) {
        console.error('Update credentials error:', error);
        res.status(500).json({ message: 'Gagal memperbarui kredensial' });
    }
};

module.exports = { loginAdmin, updateCredentials };
