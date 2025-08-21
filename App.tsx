import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { RegistrationPage } from './pages/RegistrationPage';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';

const ProtectedRoute: React.FC = () => {
    const token = sessionStorage.getItem('token');
    return token ? <Outlet /> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
    return (
        <HashRouter>
            <Routes>
                <Route path="/" element={<RegistrationPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/admin" element={<AdminPage />} />
                </Route>
                 {/* Redirect any other path to the registration page */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </HashRouter>
    );
};

export default App;
