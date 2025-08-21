import { useState, useEffect, useCallback } from 'react';
import type { Student } from '../types';

const API_URL = 'https://apils.manubanyuputih.id/api/students';

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
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getToken = () => sessionStorage.getItem('token');

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = getToken();
            if (!token) throw new Error('Not authorized');

            const response = await fetch(API_URL, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw await handleApiError(response, 'Failed to fetch students');
            }

            const data: Student[] = await response.json();
            setStudents(data);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const addStudent = async (studentData: Omit<Student, 'id'>): Promise<Student> => {
        const token = getToken();
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(studentData),
        });

        if (!response.ok) {
            throw await handleApiError(response, 'Failed to add student');
        }

        const newStudent: Student = await response.json();
        setStudents(prev => [newStudent, ...prev]);
        return newStudent;
    };

    const updateStudent = async (studentData: Student): Promise<Student> => {
        const token = getToken();
        const response = await fetch(`${API_URL}/${studentData.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(studentData),
        });

        if (!response.ok) {
            throw await handleApiError(response, 'Failed to update student');
        }

        const updatedStudent: Student = await response.json();
        setStudents(prev => prev.map(s => (s.id === updatedStudent.id ? updatedStudent : s)));
        return updatedStudent;
    };

    const deleteStudent = async (studentId: string): Promise<void> => {
        const token = getToken();
        const response = await fetch(`${API_URL}/${studentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw await handleApiError(response, 'Failed to delete student');
        }

        setStudents(prev => prev.filter(s => s.id !== studentId));
    };

    return { students, loading, error, fetchStudents, addStudent, updateStudent, deleteStudent };
};