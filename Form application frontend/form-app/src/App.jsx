// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useSingleTabEnforcer } from './Utils/useSingleTabEnforcer'; // Import the hook

import LandingP from "./LandingPage/LandingP";
import RegisterP from "./RegisterPage/Register";
import QuestionForm from "./components/QuestionForm";
import AdminPanel from "./AdminPanel/AdminPanel";
import HomePage from './HomePage/HomePage';
import ChatbotWidget from './ChatbotWidget/ChatbotWidget'; // Import ChatbotWidget

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('user'));
    const [currentUser, setCurrentUser] = useState(null);
    const [showTabAlert, setShowTabAlert] = useState(false); // State to control the alert message

    // Callback for when multiple tabs are detected
    const handleMultipleTabsDetected = () => {
        setShowTabAlert(true);
        // Optionally, you might want to force logout or disable functionality here
        // For now, we'll just show the alert.
    };

    // Callback for when this tab unexpectedly loses its main status
    const handleMainTabLost = () => {
        setShowTabAlert(true);
        // Optionally, force logout or disable functionality
    };

    // Integrate the useSingleTabEnforcer hook and correctly destructure its return value
    const { isMainTab, releaseMainTab, setIsLogoutInProgress } = useSingleTabEnforcer(handleMultipleTabsDetected, handleMainTabLost);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            setIsLoggedIn(true);
            setCurrentUser(user);
        } else {
            setIsLoggedIn(false);
            setCurrentUser(null);
        }
    }, [isLoggedIn]); // Added isLoggedIn as a dependency here to ensure currentUser is re-evaluated

    const handleLoginSuccess = () => {
        // When login is successful, update isLoggedIn and then currentUser
        setIsLoggedIn(true);
        // The useEffect above will now handle setting currentUser reliably based on isLoggedIn
        // We can still explicitly set it here for immediate update if needed, but useEffect will confirm
        setCurrentUser(JSON.parse(localStorage.getItem('user')));
        // The redirect logic for login success will now be handled by the Routes below
    };

    const handleRegisterSuccess = () => {
        // No direct action needed here, RegisterP handles navigation
    };

    const handleLogout = () => {
        // Signal to the single tab enforcer that a logout is in progress
        setIsLogoutInProgress(true);
        // Explicitly release the main tab claim when logging out
        releaseMainTab();
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setCurrentUser(null);
        // Dismiss the alert before redirecting to ensure it doesn't flash
        setShowTabAlert(false);

        // Add a small timeout before redirecting to allow localStorage updates to propagate
        // This is a common pattern to mitigate race conditions with localStorage and redirects.
        setTimeout(() => {
            window.location.href = '/login'; // This ensures a full reset of the app state
        }, 50); // Small delay of 50ms
    };

    // Helper to check if the current user has the ADMIN role
    // CORRECTED: Use .includes() because currentUser.roles is an array of strings like ['ROLE_ADMIN', 'ROLE_USER']
    const isAdmin = currentUser && currentUser.roles && currentUser.roles.includes('ROLE_ADMIN');

    // Add console logs for debugging redirection
    console.log("App Render: isLoggedIn =", isLoggedIn, "isAdmin =", isAdmin, "currentUser =", currentUser);
    if (currentUser && currentUser.roles) {
        console.log("App Render: currentUser.roles =", currentUser.roles);
        currentUser.roles.forEach((role, index) => {
            // Log the role directly, as it's a string, not an object with a 'name' property
            console.log(`App Render: Role ${index}:`, role);
        });
    }


    return (
        <Router>
            {/* Global alert for multiple tabs */}
            {showTabAlert && (
                <div className="multi-tab-alert p-4 bg-red-100 border border-red-400 text-red-700 rounded-md shadow-lg fixed top-4 left-1/2 -translate-x-1/2 z-50">
                    <p className="font-semibold text-lg mb-2">Multiple tabs detected!</p>
                    <p className="text-sm">Please use only one tab for this application to ensure data consistency and prevent unexpected behavior.</p>
                    <button
                        onClick={() => setShowTabAlert(false)}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors duration-200"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            <Routes>
                {/* Public routes */}
                <Route path="/login" element={
                    isLoggedIn ? (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/home" />) : <LandingP onLogin={handleLoginSuccess} />
                } />
                <Route path="/register" element={isLoggedIn ? <Navigate to="/home" /> : <RegisterP onRegister={handleRegisterSuccess} />} />

                {/* Protected route for HomePage (lists forms) */}
                <Route
                    path="/home"
                    element={isLoggedIn ? <HomePage onLogout={handleLogout} /> : <Navigate to="/login" />}
                />

                {/* Protected route for QuestionForm (specific form questions) */}
                <Route
                    path="/forms/:formId/questions" // Updated path to include formId
                    element={isLoggedIn ? <QuestionForm onLogout={handleLogout} /> : <Navigate to="/login" />}
                />

                {/* Admin Protected Route */}
                <Route
                    path="/admin"
                    element={<AdminPanel onLogout={handleLogout} isMainTab={isMainTab} />}
                />
                
                {/* Original Admin Protected Route - commented for testing */}
                {/* <Route
                    path="/admin"
                    element={isLoggedIn && isAdmin ? <AdminPanel onLogout={handleLogout} isMainTab={isMainTab} /> : <Navigate to="/login" />}
                /> */}

                {/* Default route: Redirect to home if logged in, else to login */}
                <Route
                    path="/"
                    element={isLoggedIn ? (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/home" />) : <Navigate to="/login" />}
                />
            </Routes>

            {/* Render ChatbotWidget only if logged in */}
            {isLoggedIn && (
                <ChatbotWidget onLogout={handleLogout} currentUser={currentUser} isMainTab={isMainTab} />
            )}
        </Router>
    );
}

export default App;
