// src/RegisterPage/Register.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from 'react-router-dom';

function RegisterP({ onRegister }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const navigate = useNavigate();

    // New state for validation errors
    const [usernameError, setUsernameError] = useState(null);
    const [passwordError, setPasswordError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setIsSuccess(false);
        setCountdown(0);
        setUsernameError(null); // Clear previous validation errors
        setPasswordError(null); // Clear previous validation errors

        let isValid = true;

        // Frontend Validation for Username
        if (username.length < 4) {
            setUsernameError("Username must be at least 4 characters long.");
            isValid = false;
        }

        // Frontend Validation for Password
        if (password.length < 8) {
            setPasswordError("Password must be at least 8 characters long.");
            isValid = false;
        }

        if (!isValid) {
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
            const resMessage =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
            setMessage(resMessage);
            setIsSuccess(false);
        }
    };

    return (
        <div className="div-wrapping-container">
            <h1>Register</h1>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => {
                            setUsername(e.target.value);
                            setUsernameError(null); // Clear error on change
                        }}
                        required
                    />
                    {usernameError && <div style={{ color: 'red', fontSize: '0.85em', marginTop: '5px' }}>{usernameError}</div>}
                </div>
                <div className="mb-4">
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setPasswordError(null); // Clear error on change
                        }}
                        required
                    />
                    {passwordError && <div style={{ color: 'red', fontSize: '0.85em', marginTop: '5px' }}>{passwordError}</div>}
                </div>
                <button
                    className="form-button"
                    type="submit"
                    disabled={isSuccess}
                >
                    {isSuccess ? "Registered!" : "Register"}
                </button>
            </form>
            {message && (
                <div style={{ color: isSuccess ? 'green' : 'red', marginTop: '10px' }}>
                    {message}
                    {isSuccess && countdown > 0 && (
                        <div style={{ marginTop: '5px', fontWeight: 'bold' }}>
                            Redirecting in {countdown} seconds...
                        </div>
                    )}
                </div>
            )}
            <p>
                Already have an account? <Link to="/login">Log in here</Link>
            </p>
        </div>
    );
}

export default RegisterP;
