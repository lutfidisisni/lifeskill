import React, { useState, useRef } from 'react';
import type { Student, ClassLevel, Gender } from '../types';
import { CLASS_OPTIONS } from '../constants';

declare const Swal: any;
declare const XLSX: any;

interface BulkImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportSuccess: (result: { inserted: number; updated: number }) => void;
    onBulkImport: (students: Omit<Student, 'id'>[]) => Promise<{ inserted: number; updated: number }>;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
    isOpen,
    onClose,
    onImportSuccess,
    onBulkImport,
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<Omit<Student, 'id'>[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [parseErrors, setParseErrors] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    // Standardize Gender
    const normalizeGender = (val: any): Gender => {
        if (!val) return 'Laki-laki';
        const str = String(val).trim().toUpperCase();
        if (str.startsWith('P') || str.includes('PEREMPUAN') || str.includes('WANITA') || str === 'F') {
            return 'Perempuan';
        }
        return 'Laki-laki';
    };

    // Standardize Class Level (maps XI.1 -> 11.1, XI-1 -> 11.1, 11-1 -> 11.1)
    const normalizeClass = (val: any): ClassLevel => {
        if (!val) return '11.1';
        let str = String(val).trim().toUpperCase();
        str = str.replace('XI.', '11.').replace('XI-', '11.').replace('XI ', '11.').replace('11-', '11.');
        if (!str.startsWith('11.')) {
            const numMatch = str.match(/\d+/);
            if (numMatch) {
                const subClass = numMatch[0];
                if (parseInt(subClass, 10) >= 1 && parseInt(subClass, 10) <= 8) {
                    str = `11.${subClass}`;
                }
            }
        }
        if (CLASS_OPTIONS.includes(str as ClassLevel)) {
            return str as ClassLevel;
        }
        return '11.1';
    };

    const handleDownloadTemplate = () => {
        if (typeof XLSX === 'undefined') {
            Swal.fire('Error', 'Library Excel (XLSX) sedang dimuat. Coba beberapa saat lagi.', 'error');
            return;
        }

        const templateData = [
            {
                'NIS': '202411001',
                'Nama Lengkap': 'AHMAD FAUZI RIDWAN',
                'Jenis Kelamin': 'Laki-laki',
                'Kelas': '11.1'
            },
            {
                'NIS': '202411002',
                'Nama Lengkap': 'SITI NUR AISYAH',
                'Jenis Kelamin': 'Perempuan',
                'Kelas': '11.1'
            },
            {
                'NIS': '202411003',
                'Nama Lengkap': 'MUHAMMAD RIZKY PRATAMA',
                'Jenis Kelamin': 'Laki-laki',
                'Kelas': '11.2'
            },
            {
                'NIS': '202411004',
                'Nama Lengkap': 'ANNISA RAHMAWATI',
                'Jenis Kelamin': 'Perempuan',
                'Kelas': '11.2'
            },
            {
                'NIS': '202411005',
                'Nama Lengkap': 'BUDI SANTOSO',
                'Jenis Kelamin': 'Laki-laki',
                'Kelas': '11.3'
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Data Siswa');

        // Column widths
        worksheet['!cols'] = [
            { wch: 15 }, // NIS
            { wch: 30 }, // Nama Lengkap
            { wch: 16 }, // Jenis Kelamin
            { wch: 10 }  // Kelas
        ];

        XLSX.writeFile(workbook, 'Template_Master_Data_Siswa_MANUSA.xlsx');
    };

    const processFile = (uploadedFile: File) => {
        if (typeof XLSX === 'undefined') {
            Swal.fire('Error', 'Library Excel (XLSX) tidak tersedia. Pastikan script cdnjs termuat.', 'error');
            return;
        }

        setIsParsing(true);
        setParseErrors([]);
        setFile(uploadedFile);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

                if (!rawRows || rawRows.length === 0) {
                    setParseErrors(['File Excel kosong atau tidak memiliki baris data.']);
                    setIsParsing(false);
                    return;
                }

                const studentsToImport: Omit<Student, 'id'>[] = [];
                const errors: string[] = [];
                const seenNIS = new Set<string>();

                rawRows.forEach((row, idx) => {
                    const rowNumber = idx + 2; // Excel row numbering
                    
                    // Column mapping search
                    let nis = '';
                    let fullName = '';
                    let genderRaw = '';
                    let classRaw = '';

                    for (const key of Object.keys(row)) {
                        const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                        const val = String(row[key]).trim();

                        if (cleanKey === 'nis' || cleanKey === 'nisn' || cleanKey.includes('nomorinduk') || cleanKey === 'noinduk') {
                            nis = val;
                        } else if (cleanKey.includes('nama') || cleanKey.includes('siswa') || cleanKey.includes('fullname')) {
                            fullName = val;
                        } else if (cleanKey.includes('kelamin') || cleanKey === 'jk' || cleanKey === 'gender' || cleanKey === 'lp') {
                            genderRaw = val;
                        } else if (cleanKey.includes('kelas') || cleanKey.includes('class') || cleanKey === 'rombel') {
                            classRaw = val;
                        }
                    }

                    // Fallback to position if column names differ
                    const values = Object.values(row);
                    if (!nis && values[0]) nis = String(values[0]).trim();
                    if (!fullName && values[1]) fullName = String(values[1]).trim();
                    if (!genderRaw && values[2]) genderRaw = String(values[2]).trim();
                    if (!classRaw && values[3]) classRaw = String(values[3]).trim();

                    if (!nis) {
                        errors.push(`Baris ${rowNumber}: Kolom NIS kosong.`);
                        return;
                    }
                    if (!fullName) {
                        errors.push(`Baris ${rowNumber}: Kolom Nama Siswa kosong.`);
                        return;
                    }

                    if (seenNIS.has(nis.toLowerCase())) {
                        errors.push(`Baris ${rowNumber}: NIS "${nis}" duplikat di dalam file.`);
                        return;
                    }

                    seenNIS.add(nis.toLowerCase());

                    studentsToImport.push({
                        nis,
                        fullName: fullName.toUpperCase(),
                        jenisKelamin: normalizeGender(genderRaw),
                        classLevel: normalizeClass(classRaw),
                        whatsappNumber: null, // Removed from template, only set during choice
                        lifeSkill: null, // Reset to not chosen yet
                        createdAt: new Date().toISOString(),
                    });
                });

                setParsedData(studentsToImport);
                setParseErrors(errors);
            } catch (err: any) {
                console.error('Failed to parse Excel file:', err);
                setParseErrors([`Gagal membaca file Excel: ${err.message}`]);
            } finally {
                setIsParsing(false);
            }
        };

        reader.readAsArrayBuffer(uploadedFile);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleConfirmImport = async () => {
        if (parsedData.length === 0) {
            Swal.fire('Error', 'Tidak ada data valid yang dapat diimpor.', 'error');
            return;
        }

        setIsImporting(true);
        try {
            const result = await onBulkImport(parsedData);
            onImportSuccess(result);
            onClose();

            Swal.fire({
                icon: 'success',
                title: 'Import Siswa Selesai!',
                html: `
                    <div style="text-align: center; font-size: 14px; color: #334155;">
                        <p style="margin-bottom: 8px;">
                            Berhasil mengimpor <b>${parsedData.length}</b> siswa ke Master Data:
                        </p>
                        <div style="display: inline-block; text-align: left; background: #f8fafc; padding: 10px 16px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px;">
                            <div>✨ Siswa Baru Ditambahkan: <b>${result.inserted}</b></div>
                            <div>🔄 Siswa Diperbarui: <b>${result.updated}</b></div>
                        </div>
                        <p style="color: #64748b; font-size: 12px; margin-top: 10px;">
                            Siswa kini dapat memasukkan NIS mereka di halaman pendaftaran untuk memilih Life Skill.
                        </p>
                    </div>
                `,
                confirmButtonColor: '#10b981',
            });
        } catch (err: any) {
            Swal.fire('Gagal Mengimpor', err.message || 'Terjadi kesalahan saat memproses data siswa.', 'error');
        } finally {
            setIsImporting(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setParsedData([]);
        setParseErrors([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center z-50 p-3 sm:p-4 transition-opacity animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-fade-in-up" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-base font-bold shadow-xs">
                            <i className="fa-solid fa-file-excel"></i>
                        </span>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
                                Upload & Import Master Data Siswa (Excel / CSV)
                            </h2>
                            <p className="text-xs text-slate-500">
                                Unggah data siswa resmi agar siswa cukup memasukkan NIS saat memilih Life Skill.
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
                    >
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>

                {/* Content Body */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-grow">
                    {/* Template Banner */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <span className="text-indigo-600 text-lg mt-0.5">
                                <i className="fa-solid fa-circle-info"></i>
                            </span>
                            <div className="text-xs text-slate-700">
                                <div className="font-bold text-slate-800 text-sm">Gunakan Format Template Resmi</div>
                                <div>Pastikan file Excel memiliki kolom: <strong>NIS, Nama Lengkap, Jenis Kelamin, Kelas, Nomor WhatsApp</strong>.</div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleDownloadTemplate}
                            className="px-3.5 py-2 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                        >
                            <i className="fa-solid fa-download"></i>
                            <span>Unduh Template Excel (.xlsx)</span>
                        </button>
                    </div>

                    {/* Drag & Drop File Zone */}
                    {!file && (
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/20 rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 group-hover:scale-110 flex items-center justify-center text-2xl transition-transform shadow-xs">
                                <i className="fa-solid fa-cloud-arrow-up"></i>
                            </div>
                            <div className="font-bold text-slate-800 text-sm sm:text-base">
                                Tarik & Letakkan File Excel Siswa di Sini
                            </div>
                            <div className="text-xs text-slate-500">
                                atau klik untuk memilih file dari komputer (.xlsx, .xls, .csv)
                            </div>
                        </div>
                    )}

                    {/* Parsing Spinner */}
                    {isParsing && (
                        <div className="py-8 flex flex-col items-center justify-center text-center gap-2 text-indigo-600">
                            <i className="fa-solid fa-circle-notch fa-spin text-3xl"></i>
                            <div className="text-xs font-semibold text-slate-700">Membaca dan memvalidasi file Excel...</div>
                        </div>
                    )}

                    {/* Parse Errors Summary */}
                    {parseErrors.length > 0 && (
                        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs space-y-1">
                            <div className="font-bold flex items-center gap-1.5 text-rose-700">
                                <i className="fa-solid fa-triangle-exclamation"></i>
                                <span>Peringatan / Catatan Baris File:</span>
                            </div>
                            <ul className="list-disc pl-5 space-y-0.5 max-h-28 overflow-y-auto">
                                {parseErrors.map((err, i) => (
                                    <li key={i}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Preview Table of Parsed Data */}
                    {parsedData.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                    <span>Pratinjau Data Siswa Terbaca:</span>
                                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                                        {parsedData.length} Siswa Siap Diimpor
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
                                >
                                    <i className="fa-solid fa-rotate-left"></i>
                                    <span>Ganti File</span>
                                </button>
                            </div>

                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner max-h-72 overflow-y-auto bg-white">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold sticky top-0 border-b border-slate-200">
                                        <tr>
                                            <th className="py-2.5 px-3">No</th>
                                            <th className="py-2.5 px-3">NIS</th>
                                            <th className="py-2.5 px-3">Nama Lengkap</th>
                                            <th className="py-2.5 px-3">Jenis Kelamin</th>
                                            <th className="py-2.5 px-3">Kelas</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {parsedData.map((std, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="py-2 px-3 text-slate-500 font-medium">{idx + 1}</td>
                                                <td className="py-2 px-3 font-mono font-bold text-indigo-700">{std.nis}</td>
                                                <td className="py-2 px-3 font-semibold text-slate-800">{std.fullName}</td>
                                                <td className="py-2 px-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        std.jenisKelamin === 'Laki-laki' 
                                                            ? 'bg-blue-50 text-blue-700' 
                                                            : 'bg-rose-50 text-rose-700'
                                                    }`}>
                                                        {std.jenisKelamin}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3">
                                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                                                        {std.classLevel}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
                    <div className="text-xs text-slate-500">
                        {parsedData.length > 0 ? (
                            <span>File: <strong>{file?.name}</strong></span>
                        ) : (
                            <span>Mendukung file Excel format .xlsx, .xls, .csv</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-200/80 hover:bg-slate-300 rounded-xl transition-colors"
                        >
                            Tutup
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmImport}
                            disabled={parsedData.length === 0 || isImporting}
                            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                        >
                            {isImporting ? (
                                <>
                                    <i className="fa-solid fa-spinner fa-spin"></i>
                                    <span>Menyimpan ke Master Data...</span>
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-cloud-arrow-up"></i>
                                    <span>Impor {parsedData.length} Siswa Sekarang</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
