import { useState, useEffect, useCallback } from 'react';
import type { Student } from '../types';

const API_URL = 'https://apils.manubanyuputih.id/api/students';
const STORAGE_KEY = 'manusa_students_data_v1';

const getInitialStudents = (): Student[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
    } catch (e) {
        console.error('Error reading localStorage for students:', e);
    }
    return [];
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
                console.warn('API fetch failed, reading from local state');
                setStudents(getInitialStudents());
                return;
            }

            const data: Student[] = await response.json();
            if (Array.isArray(data)) {
                saveStudents(data);
            }
        } catch (err: any) {
            console.warn('Network error, using local data:', err.message);
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

        if (token) {
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

        if (token) {
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

        if (token) {
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

    return { 
        students, 
        loading, 
        error, 
        fetchStudents, 
        addStudent, 
        updateStudent, 
        deleteStudent
    };
};