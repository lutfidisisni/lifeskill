# Backend Aplikasi Life Skill

Ini adalah backend untuk aplikasi manajemen Life Skill yang dibuat dengan Node.js, Express, dan MySQL. Dokumentasi ini mencakup cara setup untuk pengembangan lokal dan cara deployment menggunakan aaPanel.

## Daftar Isi
- [Setup untuk Pengembangan Lokal](#setup-untuk-pengembangan-lokal)
- [Deployment di aaPanel](#deployment-di-aapanel)
- [Endpoints API](#endpoints-api)

---

## Setup untuk Pengembangan Lokal

Bagian ini menjelaskan cara menjalankan server backend di komputer Anda untuk tujuan pengembangan.

### Prasyarat Lokal
-   [Node.js](https://nodejs.org/) (versi 16 atau lebih tinggi)
-   [MySQL](https://www.mysql.com/) atau MariaDB

### 1. Setup Database Lokal

1.  Masuk ke *shell* MySQL Anda.
2.  Buat database baru untuk aplikasi ini.
    ```sql
    CREATE DATABASE lifeskills_db;
    ```
3.  Gunakan database yang baru dibuat.
    ```sql
    USE lifeskills_db;
    ```
4.  Buat tabel `students` dan `admins` dengan menjalankan skema SQL berikut.
    ```sql
    -- Tabel untuk data siswa
    CREATE TABLE students (
        id VARCHAR(36) PRIMARY KEY,
        fullName VARCHAR(255) NOT NULL,
        classLevel VARCHAR(10) NOT NULL,
        whatsappNumber VARCHAR(20) NOT NULL,
        lifeSkill ENUM('Tata Rias', 'Tata Boga', 'Tata Busana', 'Setir Mobil', 'Desain Grafis', 'Otomotif') NULL DEFAULT NULL,
        jenisKelamin ENUM('Laki-laki', 'Perempuan') NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    -- Tabel untuk admin (pengguna yang bisa login)
    CREATE TABLE admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ```
5.  Buat pengguna admin awal. Password `admin123` akan di-hash. Jalankan perintah SQL berikut untuk memasukkan admin default.
    ```sql
    -- Password untuk 'admin' adalah 'admin123'
    -- Hash ini dibuat menggunakan bcrypt dengan salt 10
    INSERT INTO admins (username, password) VALUES ('admin', '$2a$10$fV/F0sq8SoH9a/aA.p2sR.Xq9R3OAxWzYJt.N2uK.ft4V.9dGg.8u');
    ```

### 2. Setup Proyek Lokal

1.  Arahkan ke direktori `backend` dari terminal Anda.
    ```bash
    cd backend
    ```
2.  Instal semua dependensi yang dibutuhkan.
    ```bash
    npm install
    ```
3.  Buat file `.env` di dalam direktori `backend` dengan menyalin dari `.env.example`.
    ```bash
    cp .env.example .env
    ```
4.  Ubah file `.env` dan isi dengan kredensial database MySQL lokal Anda.
    ```env
    PORT=5000
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=password_anda
    DB_NAME=lifeskills_db
    JWT_SECRET=kunci_rahasia_jwt_yang_sangat_aman
    ```

### 3. Menjalankan Server Lokal

1.  Untuk menjalankan server dalam mode pengembangan (dengan *hot-reload* menggunakan `nodemon`):
    ```bash
    npm run dev
    ```
2.  Untuk menjalankan server dalam mode produksi:
    ```bash
    npm start
    ```
Server akan berjalan di `http://localhost:5000`.

---

## Deployment di aaPanel

Bagian ini menjelaskan cara men-deploy aplikasi backend di server yang menggunakan aaPanel dengan fitur Node Project.

### Prasyarat Server
-   Server dengan aaPanel terinstal.
-   Dari menu **App Store** di aaPanel, pastikan **Node.js Version Manager** dan **MySQL** sudah terinstal.

### 1. Setup Database di Server
-   Buka menu **Databases** di aaPanel dan buat database baru. Catat nama database, username, dan password yang dibuat oleh aaPanel.
-   Masuk ke database tersebut (misalnya melalui phpMyAdmin yang disediakan aaPanel) dan jalankan skema SQL dari [langkah 1 Setup Database Lokal](#1-setup-database-lokal) untuk membuat tabel `students` dan `admins`, serta memasukkan data admin awal.

### 2. Upload Kode Proyek
-   Buka menu **Files**.
-   Navigasi ke direktori tempat Anda ingin menyimpan proyek, misalnya `/www/wwwroot/nama_domain_anda`.
-   Upload semua file dan folder dari direktori `backend` proyek ini ke server. Pastikan semua file termasuk `package.json` dan `server.js` ada di dalam direktori tersebut.

### 3. Konfigurasi Node Project di aaPanel
1.  Buka menu **Website** -> **Node project** -> **Add Node project**.
2.  Isi formulir dengan konfigurasi berikut:
    -   **Project name**: Beri nama yang deskriptif (misal: `lifeskill-backend`).
    -   **Path**: Pilih direktori tempat Anda mengupload file-file backend.
    -   **Node Version**: Pilih versi Node.js yang sesuai (misal: 16.x atau lebih tinggi).
    -   **Project mode**: Pilih **Production**.
    -   **Run file**: Masukkan `server.js`.
    -   **Port**: Masukkan port yang Anda definisikan di file `.env`, misalnya `5000`.
    -   **Install modules**: Klik tombol **Install** untuk menjalankan `npm install` secara otomatis.
3.  Klik **Submit**.

### 4. Konfigurasi File `.env` di Server
1.  Di menu **Files**, navigasi ke direktori proyek Anda.
2.  Buat file baru bernama `.env`.
3.  Isi file `.env` dengan konfigurasi yang sesuai untuk server. **Ini sangat penting.**
    ```env
    PORT=5000 # Pastikan port ini sama dengan yang di-set di Node Project aaPanel
    DB_HOST=localhost
    DB_USER=user_db_dari_aapanel
    DB_PASSWORD=password_db_dari_aapanel
    DB_NAME=nama_db_dari_aapanel
    JWT_SECRET=buat_kunci_rahasia_yang_sangat_kuat_dan_unik
    ```
4.  Simpan file tersebut.

### 5. Mapping Domain & Menjalankan Proyek
1.  Setelah proyek Node ditambahkan, kembali ke daftar **Node project**.
2.  Klik **Map** pada proyek Anda untuk mengaitkannya dengan domain atau subdomain. Ini akan secara otomatis membuat *proxy pass* di Nginx dari domain publik ke port lokal Node.js Anda.
3.  Kembali ke daftar **Node project**, pastikan status proyek adalah **Running**. Anda bisa menggunakan tombol **Start**, **Stop**, dan **Restart** untuk mengelola proses server.
4.  Untuk memeriksa *log* atau jika terjadi error, klik **Log** pada proyek Anda di aaPanel.

---

## Endpoints API

-   `POST /api/login`: Login untuk admin.
-   `POST /api/register`: Mendaftarkan siswa baru (rute publik).
-   `GET /api/students`: Mendapatkan semua data siswa (memerlukan autentikasi).
-   `POST /api/students`: Menambahkan siswa baru oleh admin (memerlukan autentikasi).
-   `PUT /api/students/:id`: Memperbarui data siswa (memerlukan autentikasi).
-   `DELETE /api/students/:id`: Menghapus data siswa (memerlukan autentikasi).