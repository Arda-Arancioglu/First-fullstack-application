// src/RegisterPage/Register.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from 'react-router-dom';
import './RegisterPageStyle.css'; // NEW: Import the new CSS file

function RegisterP({ onRegister }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [validationErrors, setValidationErrors] = useState({}); // NEW: State for validation errors
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setIsSuccess(false);
        setCountdown(0);
        setValidationErrors({}); // Clear previous validation errors

        let errors = {};
        if (!username.trim()) {
            errors.username = "Username cannot be empty.";
        } else if (username.trim().length < 4) {
            errors.username = "Username must be greater than 3 characters.";
        }

        if (!password.trim()) {
            errors.password = "Password cannot be empty.";
        } else if (password.trim().length < 8) {
            errors.password = "Password must be greater than 7 characters.";
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            setMessage("Please correct the errors in the form."); // General message for client-side errors
            return; // Stop submission if validation fails
        }

        try {
            const res = await axios.post("http://localhost:8080/api/auth/signup", {
                username,
                password,
            });
            setMessage(res.data.message || "Registration successful!");
            setIsSuccess(true);
            onRegister();

            setCountdown(2);
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        navigate("/login");
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            setUsername('');
            setPassword('');
        } catch (error) {
            let errorMessage = "An unexpected error occurred during registration."; // Default error message

            if (error.response) {
                if (error.response.status === 400 && error.response.data && error.response.data.message === "Error: Username is already taken!") {
                    errorMessage = "Username is already taken. Please choose a different one.";
                    setValidationErrors(prev => ({ ...prev, username: errorMessage })); // Set specific error for username
                } else if (error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else {
                    errorMessage = `Server error: ${error.response.status}`;
                }
            } else if (error.request) {
                errorMessage = "No response from server. Please check your connection.";
            } else {
                errorMessage = error.message;
            }
            setMessage(errorMessage);
            setIsSuccess(false);
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
        <div className="register-page-container"> {/* NEW: Main container class */}
            <div className="register-card"> {/* NEW: Card class */}
                <h1 className="register-title">Register</h1> {/* NEW: Title class */}
                <form onSubmit={handleSubmit} className="register-form"> {/* NEW: Form class */}
                    <div className="input-with-validation"> {/* NEW: Wrapper for input and icon */}
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
                    <div className="input-with-validation"> {/* NEW: Wrapper for input and icon */}
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
                        className="register-button" /* NEW: Button class */
                        type="submit"
                        disabled={isSuccess}
                    >
                        {isSuccess ? "Registered!" : "Register"}
                    </button>
                </form>
                {message && (
                    <div className={`message-container ${isSuccess ? 'message-success' : 'message-error'}`}> {/* NEW: Message container class */}
                        {message}
                        {isSuccess && countdown > 0 && (
                            <div className="countdown-text"> {/* NEW: Countdown class */}
                                Redirecting in {countdown} seconds...
                            </div>
                        )}
                    </div>
                )}
                <p className="login-link-text"> {/* NEW: Link text class */}
                    Already have an account? <Link to="/login" className="login-link">Log in here</Link> {/* NEW: Link class */}
                </p>
            </div>
        </div>
    );
}

export default RegisterP;
