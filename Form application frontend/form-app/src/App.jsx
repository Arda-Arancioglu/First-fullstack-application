// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LandingP from "./LandingPage/LandingP"; // Your existing login component
import RegisterP from "./RegisterPage/Register"; // Your existing registration component
import QuestionsPage from "./components/QuestionForm"; // The new questions component

function App() {
    // Initialize isLoggedIn based on whether a user token exists in localStorage
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('user'));

    // Function to call after successful login
    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
        // The LandingP component will handle navigation using useNavigate
    };

    // Function to call after successful registration (redirects to login)
    const handleRegisterSuccess = () => {
        // After registration, typically redirect to login page
        // The RegisterP component will handle navigation using useNavigate
    };

    // Function to handle logout
    const handleLogout = () => {
        localStorage.removeItem('user'); // Clear user data from localStorage
        setIsLoggedIn(false);
        // The QuestionsPage will handle navigation using useNavigate after logout
    };

    return (
        <Router>
            <Routes>
                {/* Public routes */}
                {/* IMPORTANT: Ensure onLogin={handleLoginSuccess} is passed here */}
                <Route
                    path="/login"
                    element={isLoggedIn ? <Navigate to="/questions" /> : <LandingP onLogin={handleLoginSuccess} />}
                />
                <Route
                    path="/register"
                    element={isLoggedIn ? <Navigate to="/questions" /> : <RegisterP onRegister={handleRegisterSuccess} />}
                />

                {/* Protected route */}
                <Route
                    path="/questions"
                    element={isLoggedIn ? <QuestionsPage onLogout={handleLogout} /> : <Navigate to="/login" />}
                />

                {/* Default route: Redirect to login or questions based on login status */}
                <Route
                    path="/"
                    element={isLoggedIn ? <Navigate to="/questions" /> : <Navigate to="/login" />}
                />
            </Routes>
        </Router>
    );
}

export default App;
