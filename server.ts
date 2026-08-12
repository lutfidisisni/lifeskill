import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { DatabaseSync } from 'node:sqlite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_lifeskill_2026';

app.use(cors());
app.use(express.json());

// --- Database Setup ---
if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data', { recursive: true });
}
const db = new DatabaseSync('./data/lifeskill.sqlite');

db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        nis TEXT UNIQUE NOT NULL,
        fullName TEXT NOT NULL,
        classLevel TEXT NOT NULL,
        jenisKelamin TEXT NOT NULL,
        whatsappNumber TEXT,
        lifeSkill TEXT,
        createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS skill_settings (
        skill TEXT PRIMARY KEY,
        disabled INTEGER DEFAULT 0,
        reason TEXT DEFAULT ''
    );
`);

// Seed default skill settings if empty
const DEFAULT_SKILLS = [
    "Desain Grafis",
    "Otomotif",
    "Tata Boga",
    "Clothing Line",
    "Setir Mobil",
    "Tata Rias"
];
for (const skillName of DEFAULT_SKILLS) {
    db.prepare('INSERT OR IGNORE INTO skill_settings (skill, disabled, reason) VALUES (?, 0, ?)').run(skillName, '');
}

// Seed admin
const adminRow = db.prepare('SELECT * FROM admins WHERE username = ?').get('admin');
if (!adminRow) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)').run('admin', hash);
}

// --- Auth Middleware ---
const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Akses ditolak' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.status(403).json({ message: 'Token tidak valid' });
        req.user = user;
        next();
    });
};

// --- API Routes ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    try {
        const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username) as any;
        if (!admin) return res.status(401).json({ message: 'Username atau password salah' });
        
        if (bcrypt.compareSync(password, admin.password)) {
            const token = jwt.sign({ username: admin.username }, JWT_SECRET, { expiresIn: '1d' });
            res.json({ token, user: { username: admin.username } });
        } else {
            res.status(401).json({ message: 'Username atau password salah' });
        }
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

app.put('/api/change-credentials', authenticate, (req: any, res: any) => {
    const { currentPassword, newUsername, newPassword } = req.body;
    const username = req.user.username;

    try {
        const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username) as any;
        if (!admin) return res.status(404).json({ message: 'Admin tidak ditemukan' });
        if (!bcrypt.compareSync(currentPassword, admin.password)) {
            return res.status(401).json({ message: 'Password saat ini salah' });
        }

        const updatedUsername = newUsername || admin.username;
        const updatedPassword = newPassword ? bcrypt.hashSync(newPassword, 10) : admin.password;

        db.prepare('UPDATE admins SET username = ?, password = ? WHERE id = ?')
          .run(updatedUsername, updatedPassword, admin.id);
        
        res.json({ message: 'Kredensial berhasil diperbarui' });
    } catch (e: any) {
        res.status(500).json({ message: 'Gagal update kredensial' });
    }
});

app.get('/api/students', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM students').all();
        res.json(rows);
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

app.post('/api/students', authenticate, (req, res) => {
    const s = req.body;
    const id = `mst-${s.nis}`;
    const createdAt = new Date().toISOString();
    
    try {
        db.prepare(`INSERT INTO students (id, nis, fullName, classLevel, jenisKelamin, whatsappNumber, lifeSkill, createdAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
          .run(id, s.nis, s.fullName, s.classLevel, s.jenisKelamin, s.whatsappNumber || '', s.lifeSkill || null, createdAt);
        res.status(201).json({ id, ...s, createdAt });
    } catch (e: any) {
        res.status(500).json({ message: 'Gagal menambah siswa (NIS mungkin sudah ada)' });
    }
});

app.put('/api/students/:id', authenticate, (req, res) => {
    const s = req.body;
    try {
        db.prepare(`UPDATE students SET nis=?, fullName=?, classLevel=?, jenisKelamin=?, whatsappNumber=?, lifeSkill=? WHERE id=?`)
          .run(s.nis, s.fullName, s.classLevel, s.jenisKelamin, s.whatsappNumber, s.lifeSkill, req.params.id);
        res.json({ message: 'Update berhasil' });
    } catch (e: any) {
        res.status(500).json({ message: 'Gagal update siswa' });
    }
});

app.delete('/api/students/:id', authenticate, (req, res) => {
    try {
        db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
        res.json({ message: 'Siswa dihapus' });
    } catch (e: any) {
        res.status(500).json({ message: 'Gagal menghapus siswa' });
    }
});

app.post('/api/students-bulk-import', authenticate, (req, res) => {
    const { students } = req.body;
    if (!Array.isArray(students)) return res.status(400).json({ message: 'Data tidak valid' });

    let successCount = 0;
    try {
        db.exec('BEGIN TRANSACTION');
        const stmt = db.prepare(`INSERT OR IGNORE INTO students 
            (id, nis, fullName, classLevel, jenisKelamin, whatsappNumber, lifeSkill, createdAt) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
            
        for (const s of students) {
            const id = `mst-${s.nis}`;
            const result = stmt.run(id, s.nis, s.fullName, s.classLevel, s.jenisKelamin, s.whatsappNumber || '', s.lifeSkill || null, new Date().toISOString());
            if (result.changes > 0) {
                successCount++;
            }
        }
        db.exec('COMMIT');
        res.json({ insertedCount: successCount, message: `Berhasil mengimpor ${successCount} siswa` });
    } catch (e: any) {
        db.exec('ROLLBACK');
        res.status(500).json({ message: 'Gagal impor massal' });
    }
});

app.post('/api/students-bulk-delete', authenticate, (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.json({ message: 'Tidak ada id' });
    
    const placeholders = ids.map(() => '?').join(',');
    try {
        const result = db.prepare(`DELETE FROM students WHERE id IN (${placeholders})`).run(...ids);
        res.json({ message: `Berhasil menghapus ${result.changes} siswa` });
    } catch (e: any) {
        res.status(500).json({ message: 'Gagal hapus massal' });
    }
});

app.post('/api/students-reset-choice', authenticate, (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.json({ message: 'Tidak ada id' });
    
    const placeholders = ids.map(() => '?').join(',');
    try {
        const result = db.prepare(`UPDATE students SET lifeSkill = NULL WHERE id IN (${placeholders})`).run(...ids);
        res.json({ message: `Berhasil mereset ${result.changes} siswa` });
    } catch (e: any) {
        res.status(500).json({ message: 'Gagal reset massal' });
    }
});

app.delete('/api/students-clear-all', authenticate, (req, res) => {
    try {
        db.prepare('DELETE FROM students').run();
        res.json({ message: 'Semua data siswa dihapus' });
    } catch (e: any) {
        res.status(500).json({ message: 'Gagal kosongkan tabel' });
    }
});

app.post('/api/lookup-nis', (req, res) => {
    const { nis } = req.body;
    try {
        const row = db.prepare('SELECT * FROM students WHERE nis = ?').get(nis) as any;
        if (!row) return res.status(404).json({ message: 'Siswa tidak ditemukan' });
        res.json({
            found: true,
            alreadySelected: Boolean(row.lifeSkill),
            student: row
        });
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

app.post('/api/choose-skill', (req, res) => {
    const { nis, skill, whatsappNumber } = req.body;
    
    try {
        db.exec('BEGIN TRANSACTION');
        
        // Check if skill is disabled by Admin (e.g. quota full)
        const skillRow = db.prepare('SELECT * FROM skill_settings WHERE skill = ?').get(skill) as any;
        if (skillRow && skillRow.disabled) {
            db.exec('ROLLBACK');
            return res.status(400).json({ 
                message: `Pendaftaran program "${skill}" saat ini telah ditutup / kuota penuh. Silakan pilih program Life Skill lainnya.` 
            });
        }

        const student = db.prepare('SELECT * FROM students WHERE nis = ?').get(nis) as any;
        if (!student) {
            db.exec('ROLLBACK');
            return res.status(404).json({ message: 'Siswa tidak ditemukan' });
        }
        if (student.lifeSkill) {
            db.exec('ROLLBACK');
            return res.status(400).json({ message: 'Siswa sudah memilih' });
        }

        db.prepare('UPDATE students SET lifeSkill = ?, whatsappNumber = ? WHERE nis = ?')
          .run(skill, whatsappNumber, nis);
        
        db.exec('COMMIT');
        
        const updated = db.prepare('SELECT * FROM students WHERE nis = ?').get(nis) as any;
        res.json(updated);
    } catch (e: any) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        res.status(500).json({ message: 'Gagal menyimpan pilihan' });
    }
});

// --- Skill Settings Endpoints ---
app.get('/api/skill-settings', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM skill_settings').all() as any[];
        const settings = rows.map(r => ({
            skill: r.skill,
            disabled: Boolean(r.disabled),
            reason: r.reason || ''
        }));
        res.json(settings);
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

app.put('/api/skill-settings', authenticate, (req: any, res: any) => {
    const { skill, disabled, reason, settings } = req.body;
    try {
        if (Array.isArray(settings)) {
            const stmt = db.prepare('INSERT INTO skill_settings (skill, disabled, reason) VALUES (?, ?, ?) ON CONFLICT(skill) DO UPDATE SET disabled=excluded.disabled, reason=excluded.reason');
            db.exec('BEGIN TRANSACTION');
            for (const s of settings) {
                stmt.run(s.skill, s.disabled ? 1 : 0, s.reason || '');
            }
            db.exec('COMMIT');
        } else if (skill) {
            db.prepare('INSERT INTO skill_settings (skill, disabled, reason) VALUES (?, ?, ?) ON CONFLICT(skill) DO UPDATE SET disabled=excluded.disabled, reason=excluded.reason')
              .run(skill, disabled ? 1 : 0, reason || '');
        }

        const rows = db.prepare('SELECT * FROM skill_settings').all() as any[];
        const updatedSettings = rows.map(r => ({
            skill: r.skill,
            disabled: Boolean(r.disabled),
            reason: r.reason || ''
        }));
        res.json({ message: 'Pengaturan Life Skill berhasil diperbarui', settings: updatedSettings });
    } catch (e: any) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        res.status(500).json({ message: 'Gagal menyimpan pengaturan Life Skill' });
    }
});

app.get('/api/quotas', (req, res) => {
    try {
        const rows = db.prepare('SELECT lifeSkill as skill, COUNT(*) as count FROM students WHERE lifeSkill IS NOT NULL GROUP BY lifeSkill').all();
        res.json(rows);
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

// --- Start Server ---
async function startServer() {
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*all', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
