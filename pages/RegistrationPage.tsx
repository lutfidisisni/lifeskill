import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LIFE_SKILL_OPTIONS, CLASS_OPTIONS } from '../constants';
import type { LifeSkill, ClassLevel, Gender } from '../types';

declare const Swal: any;

const API_URL = 'https://apils.manubanyuputih.id/api/register';

export const RegistrationPage: React.FC = () => {
    const [fullName, setFullName] = useState('');
    const [jenisKelamin, setJenisKelamin] = useState<Gender | ''>('');
    const [classLevel, setClassLevel] = useState<ClassLevel | ''>('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [lifeSkill, setLifeSkill] = useState<LifeSkill | ''>('');
    const [loading, setLoading] = useState(false);

    const resetForm = () => {
        setFullName('');
        setJenisKelamin('');
        setClassLevel('');
        setWhatsappNumber('');
        setLifeSkill('');
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

        setLoading(true);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName,
                    jenisKelamin,
                    classLevel,
                    whatsappNumber,
                    lifeSkill,
                }),
            });

            if (!response.ok) {
                let errorMessage = 'Terjadi kesalahan saat pendaftaran.';
                 try {
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.includes("application/json")) {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    } else {
                        const errorText = await response.text();
                        console.error("Server returned non-JSON response:", errorText);
                        errorMessage = `Terjadi kesalahan pada server (status: ${response.status}). Coba lagi nanti.`;
                    }
                 } catch (parseError) {
                    console.error("Could not process error response:", parseError);
                    errorMessage = `Gagal memproses respons dari server.`;
                 }
                throw new Error(errorMessage);
            }
            
            Swal.fire({
                icon: 'success',
                title: 'Pendaftaran Berhasil!',
                text: 'Terima kasih, data Anda telah berhasil kami simpan.',
                confirmButtonColor: '#10b981',
            });
            resetForm();

        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Pendaftaran Gagal',
                text: error.message || 'Tidak dapat terhubung ke server. Silakan coba lagi nanti.',
                confirmButtonColor: '#d33',
            });
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
            <div className="absolute top-4 right-4 print-hidden">
                <Link to="/login" className="text-sm font-medium text-slate-700 bg-white hover:bg-slate-200/50 px-4 py-2 rounded-lg shadow-sm transition-colors">
                    Admin Login
                </Link>
            </div>
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in-up">
                <div className="bg-indigo-600 p-8 flex flex-col items-center text-center">
                    <img src="https://manubanyuputih.id/wp-content/uploads/2020/05/cropped-logo-manu-baru-1.png" alt="Logo MA NU 01 Banyuputih" className="h-20 w-20 mb-4" />
                    <h1 className="text-3xl font-bold text-white">Formulir Pendaftaran Life Skill</h1>
                    <p className="text-indigo-200 mt-2 text-3xl font-bold">MA NU 01 Banyuputih</p>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                        <input
                            type="text"
                            id="fullName"
                            value={fullName}
                            onInput={(e) => setFullName((e.target as HTMLInputElement).value.toUpperCase())}
                            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            placeholder="Contoh: AHMAD FAUZI"
                            required
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Jenis Kelamin</label>
                        <div className="flex gap-x-6">
                             <label className="flex items-center cursor-pointer">
                                <input type="radio" name="jenisKelamin" value="Laki-laki" checked={jenisKelamin === 'Laki-laki'} onChange={(e) => setJenisKelamin(e.target.value as Gender)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                                <span className="ml-2 text-sm text-slate-800">Laki-laki</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input type="radio" name="jenisKelamin" value="Perempuan" checked={jenisKelamin === 'Perempuan'} onChange={(e) => setJenisKelamin(e.target.value as Gender)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                                <span className="ml-2 text-sm text-slate-800">Perempuan</span>
                            </label>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="classLevel" className="block text-sm font-medium text-slate-700 mb-1">Kelas</label>
                        <select id="classLevel" value={classLevel} onChange={(e) => setClassLevel(e.target.value as ClassLevel)} className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition">
                            <option value="" disabled>Pilih Kelas</option>
                            {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="whatsappNumber" className="block text-sm font-medium text-slate-700 mb-1">Nomor WhatsApp</label>
                        <input
                            type="tel"
                            id="whatsappNumber"
                            value={whatsappNumber}
                            onChange={(e) => setWhatsappNumber(e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            placeholder="Contoh: 081234567890"
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="lifeSkill" className="block text-sm font-medium text-slate-700 mb-1">Pilihan Life Skill</label>
                        <select id="lifeSkill" value={lifeSkill} onChange={(e) => setLifeSkill(e.target.value as LifeSkill)} className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition">
                            <option value="" disabled>Pilih Life Skill</option>
                            {LIFE_SKILL_OPTIONS.map(ls => <option key={ls} value={ls}>{ls}</option>)}
                        </select>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 disabled:bg-indigo-400 disabled:cursor-not-allowed">
                        {loading ? 'Memproses...' : 'Kirim Pendaftaran'}
                    </button>
                </form>
            </div>
             <footer className="text-center py-6 text-sm text-slate-500 mt-4">
                &copy; {new Date().getFullYear()} MA NU 01 Banyuputih. All rights reserved.
            </footer>
        </div>
    );
};