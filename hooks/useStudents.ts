import { useState, useEffect, useCallback } from 'react';
import type { Student } from '../types';
import { DUMMY_STUDENTS } from '../data/dummyStudents';

const API_URL = 'https://apils.manubanyuputih.id/api/students';
const STORAGE_KEY = 'manusa_students_data_v1';

const getInitialStudents = (): Student[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.error('Error reading localStorage for students:', e);
    }
    return DUMMY_STUDENTS;
};

const handleApiError = async (response: Response, defaultMessage: string): Promise<Error> => {
    let errorMessage = defaultMessage;
    try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } else {
            const errorText = await response.text();
            console.error("Server returned non-JSON response:", errorText);
            errorMessage = `Terjadi kesalahan pada server (status: ${response.status}). Respons bukan JSON.`;
        }
    } catch (parseError) {
        console.error("Could not parse error response:", parseError);
        errorMessage = `Gagal memproses respons dari server (status: ${response.status} ${response.statusText}).`;
    }
    return new Error(errorMessage);
};


export const useStudents = () => {
    const [students, setStudents] = useState<Student[]>(getInitialStudents);
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
                // Not authorized or in demo mode, use local storage / dummy students
                setStudents(getInitialStudents());
                setLoading(false);
                return;
            }

            // If using demo token, load from storage or dummy
            if (token.startsWith('demo-')) {
                setStudents(getInitialStudents());
                setLoading(false);
                return;
            }

            const response = await fetch(API_URL, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                console.warn('API fetch failed, falling back to local dummy dataset');
                setStudents(getInitialStudents());
                return;
            }

            const data: Student[] = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                saveStudents(data);
            } else {
                // If API returns empty list, keep dummy students
                setStudents(getInitialStudents());
            }
        } catch (err: any) {
            console.warn('Network error, using local dummy data:', err.message);
            setStudents(getInitialStudents());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const addStudent = async (studentData: Omit<Student, 'id'>): Promise<Student> => {
        const token = getToken();
        const fallbackNewStudent: Student = {
            ...studentData,
            id: 'std-' + Date.now(),
            createdAt: new Date().toISOString(),
        };

        if (token && !token.startsWith('demo-')) {
            try {
                const response = await fetch(API_URL, {
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
                }
            } catch (e) {
                console.warn('Server offline, saving locally:', e);
            }
        }

        saveStudents([fallbackNewStudent, ...students]);
        return fallbackNewStudent;
    };

    const updateStudent = async (studentData: Student): Promise<Student> => {
        const token = getToken();

        if (token && !token.startsWith('demo-')) {
            try {
                const response = await fetch(`${API_URL}/${studentData.id}`, {
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
                }
            } catch (e) {
                console.warn('Server offline, updating locally:', e);
            }
        }

        saveStudents(students.map(s => (s.id === studentData.id ? studentData : s)));
        return studentData;
    };

    const deleteStudent = async (studentId: string): Promise<void> => {
        const token = getToken();

        if (token && !token.startsWith('demo-')) {
            try {
                await fetch(`${API_URL}/${studentId}`, {
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

    const resetToDummyData = () => {
        saveStudents(DUMMY_STUDENTS);
    };

    return { 
        students, 
        loading, 
        error, 
        fetchStudents, 
        addStudent, 
        updateStudent, 
        deleteStudent,
        resetToDummyData
    };
};