// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';

import LandingP from "./LandingPage/LandingP";
import RegisterP from "./RegisterPage/Register";
import QuestionForm from "./components/QuestionForm"; // Assuming this is now in src/QuestionForm
import AdminPanel from "./AdminPanel/AdminPanel";
import HomePage from './HomePage/HomePage'; // NEW: Import the new HomePage component
import { useSingleTabEnforcer } from './Utils/useSingleTabEnforcer'; // NEW: Import the single tab enforcer hook

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('user'));
    const [currentUser, setCurrentUser] = useState(null);
    const [showTabAlert, setShowTabAlert] = useState(false); // NEW: State for showing tab alert

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
        // After login, now redirect to the new /home page
    };

    const handleRegisterSuccess = () => {
        // No direct action needed here, RegisterP handles navigation
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setCurrentUser(null);
        // Force a reload or specific navigation to ensure full state reset
        window.location.href = '/login'; // This ensures a full reset of the app state and tab enforcer
    };

    // Helper to check if the current user has the ADMIN role
    const isAdmin = currentUser && currentUser.roles && currentUser.roles.includes('ROLE_ADMIN');

    // Call the useSingleTabEnforcer hook
    useSingleTabEnforcer(
        () => { // onMultipleTabsDetected callback
            if (!showTabAlert) { // Prevent multiple alerts
                alert("You can only open one tab at a time. This tab will be inactive.");
                setShowTabAlert(true); // Set state to prevent further alerts
            }
        },
        () => { // onMainTabLost callback (optional, if this tab unexpectedly loses main status)
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

                {/* NEW: Protected route for HomePage */}
                <Route
                    path="/home"
                    element={isLoggedIn ? <HomePage onLogout={handleLogout} /> : <Navigate to="/login" />}
                />

                {/* NEW: Protected route for QuestionForm - now accepts formId parameter */}
                <Route
                    path="/forms/:formId/questions" // Updated path
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
