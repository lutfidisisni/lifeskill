import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LIFE_SKILL_OPTIONS, LIFE_SKILL_QUOTAS, CLASS_OPTIONS, APP_LOGO, API_BASE_URL } from '../constants';
import type { LifeSkill, ClassLevel, Gender, Student } from '../types';

declare const Swal: any;

const API_URL = `${API_BASE_URL}/register`;
const QUOTA_API_URL = `${API_BASE_URL}/quotas`;
const STORAGE_KEY = 'manusa_students_data_v2';
const LEGACY_STORAGE_KEY = 'manusa_students_data_v1';

const DUMMY_IDS = new Set([
    'std-001', 'std-002', 'std-003', 'std-004', 'std-005',
    'std-006', 'std-007', 'std-008', 'std-009', 'std-010',
    'std-011', 'std-012', 'std-013', 'std-014', 'std-015',
    'std-016', 'std-017', 'std-018', 'std-019', 'std-020'
]);

const SKILL_ICONS: Record<string, { icon: string; bg: string; text: string }> = {
    'Desain Grafis': { icon: 'fa-palette', bg: 'bg-indigo-100', text: 'text-indigo-600' },
    'Otomotif': { icon: 'fa-wrench', bg: 'bg-blue-100', text: 'text-blue-600' },
    'Tata Boga': { icon: 'fa-utensils', bg: 'bg-amber-100', text: 'text-amber-600' },
    'Clothing Line': { icon: 'fa-shirt', bg: 'bg-purple-100', text: 'text-purple-600' },
    'Setir Mobil': { icon: 'fa-car', bg: 'bg-emerald-100', text: 'text-emerald-600' },
    'Tata Rias': { icon: 'fa-wand-magic-sparkles', bg: 'bg-rose-100', text: 'text-rose-600' },
};

// Calculate quota counts from local student list
const calculateLocalQuotaCounts = (): Record<string, number> => {
    let studentList: Student[] = [];
    try {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                studentList = parsed.filter((s: any) => s && s.id && !DUMMY_IDS.has(s.id) && s.fullName !== 'Ahmad Fauzi Ridwan');
            }
        }
    } catch (e) {
        console.error('Failed to parse local storage for quotas:', e);
    }

    const counts: Record<string, number> = {};
    studentList.forEach(std => {
        const skill = std.lifeSkill === ('Tata Busana' as any) ? 'Clothing Line' : std.lifeSkill;
        if (skill) {
            counts[skill] = (counts[skill] || 0) + 1;
        }
    });
    return counts;
};

export const RegistrationPage: React.FC = () => {
    const [fullName, setFullName] = useState('');
    const [jenisKelamin, setJenisKelamin] = useState<Gender | ''>('');
    const [classLevel, setClassLevel] = useState<ClassLevel | ''>('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [lifeSkill, setLifeSkill] = useState<LifeSkill | ''>('');
    const [loading, setLoading] = useState(false);
    const [quotaCounts, setQuotaCounts] = useState<Record<string, number>>(calculateLocalQuotaCounts);
    const [isQuotaLoading, setIsQuotaLoading] = useState(false);
    const [lastUpdatedTime, setLastUpdatedTime] = useState<Date>(new Date());
    const formRef = useRef<HTMLFormElement>(null);

    const totalCapacity = (Object.values(LIFE_SKILL_QUOTAS) as number[]).reduce((acc: number, q: number) => acc + q, 0);
    const totalRegistered = (Object.values(quotaCounts) as number[]).reduce((acc: number, c: number) => acc + c, 0);
    const totalPercentage = Math.min(100, Math.round((totalRegistered / (totalCapacity || 1)) * 100));

    const fetchQuotaStatus = useCallback(async () => {
        setIsQuotaLoading(true);
        try {
            const response = await fetch(QUOTA_API_URL, { cache: 'no-store' });
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    const counts: Record<string, number> = {};
                    data.forEach((item: any) => {
                        const skillName = item.skill === 'Tata Busana' ? 'Clothing Line' : item.skill;
                        counts[skillName] = (counts[skillName] || 0) + (item.registered ?? item.count ?? 0);
                    });
                    setQuotaCounts(counts);
                    setLastUpdatedTime(new Date());
                    return;
                }
            }
        } catch (e) {
            // Silently fallback to storage-based counts
        } finally {
            setIsQuotaLoading(false);
        }

        // Fallback: sync from local storage
        const localCounts = calculateLocalQuotaCounts();
        setQuotaCounts(localCounts);
        setLastUpdatedTime(new Date());
    }, []);

    useEffect(() => {
        fetchQuotaStatus();

        // 1. Listen for storage changes across tabs
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY) {
                setQuotaCounts(calculateLocalQuotaCounts());
                setLastUpdatedTime(new Date());
            }
        };

        // 2. Custom in-app event for instant updates within same page/tab
        const handleCustomUpdate = () => {
            setQuotaCounts(calculateLocalQuotaCounts());
            setLastUpdatedTime(new Date());
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('manusa_data_updated', handleCustomUpdate);

        // 3. Periodic real-time poll every 4 seconds to catch background registrations
        const intervalId = setInterval(() => {
            fetchQuotaStatus();
        }, 4000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('manusa_data_updated', handleCustomUpdate);
            clearInterval(intervalId);
        };
    }, [fetchQuotaStatus]);

    const resetForm = () => {
        setFullName('');
        setJenisKelamin('');
        setClassLevel('');
        setWhatsappNumber('');
        setLifeSkill('');
    };

    const getRemainingQuota = (skill: LifeSkill) => {
        const quota = LIFE_SKILL_QUOTAS[skill] || 0;
        const registered = quotaCounts[skill] || 0;
        return Math.max(0, quota - registered);
    };

    const isSkillFull = (skill: LifeSkill) => {
        const quota = LIFE_SKILL_QUOTAS[skill] || 0;
        return (quotaCounts[skill] || 0) >= quota;
    };

    const handleSelectSkillCard = (skill: LifeSkill) => {
        if (isSkillFull(skill)) {
            Swal.fire({
                icon: 'warning',
                title: 'Kuota Penuh',
                text: `Program ${skill} sudah penuh (${LIFE_SKILL_QUOTAS[skill]} siswa). Silakan pilih program lainnya.`,
                confirmButtonColor: '#4f46e5',
            });
            return;
        }

        setLifeSkill(skill);

        // Smooth scroll to form on mobile
        if (formRef.current) {
            formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName || !jenisKelamin || !classLevel || !whatsappNumber || !lifeSkill) {
            Swal.fire({
                icon: 'error',
                title: 'Data Belum Lengkap',
                text: 'Mohon pastikan semua kolom telah diisi dengan benar.',
                confirmButtonColor: '#4f46e5',
            });
            return;
        }

        const trimmedName = fullName.trim();
        const trimmedClass = classLevel.trim();
        const trimmedWhatsapp = whatsappNumber.trim();

        if (isSkillFull(lifeSkill)) {
            Swal.fire({
                icon: 'warning',
                title: 'Kuota Penuh',
                text: `Mohon maaf, kuota untuk program Life Skill "${lifeSkill}" sudah terpenuhi (${LIFE_SKILL_QUOTAS[lifeSkill]} kuota). Silakan pilih program Life Skill lain yang masih tersedia.`,
                confirmButtonColor: '#4f46e5',
            });
            return;
        }

        // 1. Check duplicate registration locally (same name and class)
        let currentStudents: Student[] = [];
        try {
            const existingStr = localStorage.getItem(STORAGE_KEY);
            if (existingStr) {
                currentStudents = JSON.parse(existingStr);
            }
        } catch (e) {
            console.error('Failed reading existing students:', e);
        }

        const duplicateInLocal = currentStudents.find(
            s => s && s.fullName && s.classLevel &&
                 s.fullName.trim().toLowerCase() === trimmedName.toLowerCase() &&
                 s.classLevel.trim() === trimmedClass
        );

        if (duplicateInLocal) {
            Swal.fire({
                icon: 'warning',
                title: 'Pendaftaran Ditolak (Data Ganda)',
                html: `
                    <div style="text-align: center; font-size: 14px; color: #334155;">
                        <p style="margin-bottom: 8px;">
                            Siswa atas nama <b>${trimmedName}</b> dari kelas <b>${trimmedClass}</b> sudah pernah terdaftar pada program <b>${duplicateInLocal.lifeSkill}</b>.
                        </p>
                        <p style="color: #64748b; font-size: 13px;">
                            Setiap siswa hanya diperbolehkan mendaftar <b>1 (satu) kali</b> agar tidak terjadi data ganda.
                        </p>
                    </div>
                `,
                confirmButtonColor: '#4f46e5',
            });
            return;
        }

        setLoading(true);

        let registeredStudent: Student = {
            id: 'std-' + Date.now(),
            fullName: trimmedName,
            jenisKelamin,
            classLevel: trimmedClass as ClassLevel,
            whatsappNumber: trimmedWhatsapp,
            lifeSkill,
            createdAt: new Date().toISOString(),
        };

        try {
            // 2. Submit to backend API
            let isApiError = false;
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fullName: trimmedName,
                        jenisKelamin,
                        classLevel: trimmedClass,
                        whatsappNumber: trimmedWhatsapp,
                        lifeSkill,
                    }),
                });

                if (!response.ok) {
                    isApiError = true;
                    const errData = await response.json().catch(() => ({}));
                    const errMsg = errData.message || 'Tidak dapat menyimpan pendaftaran.';
                    Swal.fire({
                        icon: 'error',
                        title: 'Pendaftaran Ditolak',
                        html: `<p style="font-size: 14px; color: #334155;">${errMsg}</p>`,
                        confirmButtonColor: '#d33',
                    });
                    setLoading(false);
                    return;
                }

                const result = await response.json();
                if (result && result.id) {
                    registeredStudent = result;
                }
            } catch (apiErr) {
                console.warn('Backend API unavailable, continuing with verified local registration:', apiErr);
            }

            if (isApiError) return;

            // 3. Save to local storage for instantaneous synchronization
            try {
                const updatedList = [registeredStudent, ...currentStudents.filter(s => s.id !== registeredStudent.id)];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
                window.dispatchEvent(new Event('manusa_data_updated'));
            } catch (err) {
                console.error('Failed to save to localStorage:', err);
            }

            // 4. Update real-time quota state
            setQuotaCounts(prev => ({
                ...prev,
                [lifeSkill]: (prev[lifeSkill] || 0) + 1
            }));
            setLastUpdatedTime(new Date());

            Swal.fire({
                icon: 'success',
                title: 'Pendaftaran Berhasil!',
                html: `
                    <div style="text-align: center;">
                        <p style="font-size: 15px; color: #1e293b; margin-bottom: 6px;">
                            Terima kasih <b>${trimmedName}</b> (${trimmedClass})!
                        </p>
                        <p style="font-size: 13px; color: #475569;">
                            Data Anda untuk program <b>"${lifeSkill}"</b> telah berhasil disimpan dan kuota otomatis terperbarui.
                        </p>
                    </div>
                `,
                confirmButtonColor: '#10b981',
            });

            resetForm();

        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Pendaftaran Gagal',
                text: error.message || 'Tidak dapat menyimpan pendaftaran. Silakan coba lagi.',
                confirmButtonColor: '#d33',
            });
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start p-2.5 sm:p-4 md:p-6 selection:bg-indigo-500 selection:text-white">
            {/* Top Bar for Mobile & Desktop */}
            <div className="w-full max-w-3xl flex items-center justify-between py-2 px-1 mb-2">
                <div className="flex items-center gap-2">
                    <img src={APP_LOGO} alt="MA NU 01 Banyuputih" className="h-7 w-7 object-contain" referrerPolicy="no-referrer" />
                    <span className="text-xs sm:text-sm font-bold text-slate-700 tracking-tight">
                        MA NU 01 BANYUPUTIH
                    </span>
                </div>
                <Link
                    to="/login"
                    className="text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 active:scale-95 touch-manipulation"
                >
                    <i className="fa-solid fa-lock text-indigo-600 text-xs"></i>
                    <span>Admin</span>
                </Link>
            </div>

            {/* Main Card Container */}
            <div className="w-full max-w-3xl bg-white rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl overflow-hidden border border-slate-200/80">
                {/* Header Banner - Responsive for Small Screens */}
                <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 px-4 py-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="absolute -left-10 -top-10 w-36 h-36 bg-indigo-400/20 rounded-full blur-xl pointer-events-none"></div>
                    
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-indigo-100 text-[11px] font-medium backdrop-blur-sm mb-3 border border-white/20">
                        <i className="fa-solid fa-graduation-cap text-amber-300"></i>
                        <span>Tahun Pelajaran 2026 / 2027</span>
                    </div>

                    <img
                        src={APP_LOGO}
                        alt="Logo MA NU 01 Banyuputih"
                        className="h-16 w-16 sm:h-20 sm:w-20 mb-2.5 object-contain drop-shadow-md"
                        referrerPolicy="no-referrer"
                    />
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                        Formulir Pendaftaran Life Skill
                    </h1>
                    <p className="text-indigo-100 mt-1 text-xs sm:text-sm font-medium">
                        MA NU 01 Banyuputih Batang
                    </p>
                </div>

                {/* Quota Section - Optimized for Touch & Mobile 2-Column Grid */}
                <div className="p-3.5 sm:p-6 bg-slate-50/90 border-b border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 sm:mb-4">
                        <div>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-100 text-indigo-700 text-xs sm:text-sm shrink-0">
                                    <i className="fa-solid fa-chart-pie"></i>
                                </span>
                                <h2 className="text-xs sm:text-base font-bold text-slate-800 tracking-tight">
                                    INFORMASI KUOTA PENDAFTARAN
                                </h2>
                                <span className="relative flex h-2 w-2 ml-1" title="Real-time live sync aktif">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 ml-7.5 sm:ml-9">
                                Klik / ketuk kartu di bawah untuk memilih langsung program pilihanmu.
                            </p>
                        </div>

                        {/* Overall Capacity Pill */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                            <div className="text-left sm:text-right">
                                <div className="text-[10px] text-slate-500 font-medium leading-none">Total Terisi</div>
                                <div className="text-xs font-bold text-indigo-700 mt-0.5">
                                    {totalRegistered} <span className="text-slate-400 font-normal">/ {totalCapacity} Siswa</span>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center font-extrabold text-[11px] text-indigo-600 shrink-0">
                                {totalPercentage}%
                            </div>
                        </div>
                    </div>

                    {/* Overall Progress Bar */}
                    <div className="w-full bg-slate-200/80 rounded-full h-2 sm:h-2.5 mb-3 sm:mb-4 overflow-hidden shadow-inner">
                        <div
                            className="bg-gradient-to-r from-indigo-600 to-indigo-500 h-full rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${totalPercentage}%` }}
                        ></div>
                    </div>

                    {/* 6 Life Skill Progress Cards - Mobile-first 2 columns */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                        {LIFE_SKILL_OPTIONS.map((skill) => {
                            const quota = LIFE_SKILL_QUOTAS[skill];
                            const registered = quotaCounts[skill] || 0;
                            const remaining = getRemainingQuota(skill);
                            const isFull = isSkillFull(skill);
                            const percent = Math.min(100, Math.round((registered / (quota || 1)) * 100));
                            const skillMeta = SKILL_ICONS[skill] || { icon: 'fa-star', bg: 'bg-indigo-100', text: 'text-indigo-600' };

                            // Dynamic color based on capacity percentage
                            let barColor = 'bg-indigo-600';
                            let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                            let statusText = `Sisa ${remaining}`;

                            if (isFull) {
                                barColor = 'bg-rose-500';
                                badgeClass = 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
                                statusText = 'PENUH';
                            } else if (percent >= 75) {
                                barColor = 'bg-amber-500';
                                badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                                statusText = `Sisa ${remaining}`;
                            }

                            const isSelected = lifeSkill === skill;

                            return (
                                <button
                                    type="button"
                                    key={skill}
                                    onClick={() => handleSelectSkillCard(skill)}
                                    className={`p-2.5 sm:p-3.5 rounded-xl border text-left transition-all duration-200 relative flex flex-col justify-between select-none touch-manipulation active:scale-[0.97] min-h-[92px] ${
                                        isFull
                                            ? 'bg-rose-50/40 border-rose-200 opacity-90 cursor-not-allowed'
                                            : isSelected
                                            ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-400/30 shadow-sm cursor-pointer'
                                            : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs cursor-pointer'
                                    }`}
                                >
                                    <div className="w-full">
                                        <div className="flex items-center justify-between gap-1 mb-1.5">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span className={`w-5 h-5 rounded-md ${skillMeta.bg} ${skillMeta.text} flex items-center justify-center text-[10px] shrink-0`}>
                                                    <i className={`fa-solid ${skillMeta.icon}`}></i>
                                                </span>
                                                <div className="font-bold text-[11px] sm:text-xs text-slate-800 truncate" title={skill}>
                                                    {skill}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 mb-1">
                                            <span>
                                                Terisi: <strong className="text-slate-800">{registered}</strong>/{quota}
                                            </span>
                                            <span className={`px-1.5 py-0.5 rounded-full border text-[9px] sm:text-[10px] font-bold ${badgeClass}`}>
                                                {statusText}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Mini Real-time Progress Bar */}
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/60 mt-1">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
                                            style={{ width: `${percent}%` }}
                                        ></div>
                                    </div>

                                    {isSelected && !isFull && (
                                        <div className="mt-1 text-[9px] sm:text-[10px] font-bold text-indigo-600 flex items-center gap-1">
                                            <i className="fa-solid fa-circle-check text-emerald-500"></i> Dipilih
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Registration Form - Mobile Optimized Inputs */}
                <form ref={formRef} onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-4 sm:space-y-5">
                    {/* Full Name */}
                    <div>
                        <label htmlFor="fullName" className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                            Nama Lengkap Siswa <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 text-sm">
                                <i className="fa-solid fa-user"></i>
                            </span>
                            <input
                                type="text"
                                id="fullName"
                                inputMode="text"
                                autoCapitalize="characters"
                                autoComplete="name"
                                spellCheck="false"
                                value={fullName}
                                onInput={(e) => setFullName((e.target as HTMLInputElement).value.toUpperCase())}
                                className="w-full pl-10 pr-4 py-3 sm:py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-xs text-base sm:text-sm font-medium"
                                placeholder="Contoh: AHMAD FAUZI"
                                required
                            />
                        </div>
                    </div>

                    {/* Gender Segmented Tap Buttons (Mobile Thumb Friendly) */}
                    <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                            Jenis Kelamin <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                            <button
                                type="button"
                                onClick={() => setJenisKelamin('Laki-laki')}
                                className={`py-3 px-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition-all touch-manipulation min-h-[48px] active:scale-[0.98] ${
                                    jenisKelamin === 'Laki-laki'
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                        : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-300 hover:bg-slate-50'
                                }`}
                            >
                                <i className="fa-solid fa-mars text-base"></i>
                                <span>Laki-laki</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setJenisKelamin('Perempuan')}
                                className={`py-3 px-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition-all touch-manipulation min-h-[48px] active:scale-[0.98] ${
                                    jenisKelamin === 'Perempuan'
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                        : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-300 hover:bg-slate-50'
                                }`}
                            >
                                <i className="fa-solid fa-venus text-base"></i>
                                <span>Perempuan</span>
                            </button>
                        </div>
                    </div>

                    {/* Class & WhatsApp in Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label htmlFor="classLevel" className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                                Kelas <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 text-sm">
                                    <i className="fa-solid fa-school"></i>
                                </span>
                                <select
                                    id="classLevel"
                                    value={classLevel}
                                    onChange={(e) => setClassLevel(e.target.value as ClassLevel)}
                                    className="w-full pl-10 pr-8 py-3 sm:py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-xs text-base sm:text-sm font-medium appearance-none cursor-pointer"
                                    required
                                >
                                    <option value="" disabled>Pilih Kelas</option>
                                    {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400 text-xs">
                                    <i className="fa-solid fa-chevron-down"></i>
                                </span>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="whatsappNumber" className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                                Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-emerald-600 text-sm">
                                    <i className="fa-brands fa-whatsapp font-bold"></i>
                                </span>
                                <input
                                    type="tel"
                                    id="whatsappNumber"
                                    inputMode="tel"
                                    autoComplete="tel"
                                    value={whatsappNumber}
                                    onChange={(e) => setWhatsappNumber(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 sm:py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-xs text-base sm:text-sm font-medium"
                                    placeholder="081234567890"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Program Life Skill Dropdown */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label htmlFor="lifeSkill" className="block text-xs sm:text-sm font-bold text-slate-700">
                                Pilihan Program Life Skill <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                                <i className="fa-solid fa-bolt text-amber-500"></i> Kuota Live
                            </span>
                        </div>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 text-sm">
                                <i className="fa-solid fa-award"></i>
                            </span>
                            <select
                                id="lifeSkill"
                                value={lifeSkill}
                                onChange={(e) => setLifeSkill(e.target.value as LifeSkill)}
                                className="w-full pl-10 pr-8 py-3 sm:py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-xs text-base sm:text-sm font-medium appearance-none cursor-pointer"
                                required
                            >
                                <option value="" disabled>Pilih Program Life Skill</option>
                                {LIFE_SKILL_OPTIONS.map(ls => {
                                    const quota = LIFE_SKILL_QUOTAS[ls];
                                    const isFull = isSkillFull(ls);
                                    const remaining = getRemainingQuota(ls);
                                    const registered = quotaCounts[ls] || 0;
                                    const statusSuffix = isFull
                                        ? ` - [PENUH (${registered}/${quota})]`
                                        : ` (${registered}/${quota} - Sisa ${remaining})`;

                                    return (
                                        <option key={ls} value={ls} disabled={isFull}>
                                            {ls} {statusSuffix}
                                        </option>
                                    );
                                })}
                            </select>
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400 text-xs">
                                <i className="fa-solid fa-chevron-down"></i>
                            </span>
                        </div>

                        {lifeSkill && (
                            <div className="mt-2.5 p-3 rounded-xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-between">
                                <div className="text-xs text-indigo-900 flex items-center gap-2">
                                    <i className="fa-solid fa-circle-check text-emerald-500 text-sm"></i>
                                    <span>Program: <strong>{lifeSkill}</strong></span>
                                </div>
                                <div className="text-xs font-bold text-indigo-700">
                                    Sisa {getRemainingQuota(lifeSkill)} kursi
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || (lifeSkill ? isSkillFull(lifeSkill) : false)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold py-3.5 sm:py-4 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-md hover:shadow-indigo-500/25 active:scale-[0.98] disabled:from-indigo-300 disabled:to-indigo-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base touch-manipulation min-h-[52px]"
                    >
                        {loading ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin text-lg"></i>
                                <span>Menyimpan Pendaftaran...</span>
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-paper-plane text-base"></i>
                                <span>Kirim Pendaftaran Sekarang</span>
                            </>
                        )}
                    </button>

                    <p className="text-[11px] text-center text-slate-400">
                        Pastikan seluruh data yang dimasukkan sudah benar sebelum mengirim.
                    </p>
                </form>
            </div>
            
            <footer className="text-center py-4 text-xs text-slate-500 mt-2">
                &copy; {new Date().getFullYear()} MA NU 01 Banyuputih. All rights reserved.
            </footer>
        </div>
    );
};
