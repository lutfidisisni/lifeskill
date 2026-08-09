-- ==========================================================
-- Inisialisasi Database Life Skill MA NU 01 Banyuputih
-- ==========================================================

CREATE DATABASE IF NOT EXISTS lifeskill_manusa;
USE lifeskill_manusa;

-- 1. Tabel data siswa
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(50) PRIMARY KEY,
    fullName VARCHAR(255) NOT NULL,
    classLevel VARCHAR(20) NOT NULL,
    whatsappNumber VARCHAR(30) NOT NULL,
    lifeSkill VARCHAR(100) NOT NULL,
    jenisKelamin ENUM('Laki-laki', 'Perempuan') NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Tabel akun administrator
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Akun Admin Awal:
--    Username: admin
--    Password: admin123
INSERT IGNORE INTO admins (id, username, password) 
VALUES (1, 'admin', '$2a$10$fV/F0sq8SoH9a/aA.p2sR.Xq9R3OAxWzYJt.N2uK.ft4V.9dGg.8u');
