// src/LandingPage/LandingP.js
import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from 'react-router-dom';
import './LandingStyle.css'; // Import the new CSS file

function LandingP({ onLogin }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState(null);
    const [validationErrors, setValidationErrors] = useState({}); // NEW: State for validation errors
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setValidationErrors({}); // Clear previous validation errors

        let errors = {};
        if (!username.trim()) {
            errors.username = "Username cannot be empty.";
        } else if (username.trim().length < 4) { // NEW: Username length validation
            errors.username = "Username must be greater than 3 characters.";
        }

        if (!password.trim()) {
            errors.password = "Password cannot be empty.";
        } else if (password.trim().length < 8) { // NEW: Password length validation
            errors.password = "Password must be greater than 7 characters.";
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            setMessage("Please correct the errors in the form."); // More general message for multiple errors
            return; // Stop submission if validation fails
        }

        try {
            const res = await axios.post("http://localhost:8080/api/auth/signin", {
                username,
                password
            });

            if (res.data.token) {
                localStorage.setItem("user", JSON.stringify(res.data));
            }

            setMessage("Login successful!");
            onLogin();
            navigate("/questions");
        } catch (error) {
            let errorMessage = "An unexpected error occurred."; // Default error message

            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                if (error.response.status === 401) {
                    errorMessage = "Invalid username or password. Please try again.";
                } else if (error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else {
                    errorMessage = `Server error: ${error.response.status}`;
                }
            } else if (error.request) {
                // The request was made but no response was received
                errorMessage = "No response from server. Please check your connection.";
            } else {
                // Something happened in setting up the request that triggered an Error
                errorMessage = error.message;
            }
            setMessage(errorMessage);
        }
    };

    // Handler to clear validation error when user types
    const handleInputChange = (setter, fieldName) => (e) => {
        setter(e.target.value);
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
        });
        setMessage(null); // Clear general message when user starts typing
    };


    return (
        <div className="landing-page-container">
            <div className="login-card">
                <h1 className="login-title">Login</h1>
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-with-validation">
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={handleInputChange(setUsername, 'username')}
                            className={`form-input ${validationErrors.username ? 'input-error' : ''}`}
                        />
                        {validationErrors.username && (
                            <span className="validation-error-icon" title={validationErrors.username}>
                                &#9888; {/* Exclamation mark icon */}
                            </span>
                        )}
                    </div>
                    <div className="input-with-validation">
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={handleInputChange(setPassword, 'password')}
                            className={`form-input ${validationErrors.password ? 'input-error' : ''}`}
                        />
                        {validationErrors.password && (
                            <span className="validation-error-icon" title={validationErrors.password}>
                                &#9888; {/* Exclamation mark icon */}
                            </span>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="login-button"
                    >
                        Log In
                    </button>
                </form>
                {message && (
                    <div className={`message-container ${message.includes("successful") ? 'message-success' : 'message-error'}`}>
                        {message}
                    </div>
                )}
                <p className="register-link-text">
                    Don't have an account? <Link to="/register" className="register-link">Register here</Link>
                </p>
            </div>
        </div>
    );
}

export default LandingP;
