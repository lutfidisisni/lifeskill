import { useState, useEffect, useCallback } from 'react';
import type { Student, LifeSkill } from '../types';
import { API_BASE_URL, INITIAL_MASTER_STUDENTS } from '../constants';

const API_STUDENTS_URL = `${API_BASE_URL}/students`;
const BULK_DELETE_API_URL = `${API_BASE_URL}/students-bulk-delete`;
const RESET_CHOICE_API_URL = `${API_BASE_URL}/students-reset-choice`;
const BULK_IMPORT_API_URL = `${API_BASE_URL}/students-bulk-import`;
const CLEAR_ALL_API_URL = `${API_BASE_URL}/students-clear-all`;
const LOOKUP_NIS_API_URL = `${API_BASE_URL}/lookup-nis`;
const CHOOSE_SKILL_API_URL = `${API_BASE_URL}/choose-skill`;

const STORAGE_KEY = 'manusa_master_students_v3';
const LEGACY_V2_KEY = 'manusa_students_data_v2';
const LEGACY_V1_KEY = 'manusa_students_data_v1';

export const getStoredStudents = (): Student[] => {
    try {
        localStorage.removeItem(LEGACY_V1_KEY);
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }

        // Migrate from v2 if available
        const storedV2 = localStorage.getItem(LEGACY_V2_KEY);
        if (storedV2) {
            const parsedV2 = JSON.parse(storedV2);
            if (Array.isArray(parsedV2) && parsedV2.length > 0) {
                const migrated: Student[] = parsedV2.map((s: any, idx: number) => ({
                    ...s,
                    nis: s.nis || `202411${String(idx + 1).padStart(3, '0')}`,
                }));
                localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
                return migrated;
            }
        }

        // Default initial master students
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MASTER_STUDENTS));
        return INITIAL_MASTER_STUDENTS;
    } catch (e) {
        console.error('Error reading localStorage for students:', e);
        return INITIAL_MASTER_STUDENTS;
    }
};

export const useStudents = () => {
    const [students, setStudents] = useState<Student[]>(getStoredStudents);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getToken = () => sessionStorage.getItem('token');

    // Save to localStorage whenever students change
    const saveStudents = (updated: Student[]) => {
        setStudents(updated);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            window.dispatchEvent(new Event('manusa_data_updated'));
        } catch (e) {
            console.error('Failed to save students to localStorage:', e);
        }
    };

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = getToken();
            if (!token) {
                setStudents(getStoredStudents());
                setLoading(false);
                return;
            }

            const response = await fetch(API_STUDENTS_URL, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                console.warn('API fetch failed, reading from local state');
                setStudents(getStoredStudents());
                return;
            }

            const data: Student[] = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                saveStudents(data);
            } else {
                setStudents(getStoredStudents());
            }
        } catch (err: any) {
            console.warn('Network error, using local data:', err.message);
            setStudents(getStoredStudents());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    // Student Lookup by NIS (Used during registration)
    const lookupStudentByNIS = async (nis: string): Promise<{
        found: boolean;
        student: Student | null;
        alreadySelected: boolean;
        selectedLifeSkill: LifeSkill | null;
        message: string;
    }> => {
        const cleanNIS = nis.trim().toLowerCase();
        if (!cleanNIS) {
            return {
                found: false,
                student: null,
                alreadySelected: false,
                selectedLifeSkill: null,
                message: 'NIS tidak boleh kosong'
            };
        }

        // Try API lookup
        try {
            const response = await fetch(`${LOOKUP_NIS_API_URL}/${encodeURIComponent(cleanNIS)}`);
            if (response.ok) {
                const data = await response.json();
                return {
                    found: data.found,
                    student: data.student,
                    alreadySelected: data.alreadySelected,
                    selectedLifeSkill: data.selectedLifeSkill,
                    message: data.message
                };
            }
        } catch (e) {
            console.warn('Lookup API offline, checking local storage:', e);
        }

        // Fallback to local storage lookup
        const currentList = getStoredStudents();
        const found = currentList.find(s => s.nis && s.nis.trim().toLowerCase() === cleanNIS);

        if (!found) {
            return {
                found: false,
                student: null,
                alreadySelected: false,
                selectedLifeSkill: null,
                message: `NIS "${nis}" tidak ditemukan dalam Master Data Siswa. Silakan periksa kembali NIS atau hubungi Admin / Wali Kelas.`
            };
        }

        const alreadySelected = Boolean(found.lifeSkill && found.lifeSkill.trim() !== '');
        return {
            found: true,
            student: found,
            alreadySelected,
            selectedLifeSkill: found.lifeSkill,
            message: alreadySelected
                ? `Siswa "${found.fullName}" (NIS: ${found.nis}) sudah memilih program "${found.lifeSkill}". Setiap siswa hanya diperbolehkan memilih 1 (satu) kali.`
                : `Data siswa ditemukan. Silakan pilih program Life Skill.`
        };
    };

    // Student chooses Life Skill by NIS
    const chooseLifeSkill = async (nis: string, lifeSkill: LifeSkill): Promise<Student> => {
        const cleanNIS = nis.trim();

        // Try API submission
        try {
            const response = await fetch(CHOOSE_SKILL_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nis: cleanNIS,
                    skill: lifeSkill
                }),
            });

            if (response.ok) {
                const updatedStudent: Student = await response.json();
                const currentList = getStoredStudents();
                const updatedList = currentList.map(s => (s.nis.trim().toLowerCase() === cleanNIS.toLowerCase() ? updatedStudent : s));
                saveStudents(updatedList);
                return updatedStudent;
            } else {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'Pendaftaran pilihan gagal.');
            }
        } catch (e: any) {
            if (e.message && (e.message.includes('sudah') || e.message.includes('penuh') || e.message.includes('tidak terdaftar'))) {
                throw e;
            }
            console.warn('Backend API unavailable, saving choice locally:', e);
        }

        // Fallback local update
        const currentList = getStoredStudents();
        const index = currentList.findIndex(s => s.nis && s.nis.trim().toLowerCase() === cleanNIS.toLowerCase());

        if (index === -1) {
            throw new Error(`NIS "${cleanNIS}" tidak ditemukan dalam data siswa.`);
        }

        const student = currentList[index];
        if (student.lifeSkill && student.lifeSkill.trim() !== '') {
            throw new Error(`Siswa "${student.fullName}" sudah memilih program "${student.lifeSkill}". Tidak diperbolehkan memilih ulang.`);
        }

        const updatedStudent: Student = {
            ...student,
            lifeSkill,
            whatsappNumber: student.whatsappNumber,
            updatedAt: new Date().toISOString(),
        };

        const updatedList = [...currentList];
        updatedList[index] = updatedStudent;
        saveStudents(updatedList);
        return updatedStudent;
    };

    // Admin: Add new single Master Student
    const addStudent = async (studentData: Omit<Student, 'id'>): Promise<Student> => {
        const cleanNIS = studentData.nis.trim().toLowerCase();
        const isDuplicateNIS = students.some(s => s.nis && s.nis.trim().toLowerCase() === cleanNIS);

        if (isDuplicateNIS) {
            throw new Error(`NIS "${studentData.nis}" sudah digunakan oleh siswa lain. NIS harus unik.`);
        }

        const token = getToken();
        const fallbackNewStudent: Student = {
            ...studentData,
            id: 'std-' + Date.now(),
            createdAt: new Date().toISOString(),
        };

        if (token) {
            try {
                const response = await fetch(API_STUDENTS_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(studentData),
                });

                if (response.ok) {
                    const newStudent: Student = await response.json();
                    saveStudents([newStudent, ...students]);
                    return newStudent;
                } else {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.message || 'Gagal menambahkan siswa.');
                }
            } catch (e: any) {
                if (e.message && e.message.includes('terdaftar')) {
                    throw e;
                }
                console.warn('Server offline, saving locally:', e);
            }
        }

        saveStudents([fallbackNewStudent, ...students]);
        return fallbackNewStudent;
    };

    // Admin: Update Master Student
    const updateStudent = async (studentData: Student): Promise<Student> => {
        const cleanNIS = studentData.nis.trim().toLowerCase();
        const isDuplicateNIS = students.some(
            s => s.id !== studentData.id && s.nis && s.nis.trim().toLowerCase() === cleanNIS
        );

        if (isDuplicateNIS) {
            throw new Error(`NIS "${studentData.nis}" sudah digunakan oleh data siswa lainnya.`);
        }

        const token = getToken();

        if (token) {
            try {
                const response = await fetch(`${API_STUDENTS_URL}/${studentData.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(studentData),
                });

                if (response.ok) {
                    const updated: Student = await response.json();
                    saveStudents(students.map(s => (s.id === updated.id ? updated : s)));
                    return updated;
                } else {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.message || 'Gagal memperbarui data siswa.');
                }
            } catch (e: any) {
                if (e.message && e.message.includes('terdaftar')) {
                    throw e;
                }
                console.warn('Server offline, updating locally:', e);
            }
        }

        saveStudents(students.map(s => (s.id === studentData.id ? studentData : s)));
        return studentData;
    };

    // Admin: Delete Single Student
    const deleteStudent = async (studentId: string): Promise<void> => {
        const token = getToken();

        if (token) {
            try {
                await fetch(`${API_STUDENTS_URL}/${studentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
            } catch (e) {
                console.warn('Server offline, deleting locally:', e);
            }
        }

        saveStudents(students.filter(s => s.id !== studentId));
    };

    // Admin: Bulk Delete Students
    const deleteBulkStudents = async (studentIds: string[]): Promise<void> => {
        if (!studentIds || studentIds.length === 0) return;

        const token = getToken();
        const idSet = new Set(studentIds);

        if (token) {
            try {
                await fetch(BULK_DELETE_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ ids: studentIds }),
                });
            } catch (e) {
                console.warn('Server offline, bulk deleting locally:', e);
            }
        }

        saveStudents(students.filter(s => !idSet.has(s.id)));
    };

    // Admin: Reset Student Choice back to null
    const resetStudentChoices = async (studentIds: string[]): Promise<void> => {
        if (!studentIds || studentIds.length === 0) return;

        const token = getToken();
        const idSet = new Set(studentIds);

        if (token) {
            try {
                await fetch(RESET_CHOICE_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ ids: studentIds }),
                });
            } catch (e) {
                console.warn('Server offline, resetting choices locally:', e);
            }
        }

        saveStudents(students.map(s => (idSet.has(s.id) ? { ...s, lifeSkill: null } : s)));
    };

    // Admin: Bulk Import Students from Excel/CSV
    const bulkImportStudents = async (importList: Omit<Student, 'id'>[]): Promise<{ inserted: number; updated: number }> => {
        if (!importList || importList.length === 0) {
            throw new Error('Tidak ada data siswa yang akan diimpor.');
        }

        const token = getToken();

        if (token) {
            try {
                const response = await fetch(BULK_IMPORT_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ students: importList }),
                });

                if (response.ok) {
                    const resData = await response.json();
                    await fetchStudents();
                    return { inserted: resData.insertedCount || 0, updated: resData.updatedCount || 0 };
                }
            } catch (e) {
                console.warn('Server offline, importing locally:', e);
            }
        }

        // Local merge import
        const currentList = [...students];
        let inserted = 0;
        let updated = 0;

        for (const item of importList) {
            const cleanNIS = item.nis.trim().toLowerCase();
            const existingIndex = currentList.findIndex(s => s.nis && s.nis.trim().toLowerCase() === cleanNIS);

            if (existingIndex >= 0) {
                currentList[existingIndex] = {
                    ...currentList[existingIndex],
                    fullName: item.fullName.trim(),
                    classLevel: item.classLevel,
                    jenisKelamin: item.jenisKelamin,
                    whatsappNumber: item.whatsappNumber || currentList[existingIndex].whatsappNumber,
                    lifeSkill: item.lifeSkill !== undefined ? item.lifeSkill : currentList[existingIndex].lifeSkill,
                    updatedAt: new Date().toISOString(),
                };
                updated++;
            } else {
                currentList.unshift({
                    ...item,
                    id: 'mst-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                    createdAt: new Date().toISOString(),
                });
                inserted++;
            }
        }

        saveStudents(currentList);
        return { inserted, updated };
    };

    // Admin: Clear All Master Data
    const clearAllStudents = async (): Promise<void> => {
        const token = getToken();
        if (token) {
            try {
                await fetch(CLEAR_ALL_API_URL, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
            } catch (e) {
                console.warn('Server offline, clearing locally:', e);
            }
        }
        saveStudents([]);
    };

    return { 
        students, 
        registeredStudents: students.filter(s => s.lifeSkill && s.lifeSkill.trim() !== ''),
        unregisteredStudents: students.filter(s => !s.lifeSkill || s.lifeSkill.trim() === ''),
        loading, 
        error, 
        fetchStudents, 
        lookupStudentByNIS,
        chooseLifeSkill,
        addStudent, 
        updateStudent, 
        deleteStudent,
        deleteBulkStudents,
        resetStudentChoices,
        bulkImportStudents,
        clearAllStudents
    };
};
