import React, { useState, useEffect } from 'react';
import type { Student, ClassLevel, LifeSkill, Gender } from '../types';
import { CLASS_OPTIONS, LIFE_SKILL_OPTIONS, LIFE_SKILL_QUOTAS } from '../constants';

interface StudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (student: Omit<Student, 'id'> | Student) => void;
    studentToEdit?: Student | null;
}

export const StudentModal: React.FC<StudentModalProps> = ({ isOpen, onClose, onSave, studentToEdit }) => {
    const [nis, setNis] = useState('');
    const [fullName, setFullName] = useState('');
    const [classLevel, setClassLevel] = useState<ClassLevel | ''>('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [lifeSkill, setLifeSkill] = useState<LifeSkill | ''>('');
    const [jenisKelamin, setJenisKelamin] = useState<Gender | ''>('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (studentToEdit) {
            setNis(studentToEdit.nis || '');
            setFullName(studentToEdit.fullName || '');
            setJenisKelamin(studentToEdit.jenisKelamin || '');
            setClassLevel(studentToEdit.classLevel || '');
            setWhatsappNumber(studentToEdit.whatsappNumber || '');
            setLifeSkill(studentToEdit.lifeSkill || '');
        } else {
            setNis('');
            setFullName('');
            setJenisKelamin('');
            setClassLevel('');
            setWhatsappNumber('');
            setLifeSkill('');
        }
        setErrors({});
    }, [studentToEdit, isOpen]);

    if (!isOpen) return null;

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!nis.trim()) newErrors.nis = "NIS (Nomor Induk Siswa) wajib diisi.";
        if (!fullName.trim()) newErrors.fullName = "Nama Lengkap wajib diisi.";
        if (!jenisKelamin) newErrors.jenisKelamin = "Jenis Kelamin wajib dipilih.";
        if (!classLevel) newErrors.classLevel = "Kelas wajib dipilih.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        const studentData = { 
            nis: nis.trim(),
            fullName: fullName.trim(), 
            jenisKelamin: jenisKelamin as Gender, 
            classLevel: classLevel as ClassLevel, 
            whatsappNumber: whatsappNumber.trim(), 
            lifeSkill: (lifeSkill ? (lifeSkill as LifeSkill) : null) as any
        };

        if (studentToEdit) {
            onSave({ ...studentData, id: studentToEdit.id });
        } else {
            onSave(studentData);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 transition-opacity animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/80">
                    <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">
                            <i className="fa-solid fa-user-graduate"></i>
                        </span>
                        <h2 className="text-lg font-bold text-slate-800">
                            {studentToEdit ? 'Ubah Data Siswa Master' : 'Tambah Siswa Master Baru'}
                        </h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
                    >
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* NIS */}
                    <div>
                        <label htmlFor="modalNis" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            NIS (Nomor Induk Siswa) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 text-sm">
                                <i className="fa-solid fa-id-card"></i>
                            </span>
                            <input 
                                type="text" 
                                id="modalNis" 
                                value={nis} 
                                onChange={(e) => setNis(e.target.value)} 
                                placeholder="Contoh: 202411001"
                                className={`w-full pl-9 pr-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-indigo-500 ${errors.nis ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'}`} 
                            />
                        </div>
                        {errors.nis && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.nis}</p>}
                    </div>

                    {/* Full Name */}
                    <div>
                        <label htmlFor="modalFullName" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Nama Lengkap Siswa <span className="text-rose-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="modalFullName" 
                            value={fullName} 
                            onInput={(e) => setFullName((e.target as HTMLInputElement).value.toUpperCase())} 
                            placeholder="Contoh: AHMAD FAUZI RIDWAN"
                            className={`w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-indigo-500 ${errors.fullName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'}`} 
                        />
                        {errors.fullName && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.fullName}</p>}
                    </div>

                    {/* Gender & Class */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Jenis Kelamin <span className="text-rose-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                <button
                                    type="button"
                                    onClick={() => setJenisKelamin('Laki-laki')}
                                    className={`py-2 px-2 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                                        jenisKelamin === 'Laki-laki'
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                    <i className="fa-solid fa-mars"></i> Laki-laki
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setJenisKelamin('Perempuan')}
                                    className={`py-2 px-2 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                                        jenisKelamin === 'Perempuan'
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                    <i className="fa-solid fa-venus"></i> Perempuan
                                </button>
                            </div>
                            {errors.jenisKelamin && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.jenisKelamin}</p>}
                        </div>

                        <div>
                            <label htmlFor="modalClassLevel" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Kelas <span className="text-rose-500">*</span>
                            </label>
                            <select 
                                id="modalClassLevel" 
                                value={classLevel} 
                                onChange={(e) => setClassLevel(e.target.value as ClassLevel)} 
                                className={`w-full px-3 py-2 text-sm border rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 ${errors.classLevel ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'}`}
                            >
                                <option value="" disabled>Pilih Kelas</option>
                                {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {errors.classLevel && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.classLevel}</p>}
                        </div>
                    </div>

                    {/* WhatsApp */}
                    <div>
                        <label htmlFor="modalWhatsapp" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Nomor WhatsApp (Opsional)
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-emerald-600 text-sm">
                                <i className="fa-brands fa-whatsapp"></i>
                            </span>
                            <input 
                                type="text" 
                                id="modalWhatsapp" 
                                value={whatsappNumber} 
                                onChange={(e) => setWhatsappNumber(e.target.value)} 
                                placeholder="081234567890"
                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500" 
                            />
                        </div>
                    </div>

                    {/* Life Skill (Can be null or set) */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label htmlFor="modalLifeSkill" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Pilihan Life Skill
                            </label>
                            <span className="text-[11px] text-slate-400">
                                Kosongkan jika siswa belum memilih
                            </span>
                        </div>
                        <select 
                            id="modalLifeSkill" 
                            value={lifeSkill} 
                            onChange={(e) => setLifeSkill(e.target.value as LifeSkill)} 
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">-- Belum Memilih (Status Menunggu Siswa) --</option>
                            {LIFE_SKILL_OPTIONS.map(ls => (
                                <option key={ls} value={ls}>
                                    {ls} (Kuota: {LIFE_SKILL_QUOTAS[ls]})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                        >
                            Batal
                        </button>
                        <button 
                            type="submit" 
                            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                        >
                            <i className="fa-solid fa-check"></i>
                            <span>{studentToEdit ? 'Simpan Perubahan' : 'Simpan Data Siswa'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
