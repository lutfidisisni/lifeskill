import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { APP_LOGO } from '../constants';

declare const Swal: any;

const API_URL = 'https://apils.manubanyuputih.id/api/login';

export const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: username.trim(), password: password.trim() }),
            });

            if (!response.ok) {
                let errorMessage = 'Username atau Password yang Anda masukkan salah.';
                try {
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.includes("application/json")) {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    } else {
                        const errorText = await response.text();
                        console.error("Server returned non-JSON response:", errorText);
                        if (response.status === 404) {
                            errorMessage = 'Endpoint API tidak ditemukan. Pastikan backend server aktif.';
                        } else {
                            errorMessage = `Terjadi masalah pada server (status: ${response.status}). Coba lagi nanti.`;
                        }
                    }
                } catch (parseError) {
                    console.error("Could not process error response:", parseError);
                    errorMessage = 'Gagal memproses respons dari server.';
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            
            if (data.token) {
                sessionStorage.setItem('token', data.token);
                navigate('/admin');
            } else {
                throw new Error('Token otentikasi tidak diterima dari server.');
            }

        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Login Gagal',
                text: error.message,
                confirmButtonColor: '#d33',
            });
            setPassword('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
             <div className="absolute top-4 left-4">
                <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-200/50 px-4 py-2 rounded-lg shadow-sm transition-colors">
                   <i className="fa-solid fa-arrow-left"></i>
                    Kembali ke Pendaftaran
                </Link>
            </div>
            <div className="w-full max-w-sm animate-fade-in-up">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="flex justify-center mb-4">
                        <img src={APP_LOGO} alt="Logo MA NU 01 Banyuputih" className="h-20 w-20 object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">Admin Login</h2>
                    <p className="text-center text-slate-500 mb-6 text-base">MA NU 01 Banyuputih</p>
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                                placeholder="Masukkan username"
                                autoFocus
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                                    placeholder="Masukkan password"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700 transition-colors"
                                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                                    disabled={loading}
                                >
                                    {showPassword ? <i className="fa-solid fa-eye-slash"></i> : <i className="fa-solid fa-eye"></i>}
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 disabled:bg-indigo-400 disabled:cursor-not-allowed shadow-md">
                             {loading ? 'Memproses...' : 'Login ke Panel Admin'}
                        </button>
                    </form>

                    <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-500 font-medium">
                            Akun default pertama kali: <span className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">admin</span> / <span className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">admin123</span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                            Password & username dapat diubah di menu Admin setelah login.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};