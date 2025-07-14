// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';

import LandingP from "./LandingPage/LandingP";
import RegisterP from "./RegisterPage/Register";
import QuestionForm from "./components/QuestionForm"; // Corrected path for QuestionForm
import AdminPanel from "./AdminPanel/AdminPanel"; // Import the AdminPanel
import HomePage from './HomePage/HomePage'; // Import the HomePage component

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('user'));
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            setIsLoggedIn(true);
            setCurrentUser(user);
        } else {
            setIsLoggedIn(false);
            setCurrentUser(null);
        }
    }, []);

    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
        setCurrentUser(JSON.parse(localStorage.getItem('user')));
        // The redirect logic for login success will now be handled by the Routes below
    };

    const handleRegisterSuccess = () => {
        // No direct action needed here, RegisterP handles navigation
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setCurrentUser(null);
        // Force a reload or specific navigation to ensure full state reset
        window.location.href = '/login'; // This ensures a full reset of the app state
    };

    // Helper to check if the current user has the ADMIN role
    const isAdmin = currentUser && currentUser.roles && currentUser.roles.includes('ROLE_ADMIN');

    return (
        <Router>
            <Routes>
                {/* Public routes */}
                {/* Redirect from /login: If logged in, check if admin or regular user */}
                <Route path="/login" element={
                    isLoggedIn ? (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/home" />) : <LandingP onLogin={handleLoginSuccess} />
                } />
                <Route path="/register" element={isLoggedIn ? <Navigate to="/home" /> : <RegisterP onRegister={handleRegisterSuccess} />} />

                {/* NEW: Protected route for HomePage (lists forms) */}
                <Route
                    path="/home"
                    element={isLoggedIn ? <HomePage onLogout={handleLogout} /> : <Navigate to="/login" />}
                />

                {/* NEW: Protected route for QuestionForm (specific form questions) */}
                <Route
                    path="/forms/:formId/questions" // Updated path to include formId
                    element={isLoggedIn ? <QuestionForm onLogout={handleLogout} /> : <Navigate to="/login" />}
                />

                {/* Admin Protected Route */}
                <Route
                    path="/admin"
                    element={isLoggedIn && isAdmin ? <AdminPanel onLogout={handleLogout} /> : <Navigate to="/login" />}
                />

                {/* Default route: Redirect to home if logged in, else to login */}
                <Route
                    path="/"
                    element={isLoggedIn ? (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/home" />) : <Navigate to="/login" />}
                />
            </Routes>
        </Router>
    );
}

export default App;
