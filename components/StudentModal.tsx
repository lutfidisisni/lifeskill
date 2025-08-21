import React, { useState, useEffect } from 'react';
import type { Student, ClassLevel, LifeSkill, Gender } from '../types';
import { CLASS_OPTIONS, LIFE_SKILL_OPTIONS } from '../constants';

interface StudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (student: Omit<Student, 'id'> | Student) => void;
    studentToEdit?: Student | null;
}

export const StudentModal: React.FC<StudentModalProps> = ({ isOpen, onClose, onSave, studentToEdit }) => {
    const [fullName, setFullName] = useState('');
    const [classLevel, setClassLevel] = useState<ClassLevel | ''>('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [lifeSkill, setLifeSkill] = useState<LifeSkill | ''>('');
    const [jenisKelamin, setJenisKelamin] = useState<Gender | ''>('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (studentToEdit) {
            setFullName(studentToEdit.fullName);
            setJenisKelamin(studentToEdit.jenisKelamin);
            setClassLevel(studentToEdit.classLevel);
            setWhatsappNumber(studentToEdit.whatsappNumber);
            setLifeSkill(studentToEdit.lifeSkill || '');
        } else {
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
        if (!fullName) newErrors.fullName = "Nama Lengkap wajib diisi.";
        if (!jenisKelamin) newErrors.jenisKelamin = "Jenis Kelamin wajib dipilih.";
        if (!classLevel) newErrors.classLevel = "Kelas wajib dipilih.";
        if (!whatsappNumber) newErrors.whatsappNumber = "Nomor WhatsApp wajib diisi.";
        if (!lifeSkill) newErrors.lifeSkill = "Life Skill wajib dipilih.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        const studentData = { fullName, jenisKelamin: jenisKelamin as Gender, classLevel: classLevel as ClassLevel, whatsappNumber, lifeSkill: lifeSkill as LifeSkill };

        if (studentToEdit) {
            onSave({ ...studentData, id: studentToEdit.id });
        } else {
            onSave(studentData);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 transition-opacity animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 m-4 animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b">
                    <h2 className="text-2xl font-bold text-slate-800">{studentToEdit ? 'Ubah Data Siswa' : 'Tambah Siswa Baru'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="modalFullName" className="block text-sm font-medium text-slate-700">Nama Lengkap</label>
                        <input type="text" id="modalFullName" value={fullName} onInput={(e) => setFullName((e.target as HTMLInputElement).value.toUpperCase())} className={`mt-1 w-full px-3 py-2 border ${errors.fullName ? 'border-red-500' : 'border-slate-300'} rounded-md focus:ring-2 focus:ring-indigo-500`} />
                        {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Jenis Kelamin</label>
                        <div className="flex gap-x-6 mt-2">
                             <label className="flex items-center cursor-pointer">
                                <input type="radio" name="modalJenisKelamin" value="Laki-laki" checked={jenisKelamin === 'Laki-laki'} onChange={(e) => setJenisKelamin(e.target.value as Gender)} className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 ${errors.jenisKelamin ? 'border-red-500' : 'border-slate-300'}`} />
                                <span className="ml-2 text-sm text-slate-800">Laki-laki</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input type="radio" name="modalJenisKelamin" value="Perempuan" checked={jenisKelamin === 'Perempuan'} onChange={(e) => setJenisKelamin(e.target.value as Gender)} className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 ${errors.jenisKelamin ? 'border-red-500' : 'border-slate-300'}`} />
                                <span className="ml-2 text-sm text-slate-800">Perempuan</span>
                            </label>
                        </div>
                        {errors.jenisKelamin && <p className="text-red-500 text-xs mt-1">{errors.jenisKelamin}</p>}
                    </div>
                    <div>
                        <label htmlFor="modalClassLevel" className="block text-sm font-medium text-slate-700">Kelas</label>
                        <select id="modalClassLevel" value={classLevel} onChange={(e) => setClassLevel(e.target.value as ClassLevel)} className={`mt-1 w-full px-3 py-2 border ${errors.classLevel ? 'border-red-500' : 'border-slate-300'} rounded-md bg-white focus:ring-2 focus:ring-indigo-500`}>
                            <option value="" disabled>Pilih Kelas</option>
                            {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                         {errors.classLevel && <p className="text-red-500 text-xs mt-1">{errors.classLevel}</p>}
                    </div>
                    <div>
                        <label htmlFor="modalWhatsapp" className="block text-sm font-medium text-slate-700">Nomor WhatsApp</label>
                        <input type="text" id="modalWhatsapp" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} className={`mt-1 w-full px-3 py-2 border ${errors.whatsappNumber ? 'border-red-500' : 'border-slate-300'} rounded-md focus:ring-2 focus:ring-indigo-500`} />
                         {errors.whatsappNumber && <p className="text-red-500 text-xs mt-1">{errors.whatsappNumber}</p>}
                    </div>
                    <div>
                        <label htmlFor="modalLifeSkill" className="block text-sm font-medium text-slate-700">Pilihan Life Skill</label>
                        <select id="modalLifeSkill" value={lifeSkill} onChange={(e) => setLifeSkill(e.target.value as LifeSkill)} className={`mt-1 w-full px-3 py-2 border ${errors.lifeSkill ? 'border-red-500' : 'border-slate-300'} rounded-md bg-white focus:ring-2 focus:ring-indigo-500`}>
                            <option value="" disabled>Pilih Life Skill</option>
                            {LIFE_SKILL_OPTIONS.map(ls => <option key={ls} value={ls}>{ls}</option>)}
                        </select>
                        {errors.lifeSkill && <p className="text-red-500 text-xs mt-1">{errors.lifeSkill}</p>}
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">{studentToEdit ? 'Simpan Perubahan' : 'Tambah Siswa'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};