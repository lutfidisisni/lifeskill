import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { LifeSkill, type Student, type ClassLevel } from '../types';
import { CLASS_OPTIONS, LIFE_SKILL_OPTIONS, LIFE_SKILL_QUOTAS, APP_LOGO, API_BASE_URL } from '../constants';
import { StudentModal } from '../components/StudentModal';
import { useStudents } from '../hooks/useStudents';

declare const Swal: any;
declare const XLSX: any;

type AdminView = 'dashboard' | 'report-class' | 'report-lifeskill' | 'summary' | 'presensi';
type SortConfig = { key: keyof Student; direction: 'ascending' | 'descending' } | null;

export const AdminPage: React.FC = () => {
    const [activeView, setActiveView] = useState<AdminView>('dashboard');
    const [isModalOpen, setModalOpen] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
    const [filter, setFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'fullName', direction: 'ascending' });
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [summaryLifeSkillFilter, setSummaryLifeSkillFilter] = useState<LifeSkill | '' | 'SEMUA'>('');
    const [summaryClassFilter, setSummaryClassFilter] = useState<ClassLevel | '' | 'SEMUA'>('');
    const [selectedLifeSkillForAttendance, setSelectedLifeSkillForAttendance] = useState<LifeSkill | ''>('');

    const { students, loading, error, addStudent, updateStudent, deleteStudent, fetchStudents, clearAllStudents } = useStudents();
    const navigate = useNavigate();

    const handleChangePassword = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Ganti Akun & Password Admin',
            html: `
                <div style="text-align: left; font-size: 13px;" class="space-y-3">
                    <p style="color: #64748b; margin-bottom: 12px;">Akun default saat ini adalah <b>admin</b> / <b>admin123</b>.</p>
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
        Swal.fire({
            icon: 'success',
            title: 'Sinkronisasi Selesai',
            text: 'Data pendaftar telah dimuat ulang dari database server.',
            timer: 1500,
            showConfirmButton: false
        });
    };

    const handleClearAllData = () => {
        Swal.fire({
            title: 'Kosongkan Semua Data Pendaftar?',
            text: 'Semua data pendaftaran siswa akan dihapus dari server MySQL dan penyimpanan lokal. Tindakan ini tidak dapat dibatalkan.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Ya, Kosongkan Semua',
            cancelButtonText: 'Batal'
        }).then(async (result: any) => {
            if (result.isConfirmed) {
                await clearAllStudents();
                Swal.fire({
                    icon: 'success',
                    title: 'Data Berhasil Dikosongkan',
                    text: 'Seluruh data pendaftar telah dibersihkan.',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    };
    
    useEffect(() => {
        if(isSidebarOpen) {
            setSidebarOpen(false);
        }
    }, [activeView]);
    
    useEffect(() => {
        if (error) {
            Swal.fire('Error', error, 'error');
        }
    }, [error]);

    const printContent = (title: string, content: string) => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const html = `
                <html>
                <head>
                    <title>Cetak - ${title}</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
                    <style>
                        @media print { @page { size: 8.5in 13in; margin: 2cm 1.5cm; } }
                        body { font-family: 'Poppins', sans-serif; color: #000; }
                        .kop-sekolah { 
                            display: flex;
                            align-items: center;
                            gap: 20px;
                            text-align: left;
                            border-bottom: 3px solid black; 
                            padding-bottom: 10px; 
                            margin-bottom: 25px; 
                        }
                        .kop-sekolah img {
                             width: 85px;
                             height: 85px;
                        }
                        .kop-sekolah .text-container { flex-grow: 1; text-align: center; }
                        .kop-sekolah h2, .kop-sekolah h3, .kop-sekolah p { margin: 0; line-height: 1.4; }
                        .kop-sekolah h2 { font-size: 16pt; font-weight: 600; }
                        .kop-sekolah h3 { font-size: 18pt; font-weight: 700; }
                        .kop-sekolah p { font-size: 11pt; font-weight: 400; }
                        .report-main-title { text-align: center; font-size: 14pt; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; text-decoration: underline; }
                        .table-title { font-size: 12pt; font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
                        table { width: 100%; border-collapse: collapse; font-size: 11pt; }
                        th, td { border: 1px solid black; padding: 6px; text-align: left; vertical-align: top; }
                        th { font-weight: bold; background-color: #EFEFEF; text-align: center; }
                        td.number, td.center { text-align: center; }
                        td.signature { width: 35%; }
                        tfoot td { font-weight: bold; background-color: #EFEFEF; }
                    </style>
                </head>
                <body>
                    <div class="kop-sekolah">
                         <img src="${APP_LOGO}" alt="Logo Sekolah" />
                         <div class="text-container">
                             <h2>LEMBAGA PENDIDIKAN MAARIF NU</h2>
                             <h3>MA NU 01 BANYUPUTIH</h3>
                             <p>Alamat : Jl. Lapangan 9A Banyuputih Batang Jawa Tengah, 51271</p>
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
            const hasQuota = headers.includes('Kuota');
            if (hasQuota) {
                const totalQuota = data.reduce((sum, item) => sum + (item['Kuota'] || 0), 0);
                const totalSisa = data.reduce((sum, item) => sum + (item['Sisa Kuota'] || 0), 0);
                const overallPercent = totalQuota > 0 ? ((totalPendaftar / totalQuota) * 100).toFixed(1) + '%' : '0%';
                footerRow = `<tfoot><tr><td></td><td>Total</td><td class="center">${totalPendaftar}</td><td class="center">${totalQuota}</td><td class="center">${totalSisa}</td><td class="center">${overallPercent}</td><td></td></tr></tfoot>`;
            } else if (headers.length > 1) {
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
                Swal.fire({title: 'Sukses!', text: 'Data siswa berhasil diperbarui.', icon: 'success', confirmButtonColor: '#10b981'});
            } else {
                await addStudent(studentData);
                Swal.fire({title: 'Sukses!', text: 'Siswa baru berhasil ditambahkan.', icon: 'success', confirmButtonColor: '#10b981'});
            }
            setModalOpen(false);
        } catch (err: any) {
            Swal.fire({title: 'Gagal!', text: err.message || 'Gagal menyimpan data siswa.', icon: 'error', confirmButtonColor: '#d33'});
        }
    };

    const handleDeleteStudent = (student: Student) => {
        Swal.fire({
            title: 'Anda yakin?',
            text: `Anda akan menghapus data siswa "${student.fullName}". Aksi ini tidak dapat dibatalkan.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        }).then(async (result:any) => {
            if (result.isConfirmed) {
                try {
                    await deleteStudent(student.id);
                    Swal.fire('Terhapus!', 'Data siswa telah dihapus.', 'success');
                } catch (err: any) {
                    Swal.fire('Gagal!', err.message || 'Gagal menghapus data siswa.', 'error');
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

        if (filter) {
            if (activeView === 'report-class') {
                result = result.filter(s => s.classLevel === filter);
            } else if (activeView === 'report-lifeskill') {
                result = result.filter(s => s.lifeSkill === filter);
            }
        }

        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            result = result.filter(s => 
                s.fullName.toLowerCase().includes(lowercasedQuery) ||
                s.jenisKelamin.toLowerCase().includes(lowercasedQuery) ||
                s.classLevel.toLowerCase().includes(lowercasedQuery) ||
                s.whatsappNumber.toLowerCase().includes(lowercasedQuery) ||
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
    }, [students, filter, searchQuery, activeView, sortConfig]);

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
        const dateLine = `<p style="font-size: 12pt; margin-bottom: 15px; font-weight: bold;">Hari/Tanggal: .......................................</p>`;

        const tableHeader = `
            <thead>
                <tr>
                    <th style="width: 5%;">No.</th>
                    <th>Nama Lengkap</th>
                    <th style="width: 15%;">Kelas</th>
                    <th style="width: 30%;">Tanda Tangan</th>
                </tr>
            </thead>`;
        
        const tableBody = `
            <tbody>
                ${attendanceStudents.map((s, index) => `
                    <tr>
                        <td style="text-align: center;">${index + 1}</td>
                        <td>${s.fullName}</td>
                        <td style="text-align: center;">${s.classLevel}</td>
                        <td>${index + 1}.</td>
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
                return <DashboardView students={students} isLoading={loading} />;
            case 'report-class':
            case 'report-lifeskill': {
                 const isClassReport = activeView === 'report-class';
                 const reportTitle = isClassReport ? 'Laporan per Kelas' : 'Laporan per Pilihan Life Skill';
                 const filterOptions = isClassReport ? CLASS_OPTIONS : LIFE_SKILL_OPTIONS;
                 const filterLabel = isClassReport ? 'Filter Kelas' : 'Filter Life Skill';
                 
                 const dataToDownload = filteredAndSortedStudents.map(({id, createdAt, updatedAt, ...rest}, index) => ({
                    'No.': index + 1,
                    'Nama Lengkap': rest.fullName,
                    'Jenis Kelamin': rest.jenisKelamin,
                    'Kelas': rest.classLevel,
                    'No. WhatsApp': rest.whatsappNumber,
                    'Pilihan Life Skill': rest.lifeSkill || 'Belum Ditentukan',
                }));
                 const dataToPrint = dataToDownload;

                let printTitle = `Laporan Pendaftar Life Skill`;
                if (filter) printTitle += ` ${isClassReport ? 'Kelas' : 'Pilihan'} ${filter}`;
                else printTitle = "Laporan Seluruh Pendaftar Life Skill";

                const handleSingleReportPrint = () => {
                    if (dataToPrint.length === 0) {
                        Swal.fire('Informasi', 'Tidak ada data untuk dicetak.', 'info');
                        return;
                    }
                    printContent(printTitle, tableToHtml(dataToPrint));
                };

                return (
                    <div className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4 print-hidden">
                            <h2 className="text-2xl font-bold text-slate-800">{reportTitle}</h2>
                            <div className="flex gap-2">
                                <button onClick={handleSingleReportPrint} className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium">Cetak</button>
                                <button onClick={() => handleDownload(dataToDownload, reportTitle.replace(/\s+/g, '_'))} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">Unduh Excel</button>
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 print-hidden">
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                                <div className="relative w-full sm:w-auto">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                        <i className="fa-solid fa-search text-slate-400"></i>
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Cari siswa..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="border border-slate-300 rounded-md py-2 pl-10 pr-4 w-full sm:w-60 focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <label htmlFor="filter" className="text-sm font-medium text-slate-600 whitespace-nowrap">{filterLabel}:</label>
                                    <select id="filter" value={filter} onChange={e => setFilter(e.target.value)} className="border border-slate-300 rounded-md px-2 py-2 bg-white w-full focus:ring-2 focus:ring-indigo-500">
                                        <option value="">Semua</option>
                                        {filterOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button onClick={openCreateModal} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors w-full md:w-auto flex-shrink-0 font-medium">Tambah Siswa</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="py-3 px-4 text-center text-sm font-semibold text-slate-600 w-12">No.</th>
                                        <ThSortable title="Nama" sortKey="fullName" sortConfig={sortConfig} onRequestSort={requestSort} />
                                        <ThSortable title="Jenis Kelamin" sortKey="jenisKelamin" sortConfig={sortConfig} onRequestSort={requestSort} />
                                        <ThSortable title="Kelas" sortKey="classLevel" sortConfig={sortConfig} onRequestSort={requestSort} />
                                        <th className="py-3 px-4 text-left text-sm font-semibold text-slate-600">WhatsApp</th>
                                        <ThSortable title="Life Skill" sortKey="lifeSkill" sortConfig={sortConfig} onRequestSort={requestSort} />
                                        <th className="py-3 px-4 text-center text-sm font-semibold text-slate-600 print-hidden">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAndSortedStudents.map((s, index) => (
                                        <tr key={s.id} className="border-b border-slate-200 hover:bg-slate-50">
                                            <td className="py-3 px-4 text-center text-slate-500">{index + 1}</td>
                                            <td className="py-3 px-4">{s.fullName}</td>
                                            <td className="py-3 px-4 text-center">{s.jenisKelamin}</td>
                                            <td className="py-3 px-4 text-center">{s.classLevel}</td>
                                            <td className="py-3 px-4">{s.whatsappNumber}</td>
                                            <td className="py-3 px-4">
                                                {s.lifeSkill ? s.lifeSkill : <span className="text-slate-400 italic">Belum Ditentukan</span>}
                                            </td>
                                            <td className="py-3 px-4 flex justify-center gap-3 print-hidden">
                                                <button onClick={() => openEditModal(s)} className="text-blue-600 hover:text-blue-800 transition-colors" aria-label={`Ubah ${s.fullName}`}><i className="fa-solid fa-pencil"></i></button>
                                                <button onClick={() => handleDeleteStudent(s)} className="text-red-600 hover:text-red-800 transition-colors" aria-label={`Hapus ${s.fullName}`}><i className="fa-solid fa-trash"></i></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredAndSortedStudents.length === 0 && (
                                        <tr><td colSpan={7} className="text-center py-8 text-slate-500">Tidak ada data untuk ditampilkan.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            }
            case 'summary': {
                const summaryByLifeSkill = LIFE_SKILL_OPTIONS.map((ls, index) => {
                    const count = students.filter(s => s.lifeSkill === ls || (s.lifeSkill === 'Tata Busana' && ls === LifeSkill.CLOTHING_LINE)).length;
                    const quota = LIFE_SKILL_QUOTAS[ls];
                    const remaining = Math.max(0, quota - count);
                    const percentage = quota > 0 ? ((count / quota) * 100).toFixed(1) + '%' : '0%';
                    const status = count >= quota ? 'Penuh' : 'Tersedia';

                    return {
                        "No.": index + 1,
                        "Life Skill": ls,
                        "Jumlah Pendaftar": count,
                        "Kuota": quota,
                        "Sisa Kuota": remaining,
                        "Persentase": percentage,
                        "Status": status,
                    };
                });
                const summaryByClass = CLASS_OPTIONS.map((c, index) => ({ "No.": index + 1, "Kelas": c, "Jumlah Pendaftar": students.filter(s => s.classLevel === c).length }));
                
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
                    <div className="space-y-8 animate-fade-in">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                             <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-slate-800">Laporan Rekapitulasi</h2>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                 <SummaryTable 
                                    title="Rekap per Pilihan Life Skill" 
                                    data={summaryByLifeSkill} 
                                    onPrint={() => printContent("Rekapitulasi per Pilihan Life Skill", tableToHtml(summaryByLifeSkill, true))}
                                    onDownload={() => handleDownload(summaryByLifeSkill, 'Rekap_Life_Skill')}
                                />
                                <SummaryTable 
                                    title="Rekap per Kelas" 
                                    data={summaryByClass} 
                                    onPrint={() => printContent("Rekapitulasi per Kelas", tableToHtml(summaryByClass, true))}
                                    onDownload={() => handleDownload(summaryByClass, 'Rekap_Kelas')}
                                />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Rincian Jumlah Pendaftar</h2>
                            <p className="text-slate-600 mb-6">Pilih filter untuk melihat rincian jumlah pendaftar secara spesifik.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label htmlFor="summaryLifeSkillFilter" className="block text-sm font-medium text-slate-700 mb-1">Program Life Skill</label>
                                    <select id="summaryLifeSkillFilter" value={summaryLifeSkillFilter} onChange={e => setSummaryLifeSkillFilter(e.target.value as any)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500">
                                        <option value="">Pilih Life Skill</option>
                                        <option value="SEMUA">Semua Program Life Skill</option>
                                        {LIFE_SKILL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="summaryClassFilter" className="block text-sm font-medium text-slate-700 mb-1">Kelas</label>
                                    <select id="summaryClassFilter" value={summaryClassFilter} onChange={e => setSummaryClassFilter(e.target.value as any)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500">
                                        <option value="">Pilih Kelas</option>
                                        <option value="SEMUA">Semua Kelas</option>
                                        {CLASS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            </div>

                            {summaryLifeSkillFilter && summaryClassFilter && (
                                <div className="animate-fade-in mt-6">
                                    {detailedCountSummary.data.length > 0 ? (
                                        <div>
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-lg font-semibold text-slate-700">
                                                    {detailedCountSummary.title}
                                                </h3>
                                                <div className="flex gap-2">
                                                    <button onClick={handleDetailedSummaryPrint} className="bg-slate-600 text-white px-3 py-1.5 rounded-md hover:bg-slate-700 transition-colors text-sm font-medium">Cetak</button>
                                                    <button onClick={handleDetailedSummaryDownload} className="bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700 transition-colors text-sm font-medium">Unduh Excel</button>
                                                </div>
                                            </div>
                                            <DynamicSummaryTable summary={detailedCountSummary} />
                                        </div>
                                    ) : (
                                         <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg">
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
                    <div className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Cetak Daftar Hadir Peserta</h2>
                        <p className="text-slate-600 mb-6">Pilih program Life Skill untuk membuat dan mencetak lembar presensi.</p>

                        <div className="flex flex-col sm:flex-row items-end gap-4 p-4 border border-slate-200 bg-slate-50 rounded-lg">
                            <div className="w-full sm:w-1/2">
                                <label htmlFor="attendanceLifeSkill" className="block text-sm font-medium text-slate-700 mb-1">Program Life Skill</label>
                                <select 
                                    id="attendanceLifeSkill" 
                                    value={selectedLifeSkillForAttendance} 
                                    onChange={e => setSelectedLifeSkillForAttendance(e.target.value as LifeSkill)}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="" disabled>Pilih Life Skill</option>
                                    {LIFE_SKILL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <button 
                                onClick={handlePrintAttendance}
                                disabled={!selectedLifeSkillForAttendance}
                                className="w-full sm:w-auto bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                            >
                                Cetak
                            </button>
                        </div>

                        {selectedLifeSkillForAttendance && (
                             <div className="mt-6">
                                 <h3 className="text-lg font-semibold text-slate-700 mb-3">
                                     Daftar Peserta: {selectedLifeSkillForAttendance} ({attendanceStudents.length} orang)
                                 </h3>
                                 <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-96">
                                     <table className="min-w-full bg-white">
                                         <thead className="bg-slate-100 sticky top-0">
                                             <tr>
                                                 <th className="py-2 px-4 text-center text-sm font-semibold text-slate-600 w-12">No.</th>
                                                 <th className="py-2 px-4 text-left text-sm font-semibold text-slate-600">Nama Lengkap</th>
                                                 <th className="py-2 px-4 text-center text-sm font-semibold text-slate-600">Kelas</th>
                                             </tr>
                                         </thead>
                                         <tbody>
                                             {attendanceStudents.map((s, index) => (
                                                 <tr key={s.id} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                                                     <td className="py-2 px-4 text-center text-slate-500">{index + 1}</td>
                                                     <td className="py-2 px-4">{s.fullName}</td>
                                                     <td className="py-2 px-4 text-center">{s.classLevel}</td>
                                                 </tr>
                                             ))}
                                             {attendanceStudents.length === 0 && (
                                                 <tr><td colSpan={3} className="text-center py-8 text-slate-500">Tidak ada peserta.</td></tr>
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
        setSearchQuery('');
        setSummaryClassFilter('');
        setSummaryLifeSkillFilter('');
        setSelectedLifeSkillForAttendance('');
    };

    return (
        <div className="h-screen bg-slate-100 flex overflow-hidden">
            {isSidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}
            
            <nav className={`fixed lg:relative inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col transition-transform duration-300 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 z-30 print-hidden`}>
                <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={APP_LOGO} alt="Logo Sekolah" className="h-10 w-10 object-contain" referrerPolicy="no-referrer" />
                        <div>
                            <h1 className="text-lg font-bold text-white">Admin Panel</h1>
                            <p className="text-xs text-slate-400">Life Skill MANUSA</p>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white" aria-label="Tutup menu"><i className="fa-solid fa-xmark fa-lg"></i></button>
                </div>
                <ul className="flex-1 p-2 space-y-1">
                    <NavItem iconClass="fa-solid fa-grip" text="Dashboard" active={activeView === 'dashboard'} onClick={() => changeView('dashboard')} />
                    <NavItem iconClass="fa-solid fa-users" text="Laporan per Kelas" active={activeView === 'report-class'} onClick={() => changeView('report-class')} />
                    <NavItem iconClass="fa-solid fa-award" text="Laporan Life Skill" active={activeView === 'report-lifeskill'} onClick={() => changeView('report-lifeskill')} />
                    <NavItem iconClass="fa-solid fa-table-list" text="Laporan Rekap" active={activeView === 'summary'} onClick={() => changeView('summary')} />
                    <NavItem iconClass="fa-solid fa-clipboard-user" text="Presensi" active={activeView === 'presensi'} onClick={() => changeView('presensi')} />
                    
                    <div className="pt-4 px-2 space-y-2">
                        <button
                            type="button"
                            onClick={handleRefreshData}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 border border-slate-700 transition"
                            title="Muat Ulang / Sinkronkan Data dari Database Server"
                        >
                            <i className="fa-solid fa-arrows-rotate text-emerald-400"></i>
                            <span>Refresh Data Server</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleClearAllData}
                            className="w-full bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 border border-slate-700 hover:border-rose-800 transition"
                            title="Kosongkan Semua Data Pendaftar"
                        >
                            <i className="fa-solid fa-trash-can text-rose-400"></i>
                            <span>Kosongkan Semua Data</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleChangePassword}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 border border-slate-700 transition"
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
                        <span className="font-bold text-slate-700 text-lg">Admin Panel</span>
                    </div>
                    <button onClick={() => setSidebarOpen(true)} className="p-2 mr-2 text-slate-600 hover:text-indigo-600" aria-label="Buka menu"><i className="fa-solid fa-bars fa-lg"></i></button>
                </header>

                <main className="flex-1 p-4 sm:p-6">
                    {renderContent()}
                </main>
            </div>

            <StudentModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveStudent} studentToEdit={studentToEdit} />
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
        <th className={`py-3 px-4 text-left text-sm font-semibold text-slate-600 ${className}`}>
            <button onClick={() => onRequestSort(sortKey)} className="group inline-flex items-center gap-2 focus:outline-none">
                <span>{title}</span>
                <span className={`transition-opacity ${isActive ? 'opacity-100 text-indigo-600' : 'opacity-30 text-slate-400 group-hover:opacity-100'}`}>
                    {icon}
                </span>
            </button>
        </th>
    );
};

const NavItem = ({ iconClass, text, active = false, onClick }: {iconClass: string; text: string; active?: boolean; onClick: () => void;}) => (
    <li>
        <button onClick={onClick} className={`flex items-center w-full p-3 my-1 rounded-lg transition-colors duration-200 ${active ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-700/50'}`}>
            <i className={`${iconClass} fa-fw w-5 text-center mr-3 flex-shrink-0`}></i>
            <span className="font-medium">{text}</span>
        </button>
    </li>
);

const SummaryTable: React.FC<{
    title: string; 
    data: any[];
    onPrint: () => void;
    onDownload: () => void;
}> = ({title, data, onPrint, onDownload}) => {
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    const hasQuota = headers.includes('Kuota');
    const totalPendaftar = data.reduce((sum, item) => sum + (item['Jumlah Pendaftar'] || 0), 0);
    const totalKuota = data.reduce((sum, item) => sum + (item['Kuota'] || 0), 0);
    const totalSisa = data.reduce((sum, item) => sum + (item['Sisa Kuota'] || 0), 0);
    const overallPercent = totalKuota > 0 ? ((totalPendaftar / totalKuota) * 100).toFixed(1) + '%' : '0%';

    return(
        <div>
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
                <div className="flex gap-2 print-hidden">
                    <button onClick={onPrint} className="bg-slate-600 text-white px-3 py-1 text-sm rounded-md hover:bg-slate-700 transition-colors">Cetak</button>
                    <button onClick={() => onDownload()} className="bg-emerald-600 text-white px-3 py-1 text-sm rounded-md hover:bg-emerald-700 transition-colors">Unduh Excel</button>
                </div>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="min-w-full bg-white">
                    <thead className="bg-slate-100">
                        <tr>
                            {headers.map(header => (
                                <th key={header} className={`py-2 px-4 font-semibold text-sm text-slate-600 ${typeof data[0]?.[header] === 'number' || header.includes('Persentase') || header === 'Status' ? 'text-center' : 'text-left'}`}>
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => (
                            <tr key={index} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                                {headers.map(header => {
                                    const val = item[header];
                                    const isStatus = header === 'Status';
                                    return (
                                        <td key={header} className={`py-2 px-4 ${typeof val === 'number' || header.includes('Persentase') || isStatus ? 'text-center' : 'text-left'}`}>
                                            {isStatus ? (
                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${val === 'Penuh' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
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
                               <td colSpan={headers.length || 3} className="text-center py-6 text-slate-500">Tidak ada data untuk ditampilkan.</td>
                           </tr>
                        )}
                    </tbody>
                     {data.length > 0 && (
                        <tfoot className="bg-slate-100 font-bold text-slate-800">
                            {hasQuota ? (
                                <tr>
                                    <td className="py-2 px-4 text-left" colSpan={2}>Total</td>
                                    <td className="py-2 px-4 text-center">{totalPendaftar}</td>
                                    <td className="py-2 px-4 text-center">{totalKuota}</td>
                                    <td className="py-2 px-4 text-center">{totalSisa}</td>
                                    <td className="py-2 px-4 text-center">{overallPercent}</td>
                                    <td className="py-2 px-4 text-center"></td>
                                </tr>
                            ) : (
                                <tr>
                                    <td className="py-2 px-4 text-left" colSpan={headers.length - 1}>Total</td>
                                    <td className="py-2 px-4 text-center">{totalPendaftar}</td>
                                </tr>
                            )}
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
}

const DynamicSummaryTable: React.FC<{
    summary: { data: any[], headers: string[] }
}> = ({ summary }) => {
    const { data, headers } = summary;
    const total = data.reduce((sum, item) => sum + (item['Jumlah Pendaftar'] || 0), 0);

    return (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="min-w-full bg-white">
                <thead className="bg-slate-100">
                    <tr>
                        {headers.map(header => (
                            <th key={header} className={`py-2 px-4 text-left font-semibold text-sm text-slate-600 ${header.includes('Jumlah') ? 'text-center' : 'text-left'}`}>{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, index) => (
                        <tr key={index} className="border-b border-slate-200 last:border-b-0">
                            {headers.map(header => (
                                <td key={header} className={`py-2 px-4 ${header.includes('Jumlah') ? 'text-center' : 'text-left'}`}>{item[header]}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
                {data.length > 0 && headers.length > 1 && (
                    <tfoot className="bg-slate-100 font-bold text-slate-800">
                        <tr>
                            <td className="py-2 px-4 text-left" colSpan={headers.length - 1}>Total</td>
                            <td className="py-2 px-4 text-center">{total}</td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
};

const StatCard: React.FC<{title: string, value: string | number, color: string, subValue?: string}> = ({title, value, color, subValue}) => (
    <div className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${color}`}>
        <h3 className="text-base font-medium text-slate-500">{title}</h3>
        <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
        {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
    </div>
)

const DashboardView: React.FC<{students: Student[]; isLoading: boolean}> = ({ students, isLoading }) => {
    const totalStudents = students.length;
    const totalCapacity = 285;
    const totalRemaining = Math.max(0, totalCapacity - totalStudents);
    const totalMale = students.filter(s => s.jenisKelamin === 'Laki-laki').length;
    const totalFemale = students.filter(s => s.jenisKelamin === 'Perempuan').length;

    const dataByLifeSkill = useMemo(() => {
        return LIFE_SKILL_OPTIONS.map(skill => {
            const count = students.filter(s => s.lifeSkill === skill || (s.lifeSkill === 'Tata Busana' && skill === LifeSkill.CLOTHING_LINE)).length;
            return {
                name: skill,
                value: count,
                quota: LIFE_SKILL_QUOTAS[skill]
            };
        });
    }, [students]);

    const dataByClass = useMemo(() => {
        return CLASS_OPTIONS.map(c => ({
            name: c,
            pendaftar: students.filter(s => s.classLevel === c).length
        }));
    }, [students]);

    const PIE_COLORS = ['#3b82f6', '#14b8a6', '#f97316', '#84cc16', '#6366f1', '#db2777'];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-slate-800 mb-6">Dashboard</h2>
                    <p className="text-lg font-medium text-slate-600">Memuat data dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>
                <div className="text-sm font-medium text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                    Kapasitas Pendaftaran: <span className="font-bold text-indigo-600">{totalStudents}</span> / {totalCapacity} Siswa ({((totalStudents / totalCapacity) * 100).toFixed(1)}%)
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Pendaftar" 
                    value={`${totalStudents} / ${totalCapacity}`} 
                    subValue={`Terisi ${((totalStudents / totalCapacity) * 100).toFixed(1)}%`}
                    color="border-indigo-500" 
                />
                <StatCard 
                    title="Sisa Kuota Total" 
                    value={`${totalRemaining} Kursi`} 
                    subValue="Dari total 6 program"
                    color="border-emerald-500" 
                />
                <StatCard 
                    title="Total Laki-laki" 
                    value={totalMale} 
                    subValue={`${totalStudents > 0 ? ((totalMale / totalStudents) * 100).toFixed(1) : 0}% pendaftar`}
                    color="border-blue-500" 
                />
                <StatCard 
                    title="Total Perempuan" 
                    value={totalFemale} 
                    subValue={`${totalStudents > 0 ? ((totalFemale / totalStudents) * 100).toFixed(1) : 0}% pendaftar`}
                    color="border-pink-500" 
                />
            </div>

            {/* Quota Fulfillment Breakdown */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-semibold text-slate-800">Status Pemenuhan Kuota Life Skill</h3>
                        <p className="text-sm text-slate-500">Monitoring pengisian kuota untuk setiap program keterampilan</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {LIFE_SKILL_OPTIONS.map((skill, index) => {
                        const count = students.filter(s => s.lifeSkill === skill || (s.lifeSkill === 'Tata Busana' && skill === LifeSkill.CLOTHING_LINE)).length;
                        const quota = LIFE_SKILL_QUOTAS[skill];
                        const remaining = Math.max(0, quota - count);
                        const percentage = Math.min(100, quota > 0 ? (count / quota) * 100 : 0);
                        const isFull = count >= quota;

                        return (
                            <div key={skill} className="p-4 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-sm transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-semibold text-slate-800 text-sm">{skill}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${isFull ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {isFull ? 'PENUH' : `Sisa ${remaining}`}
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden mb-2">
                                    <div 
                                        className={`h-2.5 rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : percentage > 75 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs text-slate-600 font-medium">
                                    <span>{count} / {quota} Siswa</span>
                                    <span>{percentage.toFixed(1)}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-4 text-slate-700">Pendaftar per Kelas</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dataByClass} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <XAxis dataKey="name" fontSize={12} tick={{ fill: '#475569' }} />
                            <YAxis allowDecimals={false} fontSize={12} tick={{ fill: '#475569' }} />
                            <Tooltip wrapperClassName="!border-slate-300 !bg-white/80 !backdrop-blur-sm !rounded-lg" cursor={{ fill: 'rgba(79, 70, 229, 0.1)' }}/>
                            <Legend wrapperStyle={{ fontSize: '14px' }} />
                            <Bar dataKey="pendaftar" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                     <h3 className="text-xl font-semibold mb-4 text-slate-700">Distribusi Pilihan Life Skill</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie 
                                data={dataByLifeSkill.filter(d => d.value > 0)} 
                                dataKey="value" 
                                nameKey="name" 
                                cx="50%" 
                                cy="50%" 
                                outerRadius={100} 
                                labelLine={false} 
                                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                                    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                                    return (percent > 0.05) ? <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">{(percent * 100).toFixed(0)}%</text> : null;
                                }}
                            >
                                {dataByLifeSkill.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="white" strokeWidth={2} />)}
                            </Pie>
                            <Tooltip wrapperClassName="!border-slate-300 !bg-white/80 !backdrop-blur-sm !rounded-lg" />
                            <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};