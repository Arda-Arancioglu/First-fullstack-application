// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';

import LandingP from "./LandingPage/LandingP";
import RegisterP from "./RegisterPage/Register";
import QuestionForm from "./components/QuestionForm";
import AdminPanel from "./AdminPanel/AdminPanel";
import HomePage from './HomePage/HomePage';
import ChatbotWidget from './ChatbotWidget/ChatbotWidget'; // NEW: Import the ChatbotWidget component
import { useSingleTabEnforcer } from './Utils/useSingleTabEnforcer';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('user'));
    const [currentUser, setCurrentUser] = useState(null);
    const [showTabAlert, setShowTabAlert] = useState(false);

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
    };

    const handleRegisterSuccess = () => {
        // No direct action needed here, RegisterP handles navigation
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setCurrentUser(null);
        window.location.href = '/login';
    };

    const isAdmin = currentUser && currentUser.roles && currentUser.roles.includes('ROLE_ADMIN');

    useSingleTabEnforcer(
        () => {
            if (!showTabAlert) {
                alert("You can only open one tab at a time. This tab will be inactive.");
                setShowTabAlert(true);
            }
        },
        () => {
            console.log("This tab has lost its main active status unexpectedly.");
        }
    );

    return (
        <Router>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={
                    isLoggedIn ? (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/home" />) : <LandingP onLogin={handleLoginSuccess} />
                } />
                <Route path="/register" element={isLoggedIn ? <Navigate to="/home" /> : <RegisterP onRegister={handleRegisterSuccess} />} />

                {/* Protected route for HomePage */}
                <Route
                    path="/home"
                    element={isLoggedIn ? <HomePage onLogout={handleLogout} /> : <Navigate to="/login" />}
                />

                {/* Protected route for QuestionForm - now accepts formId parameter */}
                <Route
                    path="/forms/:formId/questions"
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
            {/* NEW: Render the ChatbotWidget outside of Routes so it appears on all pages */}
            {isLoggedIn && <ChatbotWidget onLogout={handleLogout} />}
        </Router>
    );
}

export default App;
