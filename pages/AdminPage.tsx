import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { LifeSkill, type Student, type ClassLevel, type SkillSetting } from '../types';
import { CLASS_OPTIONS, LIFE_SKILL_OPTIONS, APP_LOGO, API_BASE_URL } from '../constants';
import { StudentModal } from '../components/StudentModal';
import { BulkImportModal } from '../components/BulkImportModal';
import { useStudents } from '../hooks/useStudents';

declare const Swal: any;
declare const XLSX: any;

type AdminView = 'dashboard' | 'master-data' | 'skill-settings' | 'report-class' | 'report-lifeskill' | 'summary' | 'presensi';
type SortConfig = { key: keyof Student; direction: 'ascending' | 'descending' } | null;

const SKILL_ICONS: Record<string, { icon: string; bg: string; text: string; border: string; desc: string }> = {
    'Desain Grafis': {
        icon: 'fa-palette',
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
        border: 'border-indigo-200',
        desc: 'Desain visual, editing foto & video, pembuatan konten kreatif digital'
    },
    'Otomotif': {
        icon: 'fa-wrench',
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-200',
        desc: 'Perawatan mesin motor, kelistrikan kendaraan & servis berkala'
    },
    'Tata Boga': {
        icon: 'fa-utensils',
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        border: 'border-amber-200',
        desc: 'Pengolahan makanan, bakery, pastry & kewirausahaan kuliner modern'
    },
    'Clothing Line': {
        icon: 'fa-shirt',
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        border: 'border-purple-200',
        desc: 'Pola busana, teknik menjahit, sablon kaos & produksi apparel distro'
    },
    'Setir Mobil': {
        icon: 'fa-car',
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        border: 'border-emerald-200',
        desc: 'Praktik mengemudi mobil aman, rambu lalu lintas & pemeliharaan armada'
    },
    'Tata Rias': {
        icon: 'fa-wand-magic-sparkles',
        bg: 'bg-rose-50',
        text: 'text-rose-600',
        border: 'border-rose-200',
        desc: 'Rias wajah natural/pengantin, hair styling & perawatan kecantikan'
    },
};

export const AdminPage: React.FC = () => {
    const [activeView, setActiveView] = useState<AdminView>('dashboard');
    const [isModalOpen, setModalOpen] = useState(false);
    const [isBulkImportOpen, setBulkImportOpen] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<'' | 'selected' | 'unselected'>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'nis', direction: 'ascending' });
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [summaryLifeSkillFilter, setSummaryLifeSkillFilter] = useState<LifeSkill | '' | 'SEMUA'>('');
    const [summaryClassFilter, setSummaryClassFilter] = useState<ClassLevel | '' | 'SEMUA'>('');
    const [selectedLifeSkillForAttendance, setSelectedLifeSkillForAttendance] = useState<LifeSkill | ''>('');

    // Checkbox selection state for Bulk Actions
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

    const {
        students,
        skillSettings,
        loading,
        error,
        addStudent,
        updateStudent,
        deleteStudent,
        deleteBulkStudents,
        resetStudentChoices,
        bulkImportStudents,
        fetchStudents,
        clearAllStudents,
        updateSkillSetting,
        updateAllSkillSettings,
        fetchSkillSettings
    } = useStudents();

    const navigate = useNavigate();

    const handleChangePassword = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Ganti Akun & Password Admin',
            html: `
                <div style="text-align: left; font-size: 13px;" class="space-y-3">
                    <div style="margin-bottom: 10px;">
                        <label style="font-weight: 600; color: #334155; display: block; margin-bottom: 4px;">Password Saat Ini (Wajib):</label>
                        <input id="swal-current-pass" type="password" class="swal2-input" style="margin: 0; width: 100%; font-size: 14px; box-sizing: border-box;" placeholder="Password saat ini" />
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label style="font-weight: 600; color: #334155; display: block; margin-bottom: 4px;">Username Baru (Opsional):</label>
                        <input id="swal-new-user" type="text" class="swal2-input" style="margin: 0; width: 100%; font-size: 14px; box-sizing: border-box;" placeholder="Kosongkan jika tetap" />
                    </div>
                    <div style="margin-bottom: 6px;">
                        <label style="font-weight: 600; color: #334155; display: block; margin-bottom: 4px;">Password Baru (Opsional):</label>
                        <input id="swal-new-pass" type="password" class="swal2-input" style="margin: 0; width: 100%; font-size: 14px; box-sizing: border-box;" placeholder="Password baru" />
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Simpan Perubahan',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#64748b',
            preConfirm: () => {
                const currentPassword = (document.getElementById('swal-current-pass') as HTMLInputElement)?.value;
                const newUsername = (document.getElementById('swal-new-user') as HTMLInputElement)?.value;
                const newPassword = (document.getElementById('swal-new-pass') as HTMLInputElement)?.value;

                if (!currentPassword) {
                    Swal.showValidationMessage('Password saat ini wajib diisi!');
                    return false;
                }
                if (!newUsername && !newPassword) {
                    Swal.showValidationMessage('Isi minimal Username Baru atau Password Baru!');
                    return false;
                }
                return { currentPassword, newUsername, newPassword };
            }
        });

        if (formValues) {
            try {
                const token = sessionStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/change-credentials`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formValues)
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.message || 'Gagal mengubah username/password');
                }

                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil!',
                    text: 'Username / Password berhasil diperbarui di server MySQL.',
                    confirmButtonColor: '#10b981'
                });
            } catch (err: any) {
                Swal.fire({
                    icon: 'info',
                    title: 'Informasi Kredensial',
                    text: err.message || 'Kredensial tersimpan. Anda juga dapat mengubah langsung di tabel MySQL `admins` atau via file .env.',
                });
            }
        }
    };

    const handleRefreshData = async () => {
        await fetchStudents();
        setSelectedStudentIds([]);
        Swal.fire({
            icon: 'success',
            title: 'Sinkronisasi Selesai',
            text: 'Data pendaftar telah dimuat ulang dari database server.',
            timer: 1500,
            showConfirmButton: false
        });
    };

    const handleToggleSkillDisabled = async (skill: LifeSkill, currentDisabled: boolean, currentReason: string = '') => {
        const nextDisabled = !currentDisabled;
        
        if (nextDisabled) {
            // When closing / setting quota full, prompt or allow setting a reason
            const { value: reason, isConfirmed } = await Swal.fire({
                title: `Tutup Pilihan: ${skill}`,
                html: `
                    <div style="text-align: left; font-size: 13px; color: #334155;">
                        <p style="margin-bottom: 10px;">
                            Pilihan <b>"${skill}"</b> akan <b>dinonaktifkan</b> sehingga murid baru tidak dapat memilih program ini di formulir pendaftaran.
                        </p>
                        <label style="font-weight: 600; display: block; margin-bottom: 4px;">Keterangan / Alasan Penutupan (Opsional):</label>
                        <input id="swal-skill-reason" class="swal2-input" style="width: 100%; margin: 0; box-sizing: border-box; font-size: 13px;" placeholder="Contoh: Kuota Penuh (50 Siswa) / Kelas Terisi" value="${currentReason || 'Kuota Penuh'}" />
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Ya, Tutup Program',
                cancelButtonText: 'Batal',
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#64748b',
                preConfirm: () => {
                    return (document.getElementById('swal-skill-reason') as HTMLInputElement)?.value || '';
                }
            });

            if (!isConfirmed) return;

            await updateSkillSetting(skill, true, reason);
            Swal.fire({
                icon: 'success',
                title: 'Program Ditutup',
                text: `Pendaftaran "${skill}" berhasil ditutup. Murid tidak dapat memilih program ini lagi.`,
                timer: 1500,
                showConfirmButton: false
            });
        } else {
            // Re-open
            await updateSkillSetting(skill, false, '');
            Swal.fire({
                icon: 'success',
                title: 'Program Dibuka Kembali',
                text: `Pendaftaran "${skill}" sekarang aktif dan dapat dipilih kembali oleh murid.`,
                timer: 1500,
                showConfirmButton: false
            });
        }
    };

    const handleEditSkillReason = async (skill: LifeSkill, currentReason: string) => {
        const { value: newReason, isConfirmed } = await Swal.fire({
            title: `Ubah Keterangan: ${skill}`,
            input: 'text',
            inputLabel: 'Keterangan / Alasan Penutupan:',
            inputValue: currentReason || '',
            inputPlaceholder: 'Contoh: Kuota Penuh / Kelas Terpenuhi',
            showCancelButton: true,
            confirmButtonText: 'Simpan',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#64748b',
        });

        if (isConfirmed && newReason !== undefined) {
            await updateSkillSetting(skill, true, newReason.trim());
            Swal.fire({
                icon: 'success',
                title: 'Keterangan Diperbarui',
                timer: 1200,
                showConfirmButton: false
            });
        }
    };

    const handleBatchSetSkillStatus = async (disabled: boolean) => {
        const actionLabel = disabled ? 'Menutup Semua Program' : 'Membuka Semua Program';
        const confirmResult = await Swal.fire({
            title: `${actionLabel}?`,
            text: disabled 
                ? 'Semua 6 pilihan Life Skill akan dinonaktifkan sehingga murid tidak dapat memilih program apapun.'
                : 'Semua 6 pilihan Life Skill akan diaktifkan kembali sehingga murid dapat memilih bebas.',
            icon: disabled ? 'warning' : 'question',
            showCancelButton: true,
            confirmButtonText: disabled ? 'Ya, Tutup Semua' : 'Ya, Buka Semua',
            cancelButtonText: 'Batal',
            confirmButtonColor: disabled ? '#ef4444' : '#10b981',
            cancelButtonColor: '#64748b'
        });

        if (confirmResult.isConfirmed) {
            const updated = LIFE_SKILL_OPTIONS.map(skill => ({
                skill,
                disabled,
                reason: disabled ? 'Kuota Penuh / Ditutup oleh Admin' : ''
            }));
            await updateAllSkillSettings(updated);
            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: disabled ? 'Semua program Life Skill berhasil ditutup.' : 'Semua program Life Skill sekarang aktif.',
                timer: 1500,
                showConfirmButton: false
            });
        }
    };

    const handleClearAllData = () => {
        Swal.fire({
            title: 'Kosongkan Semua Data Siswa?',
            text: 'Seluruh Master Data dan data pilihan siswa akan dihapus dari server MySQL dan penyimpanan lokal. Tindakan ini tidak dapat dibatalkan.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Ya, Kosongkan Semua',
            cancelButtonText: 'Batal'
        }).then(async (result: any) => {
            if (result.isConfirmed) {
                await clearAllStudents();
                setSelectedStudentIds([]);
                Swal.fire({
                    icon: 'success',
                    title: 'Data Berhasil Dikosongkan',
                    text: 'Seluruh data master siswa telah dibersihkan.',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    };
    
    useEffect(() => {
        if (isSidebarOpen) {
            setSidebarOpen(false);
        }
    }, [activeView]);
    
    useEffect(() => {
        if (error) {
            Swal.fire('Error', error, 'error');
        }
    }, [error]);

    // Checkbox toggles
    const handleToggleSelectAll = (filteredIds: string[]) => {
        if (filteredIds.every(id => selectedStudentIds.includes(id))) {
            setSelectedStudentIds(prev => prev.filter(id => !filteredIds.includes(id)));
        } else {
            setSelectedStudentIds(prev => Array.from(new Set([...prev, ...filteredIds])));
        }
    };

    const handleToggleSelectRow = (id: string) => {
        setSelectedStudentIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // Bulk Delete
    const handleBulkDelete = () => {
        if (selectedStudentIds.length === 0) return;

        Swal.fire({
            title: `Hapus ${selectedStudentIds.length} Siswa Terpilih?`,
            text: `Data ${selectedStudentIds.length} siswa akan dihapus permanen dari Master Data. Tindakan ini tidak dapat dibatalkan.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: `Ya, Hapus (${selectedStudentIds.length}) Data`,
            cancelButtonText: 'Batal'
        }).then(async (result: any) => {
            if (result.isConfirmed) {
                try {
                    await deleteBulkStudents(selectedStudentIds);
                    setSelectedStudentIds([]);
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil Dihapus',
                        text: 'Data siswa terpilih telah dihapus dari sistem.',
                        timer: 1500,
                        showConfirmButton: false
                    });
                } catch (err: any) {
                    Swal.fire('Gagal!', err.message || 'Gagal menghapus data siswa.', 'error');
                }
            }
        });
    };

    // Bulk Reset Life Skill Choices
    const handleBulkResetChoices = () => {
        if (selectedStudentIds.length === 0) return;

        Swal.fire({
            title: `Reset Pilihan ${selectedStudentIds.length} Siswa?`,
            text: `Pilihan Life Skill untuk ${selectedStudentIds.length} siswa akan dikosongkan (status: Belum Memilih), sehingga siswa dapat memilih kembali melalui portal pendaftaran.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#64748b',
            confirmButtonText: `Ya, Reset Pilihan (${selectedStudentIds.length}) Siswa`,
            cancelButtonText: 'Batal'
        }).then(async (result: any) => {
            if (result.isConfirmed) {
                try {
                    await resetStudentChoices(selectedStudentIds);
                    setSelectedStudentIds([]);
                    Swal.fire({
                        icon: 'success',
                        title: 'Pilihan Direset',
                        text: 'Pilihan Life Skill siswa terpilih telah dikosongkan.',
                        timer: 1500,
                        showConfirmButton: false
                    });
                } catch (err: any) {
                    Swal.fire('Gagal!', err.message || 'Gagal mereset pilihan siswa.', 'error');
                }
            }
        });
    };

    const printContent = (title: string, content: string) => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const html = `
                <html>
                <head>
                    <title>Cetak - ${title}</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
                    <style>
                        @media print { @page { size: 8.5in 13in; margin: 1.5cm 1.2cm; } }
                        body { font-family: 'Plus Jakarta Sans', sans-serif; color: #000; }
                        .kop-sekolah { 
                            display: flex;
                            align-items: center;
                            gap: 20px;
                            text-align: left;
                            border-bottom: 3px solid black; 
                            padding-bottom: 10px; 
                            margin-bottom: 20px; 
                        }
                        .kop-sekolah img {
                             width: 80px;
                             height: 80px;
                             object-fit: contain;
                        }
                        .kop-sekolah .text-container { flex-grow: 1; text-align: center; }
                        .kop-sekolah h2, .kop-sekolah h3, .kop-sekolah p { margin: 0; line-height: 1.35; }
                        .kop-sekolah h2 { font-size: 15pt; font-weight: 700; }
                        .kop-sekolah h3 { font-size: 17pt; font-weight: 800; }
                        .kop-sekolah p { font-size: 10pt; font-weight: 400; color: #333; }
                        .report-main-title { text-align: center; font-size: 13pt; font-weight: bold; margin-bottom: 18px; text-transform: uppercase; text-decoration: underline; }
                        table { width: 100%; border-collapse: collapse; font-size: 10.5pt; }
                        th, td { border: 1px solid black; padding: 5px 6px; text-align: left; vertical-align: middle; }
                        th { font-weight: bold; background-color: #f1f5f9; text-align: center; }
                        td.number, td.center { text-align: center; }
                        td.signature { width: 30%; }
                        tfoot td { font-weight: bold; background-color: #f1f5f9; }
                    </style>
                </head>
                <body>
                    <div class="kop-sekolah">
                         <img src="${APP_LOGO}" alt="Logo Sekolah" />
                         <div class="text-container">
                             <h2>LEMBAGA PENDIDIKAN MA'ARIF NU</h2>
                             <h3>MA NU 01 BANYUPUTIH BATANG</h3>
                             <p>Jl. Lapangan 9A Banyuputih, Kec. Banyuputih, Kab. Batang, Jawa Tengah 51271</p>
                         </div>
                    </div>
                    <div class="report-main-title">${title}</div>
                    ${content}
                </body>
                </html>
            `;
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
    };
    
    const tableToHtml = (data: Record<string, any>[], includeTotal: boolean = false) => {
        if (!data || data.length === 0) return '<p>Tidak ada data untuk ditampilkan.</p>';
        const headers = Object.keys(data[0]);
        const headerRow = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        const bodyRows = data.map(row => 
            `<tr>${headers.map(h => {
                const val = row[h];
                const isSignatureColumn = h === 'Tanda Tangan';
                const cssClass = typeof val === 'number' || h.includes('Persentase') || h === 'Status' ? 'class="center"' : (isSignatureColumn ? 'class="signature"' : '');
                return `<td ${cssClass}>${val}</td>`;
            }).join('')}</tr>`
        ).join('');

        let footerRow = '';
        if (includeTotal) {
            const totalPendaftar = data.reduce((sum, item) => sum + (item['Jumlah Pendaftar'] || 0), 0);
            if (headers.length > 1) {
                footerRow = `<tfoot><tr><td colspan="${headers.length - 1}">Total</td><td class="center">${totalPendaftar}</td></tr></tfoot>`;
            }
        }

        return `<table><thead>${headerRow}</thead><tbody>${bodyRows}</tbody>${footerRow}</table>`;
    };

    const handleLogout = () => {
        sessionStorage.removeItem('token');
        navigate('/login');
    };

    const openCreateModal = () => {
        setStudentToEdit(null);
        setModalOpen(true);
    };

    const openEditModal = (student: Student) => {
        setStudentToEdit(student);
        setModalOpen(true);
    };

    const handleSaveStudent = async (studentData: Omit<Student, 'id'> | Student) => {
        try {
            if ('id' in studentData) {
                await updateStudent(studentData);
                Swal.fire({ title: 'Sukses!', text: 'Data siswa berhasil diperbarui.', icon: 'success', confirmButtonColor: '#10b981' });
            } else {
                await addStudent(studentData);
                Swal.fire({ title: 'Sukses!', text: 'Siswa baru berhasil ditambahkan.', icon: 'success', confirmButtonColor: '#10b981' });
            }
            setModalOpen(false);
        } catch (err: any) {
            Swal.fire({ title: 'Gagal!', text: err.message || 'Gagal menyimpan data siswa.', icon: 'error', confirmButtonColor: '#d33' });
        }
    };

    const handleDeleteStudent = (student: Student) => {
        Swal.fire({
            title: 'Hapus Siswa Ini?',
            text: `Anda akan menghapus data siswa "${student.fullName}" (NIS: ${student.nis}).`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        }).then(async (result: any) => {
            if (result.isConfirmed) {
                try {
                    await deleteStudent(student.id);
                    setSelectedStudentIds(prev => prev.filter(id => id !== student.id));
                    Swal.fire('Terhapus!', 'Data siswa telah dihapus.', 'success');
                } catch (err: any) {
                    Swal.fire('Gagal!', err.message || 'Gagal menghapus data siswa.', 'error');
                }
            }
        });
    };

    const handleResetSingleChoice = (student: Student) => {
        Swal.fire({
            title: 'Reset Pilihan Siswa?',
            text: `Pilihan Life Skill untuk siswa "${student.fullName}" (${student.lifeSkill}) akan dikosongkan agar siswa dapat memilih ulang.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Ya, Reset Pilihan',
            cancelButtonText: 'Batal'
        }).then(async (result: any) => {
            if (result.isConfirmed) {
                try {
                    await resetStudentChoices([student.id]);
                    Swal.fire('Berhasil!', 'Pilihan Life Skill siswa telah dikosongkan.', 'success');
                } catch (err: any) {
                    Swal.fire('Gagal!', err.message || 'Gagal mereset pilihan.', 'error');
                }
            }
        });
    };
    
    const handleDownload = (data: any[], filename: string) => {
        if (data.length === 0) {
            Swal.fire('Informasi', 'Tidak ada data untuk diunduh.', 'info');
            return;
        }
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
        XLSX.writeFile(workbook, `${filename}_${new Date().toLocaleDateString('id-ID')}.xlsx`);
    };

    const requestSort = (key: keyof Student) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const filteredAndSortedStudents = useMemo(() => {
        let result: Student[] = [...students];

        // View-based filters
        if (activeView === 'report-class' && filter) {
            result = result.filter(s => s.classLevel === filter);
        } else if (activeView === 'report-lifeskill' && filter) {
            result = result.filter(s => s.lifeSkill === filter);
        } else if (activeView === 'master-data') {
            if (filter) {
                result = result.filter(s => s.classLevel === filter);
            }
            if (statusFilter === 'selected') {
                result = result.filter(s => s.lifeSkill && s.lifeSkill.trim() !== '');
            } else if (statusFilter === 'unselected') {
                result = result.filter(s => !s.lifeSkill || s.lifeSkill.trim() === '');
            }
        }

        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            result = result.filter(s => 
                (s.nis || '').toLowerCase().includes(lowercasedQuery) ||
                s.fullName.toLowerCase().includes(lowercasedQuery) ||
                s.jenisKelamin.toLowerCase().includes(lowercasedQuery) ||
                s.classLevel.toLowerCase().includes(lowercasedQuery) ||
                (s.whatsappNumber || '').toLowerCase().includes(lowercasedQuery) ||
                (s.lifeSkill || '').toLowerCase().includes(lowercasedQuery)
            );
        }
        
        if (sortConfig) {
            result.sort((a, b) => {
                const valA = a[sortConfig.key] || '';
                const valB = b[sortConfig.key] || '';
                if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [students, filter, statusFilter, searchQuery, activeView, sortConfig]);

    const detailedCountSummary = useMemo(() => {
        if (summaryLifeSkillFilter === '' || summaryClassFilter === '') {
            return { title: '', data: [], headers: [] };
        }

        const isAllSkills = summaryLifeSkillFilter === 'SEMUA';
        const isAllClasses = summaryClassFilter === 'SEMUA';

        let filteredStudents = students;
        if (!isAllSkills) {
            filteredStudents = filteredStudents.filter(s => s.lifeSkill === summaryLifeSkillFilter);
        }
        if (!isAllClasses) {
            filteredStudents = filteredStudents.filter(s => s.classLevel === summaryClassFilter);
        }

        if (!isAllSkills && isAllClasses) {
            const title = `Jumlah Pendaftar ${summaryLifeSkillFilter} per Kelas`;
            const headers = ["Kelas", "Jumlah Pendaftar"];
            const counts = CLASS_OPTIONS.reduce((acc, classLevel) => ({ ...acc, [classLevel]: 0 }), {} as Record<ClassLevel, number>);
            filteredStudents.forEach(s => { counts[s.classLevel]++; });
            const data = Object.entries(counts).map(([kelas, jumlah]) => ({ "Kelas": kelas, "Jumlah Pendaftar": jumlah }));
            return { title, data, headers };
        }

        if (isAllSkills && !isAllClasses) {
            const title = `Jumlah Pendaftar per Life Skill di Kelas ${summaryClassFilter}`;
            const headers = ["Program Life Skill", "Jumlah Pendaftar"];
            const counts = LIFE_SKILL_OPTIONS.reduce((acc, skill) => ({ ...acc, [skill]: 0 }), {} as Record<LifeSkill, number>);
            filteredStudents.forEach(s => { if(s.lifeSkill) counts[s.lifeSkill]++; });
            const data = Object.entries(counts).map(([skill, jumlah]) => ({ "Program Life Skill": skill, "Jumlah Pendaftar": jumlah }));
            return { title, data, headers };
        }

        if (!isAllSkills && !isAllClasses) {
            const title = `Jumlah Pendaftar ${summaryLifeSkillFilter} di Kelas ${summaryClassFilter}`;
            const headers = ["Keterangan", "Jumlah Pendaftar"];
            const data = [{ "Keterangan": `${summaryLifeSkillFilter} - Kelas ${summaryClassFilter}`, "Jumlah Pendaftar": filteredStudents.length }];
            return { title, data, headers };
        }

        if (isAllSkills && isAllClasses) {
            const title = `Jumlah Pendaftar per Life Skill (Semua Kelas)`;
            const headers = ["Program Life Skill", "Jumlah Pendaftar"];
            const counts = LIFE_SKILL_OPTIONS.reduce((acc, skill) => ({ ...acc, [skill]: 0 }), {} as Record<LifeSkill, number>);
            students.forEach(s => { if(s.lifeSkill) counts[s.lifeSkill]++; });
            const data = Object.entries(counts).map(([skill, jumlah]) => ({ "Program Life Skill": skill, "Jumlah Pendaftar": jumlah }));
            return { title, data, headers };
        }

        return { title: '', data: [], headers: [] };
    }, [students, summaryLifeSkillFilter, summaryClassFilter]);

    const handlePrintAttendance = () => {
        if (!selectedLifeSkillForAttendance) {
            Swal.fire('Peringatan', 'Silakan pilih program Life Skill terlebih dahulu.', 'warning');
            return;
        }

        const attendanceStudents = students
            .filter(s => s.lifeSkill === selectedLifeSkillForAttendance)
            .sort((a, b) => {
                const classCompare = a.classLevel.localeCompare(b.classLevel);
                if (classCompare !== 0) {
                    return classCompare;
                }
                return a.fullName.localeCompare(b.fullName);
            });
        
        if (attendanceStudents.length === 0) {
            Swal.fire('Informasi', `Tidak ada siswa yang terdaftar untuk Life Skill "${selectedLifeSkillForAttendance}".`, 'info');
            return;
        }
        
        const title = `DAFTAR HADIR PESERTA LIFE SKILL ${selectedLifeSkillForAttendance.toUpperCase()}`;
        const dateLine = `
            <div style="display: flex; justify-content: space-between; font-size: 10.5pt; margin-bottom: 15px; font-weight: bold;">
                <div>Keterampilan: ${selectedLifeSkillForAttendance}</div>
                <div>Tahun Pelajaran: 2026/2027</div>
            </div>
        `;

        const tableHeader = `
            <thead>
                <tr>
                    <th rowspan="2" style="width: 5%; text-align: center; vertical-align: middle;">No.</th>
                    <th rowspan="2" style="width: 12%; text-align: center; vertical-align: middle;">NIS</th>
                    <th rowspan="2" style="text-align: left; vertical-align: middle;">Nama Lengkap</th>
                    <th rowspan="2" style="width: 10%; text-align: center; vertical-align: middle;">Kelas</th>
                    <th colspan="10" style="text-align: center; vertical-align: middle; padding: 4px 0;">PERTEMUAN KE</th>
                </tr>
                <tr>
                    <th style="width: 4%; text-align: center; font-size: 9pt; font-weight: bold;">1</th>
                    <th style="width: 4%; text-align: center; font-size: 9pt; font-weight: bold;">2</th>
                    <th style="width: 4%; text-align: center; font-size: 9pt; font-weight: bold;">3</th>
                    <th style="width: 4%; text-align: center; font-size: 9pt; font-weight: bold;">4</th>
                    <th style="width: 4%; text-align: center; font-size: 9pt; font-weight: bold;">5</th>
                    <th style="width: 4%; text-align: center; font-size: 9pt; font-weight: bold;">6</th>
                    <th style="width: 4%; text-align: center; font-size: 9pt; font-weight: bold;">7</th>
                    <th style="width: 4%; text-align: center; font-size: 9pt; font-weight: bold;">8</th>
                    <th style="width: 4%; text-align: center; font-size: 9pt; font-weight: bold;">9</th>
                    <th style="width: 4%; text-align: center; font-size: 9pt; font-weight: bold;">10</th>
                </tr>
            </thead>`;
        
        const tableBody = `
            <tbody>
                ${attendanceStudents.map((s, index) => `
                    <tr>
                        <td style="text-align: center; padding: 6px 4px;">${index + 1}</td>
                        <td style="text-align: center; font-family: monospace; font-weight: bold; padding: 6px 4px;">${s.nis || '-'}</td>
                        <td style="padding: 6px 8px;">${s.fullName}</td>
                        <td style="text-align: center; padding: 6px 4px;">${s.classLevel}</td>
                        <td style="background-color: #fff; padding: 6px 0;"></td>
                        <td style="background-color: #fff; padding: 6px 0;"></td>
                        <td style="background-color: #fff; padding: 6px 0;"></td>
                        <td style="background-color: #fff; padding: 6px 0;"></td>
                        <td style="background-color: #fff; padding: 6px 0;"></td>
                        <td style="background-color: #fff; padding: 6px 0;"></td>
                        <td style="background-color: #fff; padding: 6px 0;"></td>
                        <td style="background-color: #fff; padding: 6px 0;"></td>
                        <td style="background-color: #fff; padding: 6px 0;"></td>
                        <td style="background-color: #fff; padding: 6px 0;"></td>
                    </tr>
                `).join('')}
            </tbody>`;

        const tableHtml = `<table>${tableHeader}${tableBody}</table>`;

        const tutorSignature = `
            <div style="margin-top: 40px; display: flex; justify-content: flex-end;">
                <div style="text-align: center; font-size: 11pt;">
                    <p style="margin-bottom: 70px;">Tentor Life Skill,</p>
                    <p style="font-weight: bold; text-decoration: underline; margin: 0;">(.......................................)</p>
                    <p style="margin: 0;">Nama Jelas & Tanda Tangan</p>
                </div>
            </div>
        `;
        
        const content = dateLine + tableHtml + tutorSignature;
        printContent(title, content);
    };

    const renderContent = () => {
        if (loading && activeView !== 'dashboard') {
            return (
                <div className="flex justify-center items-center h-full">
                    <div className="text-center">
                        <p className="text-lg font-medium text-slate-600">Memuat data...</p>
                    </div>
                </div>
            );
        }
        
        switch (activeView) {
            case 'dashboard':
                return (
                    <DashboardView
                        students={students}
                        skillSettings={skillSettings}
                        isLoading={loading}
                        onOpenImport={() => setBulkImportOpen(true)}
                        onNavigateToSettings={() => setActiveView('skill-settings')}
                        onToggleSkill={handleToggleSkillDisabled}
                    />
                );
            
            case 'skill-settings': {
                const totalSkills = LIFE_SKILL_OPTIONS.length;
                const closedSkills = skillSettings.filter(s => s.disabled).length;
                const openSkills = totalSkills - closedSkills;

                return (
                    <div className="space-y-6 animate-fade-in">
                        {/* Title & Quick Actions */}
                        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                                        <i className="fa-solid fa-sliders text-sm"></i>
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                                        Pengaturan Kuota & Status Life Skill
                                    </h2>
                                </div>
                                <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                                    Nonaktifkan pilihan program yang kuotanya dirasa sudah penuh agar murid tidak dapat memilihnya pada formulir pendaftaran. Pengaturan ini berlaku secara instan dan otomatis tersinkronisasi.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                                <button
                                    type="button"
                                    onClick={() => handleBatchSetSkillStatus(false)}
                                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                                    title="Buka semua pendaftaran program life skill"
                                >
                                    <i className="fa-solid fa-circle-check text-emerald-600"></i>
                                    <span>Buka Semua</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleBatchSetSkillStatus(true)}
                                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                                    title="Tutup semua pendaftaran program life skill"
                                >
                                    <i className="fa-solid fa-ban text-rose-600"></i>
                                    <span>Tutup Semua</span>
                                </button>
                            </div>
                        </div>

                        {/* Status Summary Banner */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 text-base">
                                        <i className="fa-solid fa-layer-group"></i>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Program</p>
                                        <p className="text-xl font-extrabold text-slate-800">{totalSkills} Kategori</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-base">
                                        <i className="fa-solid fa-door-open"></i>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Pendaftaran Aktif / Buka</p>
                                        <p className="text-xl font-extrabold text-emerald-700">{openSkills} Program</p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg">Tersedia</span>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-base">
                                        <i className="fa-solid fa-lock"></i>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Ditutup / Kuota Penuh</p>
                                        <p className="text-xl font-extrabold text-rose-700">{closedSkills} Program</p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-lg">Nonaktif</span>
                            </div>
                        </div>

                        {/* 6 Program Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {LIFE_SKILL_OPTIONS.map(skill => {
                                const setting = skillSettings.find(s => s.skill === skill);
                                const isDisabled = setting ? Boolean(setting.disabled) : false;
                                const reason = setting?.reason || '';
                                const meta = SKILL_ICONS[skill] || {
                                    icon: 'fa-star',
                                    bg: 'bg-indigo-50',
                                    text: 'text-indigo-600',
                                    border: 'border-indigo-200',
                                    desc: 'Program Keterampilan Life Skill MA NU 01 Banyuputih'
                                };
                                const studentCount = students.filter(s => s.lifeSkill === skill || (s.lifeSkill as string === 'Tata Busana' && skill === LifeSkill.CLOTHING_LINE)).length;

                                return (
                                    <div 
                                        key={skill} 
                                        className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                                            isDisabled 
                                                ? 'bg-rose-50/30 border-rose-200 shadow-xs' 
                                                : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-md'
                                        }`}
                                    >
                                        <div>
                                            {/* Card Top */}
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${isDisabled ? 'bg-rose-100 text-rose-700' : `${meta.bg} ${meta.text}`}`}>
                                                        <i className={`fa-solid ${meta.icon}`}></i>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-800 text-sm">{skill}</h3>
                                                        <p className="text-[11px] text-slate-500 font-medium">
                                                            <span className="font-bold text-indigo-600">{studentCount}</span> Siswa Terdaftar
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Status Badge */}
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 ${
                                                    isDisabled 
                                                        ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                }`}>
                                                    <i className={`fa-solid ${isDisabled ? 'fa-lock' : 'fa-check'} text-[9px]`}></i>
                                                    <span>{isDisabled ? 'DITUTUP' : 'BUKA'}</span>
                                                </span>
                                            </div>

                                            <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                                                {meta.desc}
                                            </p>

                                            {/* Reason info if disabled */}
                                            {isDisabled && (
                                                <div className="mb-4 p-2.5 rounded-xl bg-rose-100/70 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <i className="fa-solid fa-circle-exclamation text-rose-600 flex-shrink-0 text-[11px]"></i>
                                                        <span className="truncate font-medium">
                                                            Keterangan: <b>{reason || 'Kuota Penuh'}</b>
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEditSkillReason(skill, reason)}
                                                        className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-700 text-[10px] font-bold rounded-lg border border-rose-300 transition flex-shrink-0 cursor-pointer"
                                                        title="Ubah teks keterangan"
                                                    >
                                                        Ubah
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Toggle Action Control */}
                                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFilter(skill);
                                                    setActiveView('report-lifeskill');
                                                }}
                                                className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition flex items-center gap-1 cursor-pointer"
                                            >
                                                <i className="fa-solid fa-list-check text-[10px]"></i>
                                                <span>Lihat Siswa</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleToggleSkillDisabled(skill, isDisabled, reason)}
                                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer ${
                                                    isDisabled
                                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                                                }`}
                                            >
                                                <i className={`fa-solid ${isDisabled ? 'fa-lock-open' : 'fa-ban'} text-[10px]`}></i>
                                                <span>{isDisabled ? 'Buka Pendaftaran' : 'Tutup (Kuota Penuh)'}</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            }
            
            case 'master-data': {
                const filteredIds = filteredAndSortedStudents.map(s => s.id);
                const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedStudentIds.includes(id));
                const isAnySelected = selectedStudentIds.length > 0;

                const dataToDownload = filteredAndSortedStudents.map(({ id, createdAt, updatedAt, ...rest }, index) => ({
                    'No.': index + 1,
                    'NIS': rest.nis || '',
                    'Nama Lengkap': rest.fullName,
                    'Jenis Kelamin': rest.jenisKelamin,
                    'Kelas': rest.classLevel,
                    'No. WhatsApp': rest.whatsappNumber || '',
                    'Pilihan Life Skill': rest.lifeSkill || 'Belum Memilih',
                }));

                return (
                    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md border border-slate-200/80 animate-fade-in space-y-4">
                        {/* Title & Top Action Buttons */}
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-4">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
                                    <i className="fa-solid fa-users-gear text-indigo-600"></i>
                                    <span>Master Data Siswa & Pengelolaan Pilihan</span>
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Upload data siswa resmi agar siswa cukup memasukkan NIS saat memilih program Life Skill.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setBulkImportOpen(true)}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                                >
                                    <i className="fa-solid fa-file-excel text-sm"></i>
                                    <span>Upload Excel / CSV</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={openCreateModal}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                                >
                                    <i className="fa-solid fa-user-plus text-sm"></i>
                                    <span>Tambah Siswa Manual</span>
                                </button>
                            </div>
                        </div>

                        {/* Search & Filters */}
                        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
                            <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-grow">
                                <div className="relative w-full sm:w-64">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                                        <i className="fa-solid fa-magnifying-glass text-xs"></i>
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Cari NIS / Nama Siswa..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <select
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value)}
                                        className="w-full sm:w-36 px-2.5 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Semua Kelas</option>
                                        {CLASS_OPTIONS.map(c => <option key={c} value={c}>Kelas {c}</option>)}
                                    </select>

                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value as any)}
                                        className="w-full sm:w-44 px-2.5 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Semua Status</option>
                                        <option value="selected">Sudah Memilih</option>
                                        <option value="unselected">Belum Memilih</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 self-end lg:self-auto">
                                <button
                                    onClick={() => printContent("Master Data Siswa & Pilihan Life Skill", tableToHtml(dataToDownload))}
                                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5"
                                >
                                    <i className="fa-solid fa-print"></i> Cetak
                                </button>
                                <button
                                    onClick={() => handleDownload(dataToDownload, 'Master_Data_Siswa')}
                                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5"
                                >
                                    <i className="fa-solid fa-file-arrow-down"></i> Unduh Excel
                                </button>
                            </div>
                        </div>

                        {/* Bulk Action Sticky Bar when items are selected */}
                        {isAnySelected && (
                            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-wrap items-center justify-between gap-2.5 animate-fade-in">
                                <div className="text-xs font-bold text-indigo-900 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs">
                                        {selectedStudentIds.length}
                                    </span>
                                    <span>siswa dipilih dari tabel</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleBulkResetChoices}
                                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5"
                                        title="Kosongkan pilihan Life Skill siswa terpilih agar dapat memilih ulang"
                                    >
                                        <i className="fa-solid fa-rotate-left"></i>
                                        <span>Reset Pilihan ({selectedStudentIds.length})</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleBulkDelete}
                                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5"
                                        title="Hapus permanen data siswa terpilih"
                                    >
                                        <i className="fa-solid fa-trash"></i>
                                        <span>Hapus Siswa Terpilih ({selectedStudentIds.length})</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Master Data Table */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white text-xs">
                                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200 select-none">
                                        <tr>
                                            <th className="py-3 px-3 text-center w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={allSelected}
                                                    onChange={() => handleToggleSelectAll(filteredIds)}
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                                                    title="Pilih Semua di Halaman Ini"
                                                />
                                            </th>
                                            <th className="py-3 px-2 text-center w-10">No</th>
                                            <ThSortable title="NIS" sortKey="nis" sortConfig={sortConfig} onRequestSort={requestSort} />
                                            <ThSortable title="Nama Lengkap Siswa" sortKey="fullName" sortConfig={sortConfig} onRequestSort={requestSort} />
                                            <ThSortable title="JK" sortKey="jenisKelamin" sortConfig={sortConfig} onRequestSort={requestSort} />
                                            <ThSortable title="Kelas" sortKey="classLevel" sortConfig={sortConfig} onRequestSort={requestSort} />
                                            <th className="py-3 px-3 text-left">WhatsApp</th>
                                            <ThSortable title="Status / Pilihan Life Skill" sortKey="lifeSkill" sortConfig={sortConfig} onRequestSort={requestSort} />
                                            <th className="py-3 px-3 text-center w-28">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredAndSortedStudents.map((s, index) => {
                                            const isChecked = selectedStudentIds.includes(s.id);
                                            const hasChosen = Boolean(s.lifeSkill && s.lifeSkill.trim() !== '');

                                            return (
                                                <tr
                                                    key={s.id}
                                                    className={`hover:bg-indigo-50/30 transition-colors ${isChecked ? 'bg-indigo-50/50' : ''}`}
                                                >
                                                    <td className="py-2.5 px-3 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => handleToggleSelectRow(s.id)}
                                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                                                        />
                                                    </td>
                                                    <td className="py-2.5 px-2 text-center text-slate-400 font-medium">
                                                        {index + 1}
                                                    </td>
                                                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                                                        {s.nis || '-'}
                                                    </td>
                                                    <td className="py-2.5 px-3 font-bold text-slate-800">
                                                        {s.fullName}
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                            s.jenisKelamin === 'Laki-laki' 
                                                                ? 'bg-blue-50 text-blue-700' 
                                                                : 'bg-rose-50 text-rose-700'
                                                        }`}>
                                                            {s.jenisKelamin}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                                                            {s.classLevel}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-slate-600">
                                                        {s.whatsappNumber || '-'}
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        {hasChosen ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold">
                                                                <i className="fa-solid fa-circle-check text-indigo-600 text-[10px]"></i>
                                                                <span>{s.lifeSkill}</span>
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium italic">
                                                                <i className="fa-solid fa-hourglass-start text-[10px]"></i>
                                                                <span>Belum Memilih</span>
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            {hasChosen && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleResetSingleChoice(s)}
                                                                    className="w-7 h-7 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 flex items-center justify-center transition-colors"
                                                                    title="Reset pilihan siswa ini agar dapat memilih ulang"
                                                                >
                                                                    <i className="fa-solid fa-rotate-left text-xs"></i>
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditModal(s)}
                                                                className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors"
                                                                title="Ubah data siswa"
                                                            >
                                                                <i className="fa-solid fa-pencil text-xs"></i>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteStudent(s)}
                                                                className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors"
                                                                title="Hapus data siswa"
                                                            >
                                                                <i className="fa-solid fa-trash text-xs"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredAndSortedStudents.length === 0 && (
                                            <tr>
                                                <td colSpan={9} className="text-center py-10 text-slate-400 font-medium">
                                                    Tidak ada data siswa yang cocok dengan kriteria pencarian / filter.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            }

            case 'report-class':
            case 'report-lifeskill': {
                const isClassReport = activeView === 'report-class';
                const reportTitle = isClassReport ? 'Laporan per Kelas' : 'Laporan per Pilihan Life Skill';
                const filterOptions = isClassReport ? CLASS_OPTIONS : LIFE_SKILL_OPTIONS;
                const filterLabel = isClassReport ? 'Filter Kelas' : 'Filter Life Skill';
                 
                const dataToDownload = filteredAndSortedStudents.map(({ id, createdAt, updatedAt, ...rest }, index) => ({
                    'No.': index + 1,
                    'NIS': rest.nis || '',
                    'Nama Lengkap': rest.fullName,
                    'Jenis Kelamin': rest.jenisKelamin,
                    'Kelas': rest.classLevel,
                    'No. WhatsApp': rest.whatsappNumber || '',
                    'Pilihan Life Skill': rest.lifeSkill || 'Belum Ditentukan',
                }));

                let printTitle = `Laporan Pendaftar Life Skill`;
                if (filter) printTitle += ` ${isClassReport ? 'Kelas' : 'Pilihan'} ${filter}`;
                else printTitle = "Laporan Seluruh Pendaftar Life Skill";

                const handleSingleReportPrint = () => {
                    if (dataToDownload.length === 0) {
                        Swal.fire('Informasi', 'Tidak ada data untuk dicetak.', 'info');
                        return;
                    }
                    printContent(printTitle, tableToHtml(dataToDownload));
                };

                return (
                    <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/80 animate-fade-in space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <h2 className="text-2xl font-bold text-slate-800">{reportTitle}</h2>
                            <div className="flex gap-2">
                                <button onClick={handleSingleReportPrint} className="bg-slate-700 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors text-xs font-bold">Cetak</button>
                                <button onClick={() => handleDownload(dataToDownload, reportTitle.replace(/\s+/g, '_'))} className="bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors text-xs font-bold">Unduh Excel</button>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                                <div className="relative w-full sm:w-60">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                        <i className="fa-solid fa-search text-xs"></i>
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Cari siswa..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="border border-slate-300 rounded-xl py-2 pl-9 pr-3 w-full text-xs focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <label htmlFor="filter" className="text-xs font-bold text-slate-600 whitespace-nowrap">{filterLabel}:</label>
                                    <select id="filter" value={filter} onChange={e => setFilter(e.target.value)} className="border border-slate-300 rounded-xl px-2 py-2 bg-white text-xs w-full focus:ring-2 focus:ring-indigo-500">
                                        <option value="">Semua</option>
                                        {filterOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button onClick={openCreateModal} className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors text-xs font-bold w-full md:w-auto">Tambah Siswa</button>
                        </div>

                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="min-w-full bg-white text-xs">
                                <thead className="bg-slate-100 border-b border-slate-200">
                                    <tr>
                                        <th className="py-3 px-4 text-center font-bold text-slate-600 w-12">No.</th>
                                        <ThSortable title="NIS" sortKey="nis" sortConfig={sortConfig} onRequestSort={requestSort} />
                                        <ThSortable title="Nama Lengkap" sortKey="fullName" sortConfig={sortConfig} onRequestSort={requestSort} />
                                        <ThSortable title="Jenis Kelamin" sortKey="jenisKelamin" sortConfig={sortConfig} onRequestSort={requestSort} />
                                        <ThSortable title="Kelas" sortKey="classLevel" sortConfig={sortConfig} onRequestSort={requestSort} />
                                        <th className="py-3 px-4 text-left font-bold text-slate-600">WhatsApp</th>
                                        <ThSortable title="Life Skill" sortKey="lifeSkill" sortConfig={sortConfig} onRequestSort={requestSort} />
                                        <th className="py-3 px-4 text-center font-bold text-slate-600">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredAndSortedStudents.map((s, index) => (
                                        <tr key={s.id} className="hover:bg-slate-50">
                                            <td className="py-2.5 px-4 text-center text-slate-400">{index + 1}</td>
                                            <td className="py-2.5 px-4 font-mono font-bold text-indigo-700">{s.nis || '-'}</td>
                                            <td className="py-2.5 px-4 font-bold text-slate-800">{s.fullName}</td>
                                            <td className="py-2.5 px-4">{s.jenisKelamin}</td>
                                            <td className="py-2.5 px-4">{s.classLevel}</td>
                                            <td className="py-2.5 px-4">{s.whatsappNumber || '-'}</td>
                                            <td className="py-2.5 px-4">
                                                {s.lifeSkill ? <span className="font-bold text-indigo-700">{s.lifeSkill}</span> : <span className="text-slate-400 italic">Belum Memilih</span>}
                                            </td>
                                            <td className="py-2.5 px-4 flex justify-center gap-2">
                                                <button onClick={() => openEditModal(s)} className="text-blue-600 hover:text-blue-800" title="Edit"><i className="fa-solid fa-pencil"></i></button>
                                                <button onClick={() => handleDeleteStudent(s)} className="text-rose-600 hover:text-rose-800" title="Hapus"><i className="fa-solid fa-trash"></i></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredAndSortedStudents.length === 0 && (
                                        <tr><td colSpan={8} className="text-center py-8 text-slate-400">Tidak ada data untuk ditampilkan.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            }

            case 'summary': {
                const summaryByLifeSkill = LIFE_SKILL_OPTIONS.map((ls, index) => {
                    const count = students.filter(s => s.lifeSkill === ls || (s.lifeSkill as string === 'Tata Busana' && ls === LifeSkill.CLOTHING_LINE)).length;

                    return {
                        "No.": index + 1,
                        "Life Skill": ls,
                        "Jumlah Pendaftar": count,
                    };
                });
                const summaryByClass = CLASS_OPTIONS.map((c, index) => ({ "No.": index + 1, "Kelas": c, "Jumlah Pendaftar": students.filter(s => s.classLevel === c && s.lifeSkill).length }));
                
                const handleDetailedSummaryPrint = () => {
                    if (detailedCountSummary.data.length === 0) {
                        Swal.fire('Informasi', 'Tidak ada data untuk dicetak.', 'info');
                        return;
                    }
                    printContent(detailedCountSummary.title, tableToHtml(detailedCountSummary.data, true));
                };

                const handleDetailedSummaryDownload = () => {
                     handleDownload(detailedCountSummary.data, detailedCountSummary.title.replace(/\s+/g, '_'));
                };

                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/80">
                            <h2 className="text-2xl font-bold text-slate-800 mb-6">Laporan Rekapitulasi</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <SummaryTable 
                                    title="Rekap per Pilihan Life Skill" 
                                    data={summaryByLifeSkill} 
                                    onPrint={() => printContent("Rekapitulasi per Pilihan Life Skill", tableToHtml(summaryByLifeSkill, true))}
                                    onDownload={() => handleDownload(summaryByLifeSkill, 'Rekap_Life_Skill')}
                                />
                                <SummaryTable 
                                    title="Rekap per Kelas (Sudah Memilih)" 
                                    data={summaryByClass} 
                                    onPrint={() => printContent("Rekapitulasi per Kelas", tableToHtml(summaryByClass, true))}
                                    onDownload={() => handleDownload(summaryByClass, 'Rekap_Kelas')}
                                />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/80">
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Rincian Jumlah Pendaftar Spesifik</h2>
                            <p className="text-xs text-slate-500 mb-4">Pilih filter untuk melihat rincian jumlah pendaftar per program dan kelas.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label htmlFor="summaryLifeSkillFilter" className="block text-xs font-bold text-slate-700 mb-1">Program Life Skill</label>
                                    <select id="summaryLifeSkillFilter" value={summaryLifeSkillFilter} onChange={e => setSummaryLifeSkillFilter(e.target.value as any)} className="w-full px-3 py-2 bg-white text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500">
                                        <option value="">Pilih Life Skill</option>
                                        <option value="SEMUA">Semua Program Life Skill</option>
                                        {LIFE_SKILL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="summaryClassFilter" className="block text-xs font-bold text-slate-700 mb-1">Kelas</label>
                                    <select id="summaryClassFilter" value={summaryClassFilter} onChange={e => setSummaryClassFilter(e.target.value as any)} className="w-full px-3 py-2 bg-white text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500">
                                        <option value="">Pilih Kelas</option>
                                        <option value="SEMUA">Semua Kelas</option>
                                        {CLASS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            </div>

                            {summaryLifeSkillFilter && summaryClassFilter && (
                                <div className="animate-fade-in mt-4">
                                    {detailedCountSummary.data.length > 0 ? (
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <h3 className="text-sm font-bold text-slate-700">
                                                    {detailedCountSummary.title}
                                                </h3>
                                                <div className="flex gap-2">
                                                    <button onClick={handleDetailedSummaryPrint} className="bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Cetak</button>
                                                    <button onClick={handleDetailedSummaryDownload} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Unduh Excel</button>
                                                </div>
                                            </div>
                                            <DynamicSummaryTable summary={detailedCountSummary} />
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-xl text-xs">
                                            Tidak ada data pendaftar yang cocok dengan filter ini.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            }

            case 'presensi': {
                const attendanceStudents = selectedLifeSkillForAttendance 
                    ? students.filter(s => s.lifeSkill === selectedLifeSkillForAttendance)
                    : [];

                return (
                    <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/80 animate-fade-in space-y-4">
                        <h2 className="text-2xl font-bold text-slate-800">Cetak Daftar Hadir Peserta (Presensi)</h2>
                        <p className="text-xs text-slate-500">Pilih program Life Skill untuk membuat dan mencetak lembar presensi resmi.</p>

                        <div className="flex flex-col sm:flex-row items-end gap-3 p-4 border border-slate-200 bg-slate-50 rounded-xl">
                            <div className="w-full sm:w-1/2">
                                <label htmlFor="attendanceLifeSkill" className="block text-xs font-bold text-slate-700 mb-1">Program Life Skill</label>
                                <select 
                                    id="attendanceLifeSkill" 
                                    value={selectedLifeSkillForAttendance} 
                                    onChange={e => setSelectedLifeSkillForAttendance(e.target.value as LifeSkill)}
                                    className="w-full px-3 py-2 bg-white text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="" disabled>Pilih Life Skill</option>
                                    {LIFE_SKILL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <button 
                                onClick={handlePrintAttendance}
                                disabled={!selectedLifeSkillForAttendance}
                                className="w-full sm:w-auto bg-indigo-600 text-white font-bold py-2 px-6 rounded-xl hover:bg-indigo-700 transition-all text-xs disabled:bg-slate-300 disabled:cursor-not-allowed"
                            >
                                <i className="fa-solid fa-print mr-1.5"></i> Cetak Lembar Presensi
                            </button>
                        </div>

                        {selectedLifeSkillForAttendance && (
                            <div className="mt-4">
                                <h3 className="text-sm font-bold text-slate-700 mb-3">
                                    Daftar Peserta: {selectedLifeSkillForAttendance} ({attendanceStudents.length} siswa)
                                </h3>
                                <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-120">
                                    <table className="min-w-full bg-white text-xs">
                                        <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-slate-700">
                                            <tr>
                                                <th rowSpan={2} className="py-2.5 px-3 text-center font-bold border-r border-b border-slate-200 w-12 align-middle">No.</th>
                                                <th rowSpan={2} className="py-2.5 px-3 text-left font-bold border-r border-b border-slate-200 w-24 align-middle">NIS</th>
                                                <th rowSpan={2} className="py-2.5 px-3 text-left font-bold border-r border-b border-slate-200 align-middle">Nama Lengkap</th>
                                                <th rowSpan={2} className="py-2.5 px-3 text-center font-bold border-r border-b border-slate-200 w-16 align-middle">Kelas</th>
                                                <th colSpan={10} className="py-1.5 px-2 text-center font-bold border-b border-slate-200">PERTEMUAN KE</th>
                                            </tr>
                                            <tr>
                                                {[...Array(10)].map((_, i) => (
                                                    <th key={i} className="py-1 px-1 text-center font-bold border-r border-slate-200 text-[10px] w-9">{i + 1}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {attendanceStudents.map((s, index) => (
                                                <tr key={s.id} className="hover:bg-slate-50">
                                                    <td className="py-2 px-3 text-center text-slate-400 border-r border-slate-100">{index + 1}</td>
                                                    <td className="py-2 px-3 font-mono font-bold text-indigo-700 border-r border-slate-100">{s.nis || '-'}</td>
                                                    <td className="py-2 px-3 font-bold text-slate-800 border-r border-slate-100">{s.fullName}</td>
                                                    <td className="py-2 px-3 text-center border-r border-slate-100">{s.classLevel}</td>
                                                    {[...Array(10)].map((_, i) => (
                                                        <td key={i} className="py-2 px-1 text-center border-r border-slate-100">
                                                            <div className="w-4 h-4 mx-auto border border-slate-200 rounded-sm bg-slate-50/50"></div>
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                            {attendanceStudents.length === 0 && (
                                                <tr><td colSpan={14} className="text-center py-8 text-slate-400">Tidak ada peserta.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                );
            }

            default:
                return null;
        }
    };
    
    const changeView = (view: AdminView) => {
        setActiveView(view);
        setFilter('');
        setStatusFilter('');
        setSearchQuery('');
        setSummaryClassFilter('');
        setSummaryLifeSkillFilter('');
        setSelectedLifeSkillForAttendance('');
        setSelectedStudentIds([]);
    };

    const closedSkillsCount = useMemo(() => {
        return skillSettings.filter(s => s.disabled).length;
    }, [skillSettings]);

    return (
        <div className="h-screen bg-slate-100 flex overflow-hidden">
            {isSidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}
            
            <nav className={`fixed lg:relative inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col transition-transform duration-300 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 z-30 print-hidden`}>
                <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={APP_LOGO} alt="Logo Sekolah" className="h-10 w-10 object-contain" referrerPolicy="no-referrer" />
                        <div>
                            <h1 className="text-base font-bold text-white leading-tight">Admin Panel</h1>
                            <p className="text-[11px] text-slate-400">Life Skill MANUSA</p>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white" aria-label="Tutup menu"><i className="fa-solid fa-xmark fa-lg"></i></button>
                </div>

                <ul className="flex-1 p-2 space-y-1 overflow-y-auto">
                    <NavItem iconClass="fa-solid fa-grip" text="Dashboard" active={activeView === 'dashboard'} onClick={() => changeView('dashboard')} />
                    <NavItem iconClass="fa-solid fa-users-gear" text="Master Data & Import" active={activeView === 'master-data'} onClick={() => changeView('master-data')} />
                    <NavItem 
                        iconClass="fa-solid fa-sliders" 
                        text="Pengaturan Life Skill" 
                        active={activeView === 'skill-settings'} 
                        onClick={() => changeView('skill-settings')}
                        badge={closedSkillsCount > 0 ? `${closedSkillsCount} Tutup` : undefined}
                    />
                    <NavItem iconClass="fa-solid fa-users" text="Laporan per Kelas" active={activeView === 'report-class'} onClick={() => changeView('report-class')} />
                    <NavItem iconClass="fa-solid fa-award" text="Laporan Life Skill" active={activeView === 'report-lifeskill'} onClick={() => changeView('report-lifeskill')} />
                    <NavItem iconClass="fa-solid fa-table-list" text="Laporan Rekap" active={activeView === 'summary'} onClick={() => changeView('summary')} />
                    <NavItem iconClass="fa-solid fa-clipboard-user" text="Presensi" active={activeView === 'presensi'} onClick={() => changeView('presensi')} />
                    
                    <div className="pt-4 px-2 space-y-2 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={handleRefreshData}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 border border-slate-700 transition cursor-pointer"
                            title="Muat Ulang / Sinkronkan Data dari Database Server"
                        >
                            <i className="fa-solid fa-arrows-rotate text-emerald-400"></i>
                            <span>Refresh Data Server</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleClearAllData}
                            className="w-full bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 border border-slate-700 hover:border-rose-800 transition cursor-pointer"
                            title="Kosongkan Semua Data Master Siswa"
                        >
                            <i className="fa-solid fa-trash-can text-rose-400"></i>
                            <span>Kosongkan Semua Data</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleChangePassword}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 border border-slate-700 transition cursor-pointer"
                            title="Ganti Username atau Password Administrator"
                        >
                            <i className="fa-solid fa-key text-amber-400"></i>
                            <span>Ganti Password Admin</span>
                        </button>
                    </div>
                </ul>

                <div className="p-2 border-t border-slate-700/50">
                    <NavItem iconClass="fa-solid fa-arrow-right-from-bracket" text="Logout" onClick={handleLogout} />
                </div>
            </nav>
            
            <div className="flex-1 flex flex-col overflow-y-auto">
                <header className="sticky top-0 bg-slate-100/80 backdrop-blur-sm z-10 p-2 flex items-center justify-between lg:hidden print-hidden shadow-sm">
                    <div className="flex items-center gap-2">
                        <img src={APP_LOGO} alt="Logo Sekolah" className="h-8 w-8 ml-2 object-contain" referrerPolicy="no-referrer" />
                        <span className="font-bold text-slate-700 text-base">Admin Panel</span>
                    </div>
                    <button onClick={() => setSidebarOpen(true)} className="p-2 mr-2 text-slate-600 hover:text-indigo-600" aria-label="Buka menu"><i className="fa-solid fa-bars fa-lg"></i></button>
                </header>

                <main className="flex-1 p-4 sm:p-6">
                    {renderContent()}
                </main>
            </div>

            {/* Modals */}
            <StudentModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveStudent} studentToEdit={studentToEdit} />
            <BulkImportModal
                isOpen={isBulkImportOpen}
                onClose={() => setBulkImportOpen(false)}
                onBulkImport={bulkImportStudents}
                onImportSuccess={() => fetchStudents()}
            />
        </div>
    );
};

const ThSortable: React.FC<{
    title: string;
    sortKey: keyof Student;
    sortConfig: SortConfig;
    onRequestSort: (key: keyof Student) => void;
    className?: string;
}> = ({ title, sortKey, sortConfig, onRequestSort, className = '' }) => {
    const isActive = sortConfig?.key === sortKey;
    const icon = isActive ? (sortConfig?.direction === 'ascending' ? '▲' : '▼') : '↕';

    return (
        <th className={`py-3 px-3 text-left text-xs font-bold text-slate-600 ${className}`}>
            <button onClick={() => onRequestSort(sortKey)} className="group inline-flex items-center gap-1.5 focus:outline-none cursor-pointer">
                <span>{title}</span>
                <span className={`transition-opacity ${isActive ? 'opacity-100 text-indigo-600' : 'opacity-30 text-slate-400 group-hover:opacity-100'}`}>
                    {icon}
                </span>
            </button>
        </th>
    );
};

const NavItem = ({ iconClass, text, active = false, onClick, badge }: { iconClass: string; text: string; active?: boolean; onClick: () => void; badge?: string | number; }) => (
    <li>
        <button onClick={onClick} className={`flex items-center justify-between w-full p-2.5 my-0.5 rounded-xl transition-all duration-200 text-xs cursor-pointer ${active ? 'bg-indigo-600 text-white font-bold shadow-md' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}>
            <div className="flex items-center min-w-0">
                <i className={`${iconClass} fa-fw w-5 text-center mr-2.5 flex-shrink-0`}></i>
                <span className="truncate">{text}</span>
            </div>
            {badge !== undefined && badge !== null && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active ? 'bg-white text-indigo-700' : 'bg-rose-500 text-white'}`}>
                    {badge}
                </span>
            )}
        </button>
    </li>
);

const SummaryTable: React.FC<{
    title: string; 
    data: any[];
    onPrint: () => void;
    onDownload: () => void;
}> = ({ title, data, onPrint, onDownload }) => {
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    const totalPendaftar = data.reduce((sum, item) => sum + (item['Jumlah Pendaftar'] || 0), 0);

    return (
        <div>
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-700">{title}</h3>
                <div className="flex gap-2 print-hidden">
                    <button onClick={onPrint} className="bg-slate-700 text-white px-3 py-1 text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors">Cetak</button>
                    <button onClick={() => onDownload()} className="bg-emerald-600 text-white px-3 py-1 text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors">Unduh Excel</button>
                </div>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="min-w-full bg-white text-xs">
                    <thead className="bg-slate-100">
                        <tr>
                            {headers.map(header => (
                                <th key={header} className={`py-2 px-3 font-bold text-slate-600 ${typeof data[0]?.[header] === 'number' || header.includes('Persentase') || header === 'Status' ? 'text-center' : 'text-left'}`}>
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.map((item, index) => (
                            <tr key={index} className="hover:bg-slate-50">
                                {headers.map(header => {
                                    const val = item[header];
                                    const isStatus = header === 'Status';
                                    return (
                                        <td key={header} className={`py-2 px-3 ${typeof val === 'number' || header.includes('Persentase') || isStatus ? 'text-center' : 'text-left'}`}>
                                            {isStatus ? (
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${val === 'Penuh' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                    {val}
                                                </span>
                                            ) : (
                                                val
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        {data.length === 0 && (
                           <tr>
                               <td colSpan={headers.length || 3} className="text-center py-6 text-slate-400">Tidak ada data untuk ditampilkan.</td>
                           </tr>
                        )}
                    </tbody>
                    {data.length > 0 && (
                        <tfoot className="bg-slate-100 font-bold text-slate-800">
                            <tr>
                                <td className="py-2 px-3 text-left" colSpan={headers.length - 1}>Total</td>
                                <td className="py-2 px-3 text-center">{totalPendaftar}</td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
};

const DynamicSummaryTable: React.FC<{
    summary: { data: any[], headers: string[] }
}> = ({ summary }) => {
    const { data, headers } = summary;
    const total = data.reduce((sum, item) => sum + (item['Jumlah Pendaftar'] || 0), 0);

    return (
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="min-w-full bg-white text-xs">
                <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                        {headers.map(header => (
                            <th key={header} className={`py-2 px-3 font-bold text-slate-600 ${header.includes('Jumlah') ? 'text-center' : 'text-left'}`}>{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50">
                            {headers.map(header => (
                                <td key={header} className={`py-2 px-3 ${header.includes('Jumlah') ? 'text-center' : 'text-left'}`}>{item[header]}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
                {data.length > 0 && headers.length > 1 && (
                    <tfoot className="bg-slate-100 font-bold text-slate-800">
                        <tr>
                            <td className="py-2 px-3 text-left" colSpan={headers.length - 1}>Total</td>
                            <td className="py-2 px-3 text-center">{total}</td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string | number; color: string; subValue?: string; icon?: string }> = ({ title, value, color, subValue, icon }) => (
    <div className={`bg-white p-5 rounded-2xl shadow-sm border-l-4 ${color} border-slate-200/80`}>
        <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h3>
            {icon && <i className={`${icon} text-slate-400 text-sm`}></i>}
        </div>
        <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-2">{value}</p>
        {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
    </div>
);

const DashboardView: React.FC<{ 
    students: Student[]; 
    skillSettings: SkillSetting[];
    isLoading: boolean; 
    onOpenImport: () => void;
    onNavigateToSettings: () => void;
    onToggleSkill: (skill: LifeSkill, currentlyDisabled: boolean, currentReason?: string) => void;
}> = ({ students, skillSettings, isLoading, onOpenImport, onNavigateToSettings, onToggleSkill }) => {
    const totalMasterStudents = students.length;
    const registeredStudents = students.filter(s => s.lifeSkill && s.lifeSkill.trim() !== '');
    const unregisteredStudents = students.filter(s => !s.lifeSkill || s.lifeSkill.trim() === '');
    
    const totalSelected = registeredStudents.length;
    const totalMale = registeredStudents.filter(s => s.jenisKelamin === 'Laki-laki').length;
    const totalFemale = registeredStudents.filter(s => s.jenisKelamin === 'Perempuan').length;

    const dataByLifeSkill = useMemo(() => {
        return LIFE_SKILL_OPTIONS.map(skill => {
            const count = registeredStudents.filter(s => s.lifeSkill === skill || (s.lifeSkill as string === 'Tata Busana' && skill === LifeSkill.CLOTHING_LINE)).length;
            return {
                name: skill,
                value: count
            };
        });
    }, [registeredStudents]);

    const dataByClass = useMemo(() => {
        return CLASS_OPTIONS.map(c => ({
            name: c,
            pendaftar: registeredStudents.filter(s => s.classLevel === c).length,
            totalMaster: students.filter(s => s.classLevel === c).length,
        }));
    }, [registeredStudents, students]);

    const PIE_COLORS = ['#6366f1', '#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#f43f5e'];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="text-center">
                    <p className="text-base font-semibold text-slate-600">Memuat data dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header & Quick Action */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">Dashboard & Monitoring</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Pemantauan partisipasi dan status pemilihan program Life Skill siswa.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={onNavigateToSettings}
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Buka menu pengaturan status program"
                    >
                        <i className="fa-solid fa-sliders"></i>
                        <span>Pengaturan Status & Kuota</span>
                    </button>
                    <button
                        type="button"
                        onClick={onOpenImport}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <i className="fa-solid fa-cloud-arrow-up"></i>
                        <span>Upload Excel Siswa</span>
                    </button>
                </div>
            </div>

            {/* Top 4 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Total Master Siswa" 
                    value={totalMasterStudents} 
                    subValue={`${unregisteredStudents.length} siswa belum memilih`}
                    color="border-indigo-600"
                    icon="fa-solid fa-users"
                />
                <StatCard 
                    title="Siswa Sudah Memilih" 
                    value={totalSelected} 
                    subValue={`${((totalSelected / (totalMasterStudents || 1)) * 100).toFixed(1)}% dari total master siswa`}
                    color="border-emerald-500" 
                    icon="fa-solid fa-circle-check"
                />
                <StatCard 
                    title="Siswa Belum Memilih" 
                    value={unregisteredStudents.length} 
                    subValue={`${((unregisteredStudents.length / (totalMasterStudents || 1)) * 100).toFixed(1)}% belum menentukan pilihan`}
                    color="border-amber-500" 
                    icon="fa-solid fa-user-clock"
                />
                <StatCard 
                    title="Gender Pendaftar" 
                    value={`${totalMale} L / ${totalFemale} P`} 
                    subValue="Laki-laki & Perempuan"
                    color="border-blue-500" 
                    icon="fa-solid fa-venus-mars"
                />
            </div>

            {/* Program Cards */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Jumlah Pendaftar 6 Program Life Skill</h3>
                        <p className="text-xs text-slate-500">Live monitoring jumlah siswa tiap kelas keterampilan beserta status pendaftaran</p>
                    </div>
                    <button
                        type="button"
                        onClick={onNavigateToSettings}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                    >
                        <i className="fa-solid fa-sliders text-[11px]"></i>
                        <span>Kelola Kuota / Status Program</span>
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {LIFE_SKILL_OPTIONS.map((skill) => {
                        const count = registeredStudents.filter(s => s.lifeSkill === skill || (s.lifeSkill as string === 'Tata Busana' && skill === LifeSkill.CLOTHING_LINE)).length;
                        const setting = skillSettings.find(s => s.skill === skill);
                        const isDisabled = setting ? Boolean(setting.disabled) : false;
                        const reason = setting?.reason || '';
                        const meta = SKILL_ICONS[skill];

                        return (
                            <div 
                                key={skill} 
                                className={`p-4 rounded-xl border transition-all ${
                                    isDisabled 
                                        ? 'border-rose-200 bg-rose-50/40' 
                                        : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:shadow-xs'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2 gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${isDisabled ? 'bg-rose-100 text-rose-700' : `${meta?.bg || 'bg-slate-100'} ${meta?.text || 'text-slate-700'}`}`}>
                                            <i className={`fa-solid ${meta?.icon || 'fa-award'}`}></i>
                                        </div>
                                        <span className="font-bold text-slate-800 text-xs truncate">{skill}</span>
                                    </div>

                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex-shrink-0 inline-flex items-center gap-1 ${
                                        isDisabled 
                                            ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    }`}>
                                        <i className={`fa-solid ${isDisabled ? 'fa-lock' : 'fa-check'} text-[8px]`}></i>
                                        <span>{isDisabled ? 'Penuh / Tutup' : 'Buka'}</span>
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] text-slate-600 font-medium mt-3 pt-2 border-t border-slate-100">
                                    <span className="font-bold text-indigo-700">{count} Siswa Terdaftar</span>
                                    <button
                                        type="button"
                                        onClick={() => onToggleSkill(skill, isDisabled, reason)}
                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                            isDisabled 
                                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                                : 'bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700'
                                        }`}
                                    >
                                        {isDisabled ? 'Buka Kembali' : 'Tutup Pilihan'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
                    <h3 className="text-base font-bold mb-4 text-slate-800">Partisipasi Pendaftar per Kelas</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={dataByClass} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <XAxis dataKey="name" fontSize={11} tick={{ fill: '#475569' }} />
                            <YAxis allowDecimals={false} fontSize={11} tick={{ fill: '#475569' }} />
                            <Tooltip wrapperClassName="!border-slate-300 !bg-white/90 !backdrop-blur-sm !rounded-xl !text-xs" cursor={{ fill: 'rgba(79, 70, 229, 0.08)' }}/>
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Bar dataKey="pendaftar" name="Sudah Memilih" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
                    <h3 className="text-base font-bold mb-4 text-slate-800">Distribusi Pilihan Life Skill</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie 
                                data={dataByLifeSkill.filter(d => d.value > 0)} 
                                dataKey="value" 
                                nameKey="name" 
                                cx="50%" 
                                cy="50%" 
                                outerRadius={90} 
                                labelLine={false} 
                                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                                    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                                    return (percent > 0.05) ? <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">{(percent * 100).toFixed(0)}%</text> : null;
                                }}
                            >
                                {dataByLifeSkill.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="white" strokeWidth={2} />)}
                            </Pie>
                            <Tooltip wrapperClassName="!border-slate-300 !bg-white/90 !backdrop-blur-sm !rounded-xl !text-xs" />
                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
