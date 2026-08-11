import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LIFE_SKILL_OPTIONS, APP_LOGO, API_BASE_URL } from '../constants';
import type { LifeSkill, Student } from '../types';
import { useStudents } from '../hooks/useStudents';

declare const Swal: any;

const QUOTA_API_URL = `${API_BASE_URL}/quotas`;

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

export const RegistrationPage: React.FC = () => {
    const { lookupStudentByNIS, chooseLifeSkill, students } = useStudents();

    // Verification & Selection State
    const [inputNis, setInputNis] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [verifiedStudent, setVerifiedStudent] = useState<Student | null>(null);
    const [alreadySelected, setAlreadySelected] = useState<boolean>(false);
    const [selectedProgram, setSelectedProgram] = useState<LifeSkill | ''>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState<Student | null>(null);

    const formRef = useRef<HTMLDivElement>(null);

    // Handle NIS Search
    const handleSearchNIS = async (nisToSearch?: string) => {
        const nis = (nisToSearch || inputNis).trim();
        if (!nis) {
            setSearchError('Silakan masukkan NIS Anda terlebih dahulu.');
            return;
        }

        setIsSearching(true);
        setSearchError(null);
        setVerifiedStudent(null);
        setAlreadySelected(false);
        setSelectedProgram('');
        setRegistrationSuccess(null);

        try {
            const result = await lookupStudentByNIS(nis);
            if (result.found && result.student) {
                setVerifiedStudent(result.student);
                setAlreadySelected(result.alreadySelected);
                if (result.alreadySelected && result.student.lifeSkill) {
                    setSelectedProgram(result.student.lifeSkill);
                }

                // Smooth scroll to verified card
                setTimeout(() => {
                    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            } else {
                setSearchError(result.message || `NIS "${nis}" tidak ditemukan dalam Master Data Siswa.`);
            }
        } catch (err: any) {
            setSearchError(err.message || 'Gagal mencari data siswa.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleResetSearch = () => {
        setInputNis('');
        setVerifiedStudent(null);
        setAlreadySelected(false);
        setSelectedProgram('');
        setSearchError(null);
        setRegistrationSuccess(null);
    };

    const handleSelectSkillCard = (skill: LifeSkill) => {
        if (alreadySelected) return;
        setSelectedProgram(skill);
    };

    const handleSubmitChoice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!verifiedStudent) return;

        if (alreadySelected) {
            Swal.fire({
                icon: 'info',
                title: 'Sudah Memilih',
                text: `Siswa "${verifiedStudent.fullName}" sudah terdaftar pada program "${verifiedStudent.lifeSkill}". Pilihan tidak dapat diubah kembali.`,
                confirmButtonColor: '#4f46e5',
            });
            return;
        }

        if (!selectedProgram) {
            Swal.fire({
                icon: 'warning',
                title: 'Belum Memilih Program',
                text: 'Silakan klik salah satu kartu program Life Skill di bawah untuk memilih.',
                confirmButtonColor: '#4f46e5',
            });
            return;
        }

        // Confirmation Dialog
        const { isConfirmed } = await Swal.fire({
            title: 'Konfirmasi Pilihan Life Skill',
            html: `
                <div style="text-align: left; font-size: 14px; color: #334155; line-height: 1.6;">
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; margin-bottom: 12px;">
                        <p style="margin: 0; font-size: 12px; color: #64748b;">Nama Siswa:</p>
                        <p style="margin: 0 0 6px 0; font-weight: 700; color: #0f172a; font-size: 15px;">${verifiedStudent.fullName}</p>
                        <p style="margin: 0; font-size: 12px; color: #64748b;">NIS / Kelas:</p>
                        <p style="margin: 0; font-weight: 600; color: #334155;">${verifiedStudent.nis} / Kelas ${verifiedStudent.classLevel}</p>
                    </div>
                    <p style="margin-bottom: 8px;">
                        Program yang Anda pilih: <br/>
                        <strong style="color: #4f46e5; font-size: 16px;">✨ ${selectedProgram}</strong>
                    </p>
                    <p style="font-size: 12px; color: #ef4444; font-weight: 600; margin: 0;">
                        ⚠️ Perhatian: Setiap siswa hanya dapat memilih 1 (satu) kali dan pilihan tidak dapat diganti secara mandiri.
                    </p>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Ya, Simpan Pilihan Saya',
            cancelButtonText: 'Periksa Kembali',
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#64748b',
        });

        if (!isConfirmed) return;

        setIsSubmitting(true);
        try {
            const updated = await chooseLifeSkill(
                verifiedStudent.nis,
                selectedProgram
            );

            setVerifiedStudent(updated);
            setAlreadySelected(true);
            setRegistrationSuccess(updated);

            // Update real-time quota
            setQuotaCounts(prev => ({
                ...prev,
                [selectedProgram]: (prev[selectedProgram] || 0) + 1,
            }));

            Swal.fire({
                icon: 'success',
                title: 'Pilihan Berhasil Disimpan!',
                html: `
                    <div style="text-align: center; font-size: 14px; color: #334155;">
                        <p style="font-size: 15px; margin-bottom: 6px;">
                            Selamat <b>${updated.fullName}</b>!
                        </p>
                        <p style="color: #475569; margin-bottom: 12px;">
                            Pilihan program Life Skill <b>"${updated.lifeSkill}"</b> telah berhasil dicatat oleh sistem.
                        </p>
                        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 10px; border-radius: 8px; font-size: 12px; font-weight: 600;">
                            ✅ Terdaftar Resmi untuk Kelas ${updated.classLevel}
                        </div>
                    </div>
                `,
                confirmButtonColor: '#10b981',
            });
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Pendaftaran Gagal',
                text: err.message || 'Terjadi kendala saat menyimpan pilihan. Silakan coba kembali.',
                confirmButtonColor: '#ef4444',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrintReceipt = () => {
        if (!verifiedStudent || !verifiedStudent.lifeSkill) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Bukti Pendaftaran Life Skill - ${verifiedStudent.fullName}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 30px; color: #0f172a; max-width: 650px; margin: 0 auto; }
                    .header { display: flex; align-items: center; gap: 16px; border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
                    .header img { width: 70px; height: 70px; object-fit: contain; }
                    .header-text h2 { margin: 0; font-size: 18px; font-weight: 800; }
                    .header-text h3 { margin: 2px 0 0 0; font-size: 15px; font-weight: 700; color: #334155; }
                    .header-text p { margin: 2px 0 0 0; font-size: 11px; color: #64748b; }
                    .title { text-align: center; font-size: 16px; font-weight: 800; text-transform: uppercase; margin-bottom: 16px; letter-spacing: 0.5px; }
                    .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 20px; background-color: #f8fafc; }
                    table { width: 100%; border-collapse: collapse; font-size: 13px; }
                    td { padding: 6px 4px; vertical-align: top; }
                    td.label { width: 35%; color: #475569; font-weight: 600; }
                    td.value { width: 65%; font-weight: 700; color: #0f172a; }
                    .program-badge { display: inline-block; background-color: #e0e7ff; color: #3730a3; padding: 6px 12px; border-radius: 6px; font-weight: 800; font-size: 14px; margin-top: 4px; }
                    .footer { display: flex; justify-content: space-between; margin-top: 40px; font-size: 12px; }
                    .signature-box { text-align: center; width: 200px; }
                    .signature-space { height: 60px; }
                    @media print {
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="${APP_LOGO}" alt="Logo" />
                    <div class="header-text">
                        <h2>LEMBAGA PENDIDIKAN MA'ARIF NU</h2>
                        <h3>MA NU 01 BANYUPUTIH BATANG</h3>
                        <p>Jl. Lapangan 9A Banyuputih, Kec. Banyuputih, Kab. Batang, Jawa Tengah 51271</p>
                    </div>
                </div>

                <div class="title">BUKTI RESMI PEMILIHAN PROGRAM LIFE SKILL</div>

                <div class="card">
                    <table>
                        <tr>
                            <td class="label">Nomor Induk Siswa (NIS)</td>
                            <td class="value">: ${verifiedStudent.nis}</td>
                        </tr>
                        <tr>
                            <td class="label">Nama Lengkap Siswa</td>
                            <td class="value">: ${verifiedStudent.fullName}</td>
                        </tr>
                        <tr>
                            <td class="label">Jenis Kelamin</td>
                            <td class="value">: ${verifiedStudent.jenisKelamin}</td>
                        </tr>
                        <tr>
                            <td class="label">Kelas / Rombel</td>
                            <td class="value">: ${verifiedStudent.classLevel}</td>
                        </tr>
                        <tr>
                            <td class="label">Nomor WhatsApp</td>
                            <td class="value">: ${verifiedStudent.whatsappNumber || '-'}</td>
                        </tr>
                        <tr>
                            <td class="label">Program Pilihan</td>
                            <td class="value">: <span class="program-badge">${verifiedStudent.lifeSkill}</span></td>
                        </tr>
                        <tr>
                            <td class="label">Waktu Pendaftaran</td>
                            <td class="value">: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</td>
                        </tr>
                    </table>
                </div>

                <p style="font-size: 11px; color: #64748b; text-align: justify; line-height: 1.5;">
                    * Simpan bukti pendaftaran ini sebagai tanda bukti resmi telah memilih program Life Skill MA NU 01 Banyuputih Tahun Pelajaran 2025/2026. Setiap siswa hanya dapat terdaftar pada 1 (satu) jenis program.
                </p>

                <div class="footer">
                    <div class="signature-box">
                        <p>Siswa Pendaftar,</p>
                        <div class="signature-space"></div>
                        <p><strong>${verifiedStudent.fullName}</strong></p>
                    </div>
                    <div class="signature-box">
                        <p>Banyuputih, ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}<br/>Panitia Life Skill,</p>
                        <div class="signature-space"></div>
                        <p><strong>( ______________________ )</strong></p>
                    </div>
                </div>

                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    return (
        <div className="min-h-screen bg-slate-100/80 flex flex-col items-center justify-start p-2.5 sm:p-4 md:p-6 selection:bg-indigo-500 selection:text-white">
            {/* Header Top Bar */}
            <div className="w-full max-w-4xl flex items-center justify-between py-2 px-1 mb-2">
                <div className="flex items-center gap-2">
                    <img src={APP_LOGO} alt="MA NU 01 Banyuputih" className="h-7 w-7 sm:h-8 sm:w-8 object-contain" referrerPolicy="no-referrer" />
                    <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight block leading-tight">
                            MA NU 01 BANYUPUTIH
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                            Portal Pendaftaran Life Skill
                        </span>
                    </div>
                </div>
                <Link
                    to="/login"
                    className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 touch-manipulation"
                >
                    <i className="fa-solid fa-lock text-indigo-600 text-xs"></i>
                    <span>Admin</span>
                </Link>
            </div>

            {/* Main Wrapper */}
            <div className="w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden border border-slate-200/80">
                {/* Hero Banner */}
                <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 px-4 py-6 sm:py-8 sm:px-8 flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute -right-12 -bottom-12 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="absolute -left-12 -top-12 w-44 h-44 bg-indigo-400/20 rounded-full blur-xl pointer-events-none"></div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-indigo-100 text-[11px] font-semibold backdrop-blur-sm mb-3 border border-white/20">
                        <i className="fa-solid fa-graduation-cap text-amber-300"></i>
                        <span>Tahun Pelajaran 2026 / 2027</span>
                    </div>

                    <img
                        src={APP_LOGO}
                        alt="Logo MA NU 01 Banyuputih"
                        className="h-16 w-16 sm:h-20 sm:w-20 mb-2 object-contain drop-shadow-md"
                        referrerPolicy="no-referrer"
                    />
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                        Pemilihan Program Life Skill
                    </h1>
                    <p className="text-indigo-100 mt-1 text-xs sm:text-sm font-medium max-w-lg">
                        Masukkan NIS Anda untuk memverifikasi data dan menentukan pilihan program Life Skill. Setiap siswa hanya dapat memilih 1 kali.
                    </p>
                </div>

                {/* Main Interactive Flow Area */}
                <div ref={formRef} className="p-4 sm:p-8 space-y-6">
                    {/* STEP 1: NIS INPUT & LOOKUP */}
                    <div className="bg-slate-50 rounded-2xl p-4 sm:p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center">
                                    1
                                </span>
                                <h3 className="text-sm sm:text-base font-bold text-slate-800">
                                    Masukkan Nomor Induk Siswa (NIS)
                                </h3>
                            </div>
                            {verifiedStudent && (
                                <button
                                    type="button"
                                    onClick={handleResetSearch}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                                >
                                    <i className="fa-solid fa-rotate-left"></i>
                                    <span>Ganti NIS</span>
                                </button>
                            )}
                        </div>

                        <p className="text-xs text-slate-500 mb-3">
                            Sistem akan mencocokkan NIS Anda dengan data resmi sekolah untuk menampilkan Nama, Kelas, dan Jenis Kelamin.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <div className="relative flex-grow">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 text-sm">
                                    <i className="fa-solid fa-id-card"></i>
                                </span>
                                <input
                                    type="text"
                                    id="nisInput"
                                    value={inputNis}
                                    onChange={(e) => {
                                        setInputNis(e.target.value);
                                        if (searchError) setSearchError(null);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSearchNIS();
                                        }
                                    }}
                                    disabled={Boolean(verifiedStudent)}
                                    placeholder="Masukkan NIS Anda (contoh: 6123)"
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm font-semibold tracking-wide disabled:bg-slate-100 disabled:text-slate-500 shadow-xs"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => handleSearchNIS()}
                                disabled={isSearching || !inputNis.trim() || Boolean(verifiedStudent)}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95 touch-manipulation min-h-[48px]"
                            >
                                {isSearching ? (
                                    <>
                                        <i className="fa-solid fa-spinner fa-spin"></i>
                                        <span>Memeriksa...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-magnifying-glass"></i>
                                        <span>Cek Data Siswa</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Search Error Notice */}
                        {searchError && (
                            <div className="mt-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fade-in">
                                <i className="fa-solid fa-circle-exclamation text-rose-600 text-sm mt-0.5 shrink-0"></i>
                                <div>
                                    <span className="font-bold">Data Tidak Ditemukan:</span> {searchError}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* STEP 2: VERIFIED STUDENT IDENTITY CARD */}
                    {verifiedStudent && (
                        <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-indigo-200 shadow-sm animate-fade-in space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center">
                                        2
                                    </span>
                                    <h3 className="text-sm sm:text-base font-bold text-slate-800">
                                        Data Identitas Siswa Terverifikasi
                                    </h3>
                                </div>
                                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold flex items-center gap-1">
                                    <i className="fa-solid fa-circle-check text-emerald-600"></i> Terverifikasi
                                </span>
                            </div>

                            {/* Info Table / Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400">NIS</div>
                                    <div className="text-sm font-mono font-bold text-indigo-700 mt-0.5">{verifiedStudent.nis}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Nama Lengkap</div>
                                    <div className="text-sm font-bold text-slate-800 mt-0.5">{verifiedStudent.fullName}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Kelas</div>
                                    <div className="text-sm font-bold text-slate-800 mt-0.5">Kelas {verifiedStudent.classLevel}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Jenis Kelamin</div>
                                    <div className="text-sm font-semibold text-slate-700 mt-0.5">{verifiedStudent.jenisKelamin}</div>
                                </div>
                            </div>

                            {/* ALREADY REGISTERED STATUS CARD */}
                            {alreadySelected ? (
                                <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <span className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg shrink-0">
                                            <i className="fa-solid fa-circle-info"></i>
                                        </span>
                                        <div>
                                            <h4 className="font-extrabold text-sm sm:text-base text-amber-900">
                                                Anda Sudah Terdaftar pada Program: {verifiedStudent.lifeSkill}
                                            </h4>
                                            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                                                Data pendaftaran Anda telah tercatat secara resmi. Setiap siswa hanya diperbolehkan memilih 1 (satu) kali agar tidak ada data ganda.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200/80">
                                        <button
                                            type="button"
                                            onClick={handlePrintReceipt}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                                        >
                                            <i className="fa-solid fa-print"></i>
                                            <span>Cetak Bukti Pendaftaran</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleResetSearch}
                                            className="px-4 py-2 bg-white hover:bg-slate-50 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                                        >
                                            <i className="fa-solid fa-user-plus"></i>
                                            <span>Cek Siswa / NIS Lain</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* NOT YET SELECTED - OPEN SELECTION */
                                <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                                        <i className="fa-solid fa-sparkles text-amber-500 text-sm"></i>
                                        <span>Status: Belum Memilih — Silakan tentukan program Life Skill Anda pada Langkah 3 di bawah.</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 3: CHOOSE LIFE SKILL (Only active if verified and hasn't chosen yet) */}
                    {verifiedStudent && !alreadySelected && (
                        <form onSubmit={handleSubmitChoice} className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm animate-fade-in space-y-5">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center">
                                    3
                                </span>
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-slate-800">
                                        Pilih Program Life Skill Pilihanmu
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Klik pada salah satu pilihan program Life Skill di bawah ini:
                                    </p>
                                </div>
                            </div>

                            {/* 6 Program Visual Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {LIFE_SKILL_OPTIONS.map((skill) => {
                                    const isSelected = selectedProgram === skill;
                                    const meta = SKILL_ICONS[skill] || { icon: 'fa-star', bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', desc: '' };

                                    return (
                                        <div
                                            key={skill}
                                            onClick={() => handleSelectSkillCard(skill)}
                                            className={`p-4 rounded-2xl border-2 transition-all relative flex flex-col justify-between cursor-pointer select-none ${
                                                isSelected
                                                    ? 'bg-indigo-50/70 border-indigo-600 shadow-md ring-2 ring-indigo-400/30 scale-[1.02]'
                                                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`w-9 h-9 rounded-xl ${meta.bg} ${meta.text} flex items-center justify-center text-base shadow-xs`}>
                                                        <i className={`fa-solid ${meta.icon}`}></i>
                                                    </span>
                                                </div>

                                                <h4 className="font-extrabold text-sm text-slate-800">
                                                    {skill}
                                                </h4>
                                                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                                    {meta.desc}
                                                </p>
                                            </div>

                                            <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-end">
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                                                    isSelected 
                                                        ? 'bg-indigo-600 border-indigo-600 text-white' 
                                                        : 'border-slate-300 text-transparent'
                                                }`}>
                                                    <i className="fa-solid fa-check text-[10px]"></i>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting || !selectedProgram}
                                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 text-base active:scale-98 touch-manipulation min-h-[52px]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <i className="fa-solid fa-spinner fa-spin text-lg"></i>
                                        <span>Menyimpan Pilihan Anda...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-paper-plane text-base"></i>
                                        <span>Konfirmasi & Simpan Pilihan Life Skill</span>
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            <footer className="text-center py-4 text-xs text-slate-500 mt-2">
                &copy; {new Date().getFullYear()} MA NU 01 Banyuputih Batang. All rights reserved.
            </footer>
        </div>
    );
};
