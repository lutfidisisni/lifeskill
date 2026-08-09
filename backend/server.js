const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const db = require('./config/db');

// Load env vars
dotenv.config({ path: './.env' });

// Import routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Body parser

// Auto-initialize tables and default admin if not exist
async function initDatabase() {
    try {
        const connection = await db.getConnection();
        console.log('MySQL Connected successfully...');

        // 1. Table students
        await connection.query(`
            CREATE TABLE IF NOT EXISTS students (
                id VARCHAR(50) PRIMARY KEY,
                fullName VARCHAR(255) NOT NULL,
                classLevel VARCHAR(20) NOT NULL,
                whatsappNumber VARCHAR(30) NOT NULL,
                lifeSkill VARCHAR(100) NOT NULL,
                jenisKelamin ENUM('Laki-laki', 'Perempuan') NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // 2. Table admins
        await connection.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. Ensure default admin exists if empty
        const [adminRows] = await connection.query('SELECT COUNT(*) as count FROM admins');
        if (adminRows[0].count === 0) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            await connection.query('INSERT INTO admins (username, password) VALUES (?, ?)', ['admin', hashedPassword]);
            console.log('Default admin created: username=admin, password=admin123');
        }

        connection.release();
    } catch (err) {
        console.error('Database initialization warning:', err.message);
    }
}

initDatabase();

// Mount routers with '/api' prefix
app.use('/api', authRoutes);
app.use('/api', publicRoutes); // Public routes for registration
app.use('/api', studentRoutes); // Protected routes for admin

// Simple route for checking if server is up
app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});