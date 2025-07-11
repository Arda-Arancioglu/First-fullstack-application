// src/RegisterPage/Register.js
import React, { useState, useEffect } from "react"; // Import useEffect
import axios from "axios";
import { Link, useNavigate } from 'react-router-dom';

function RegisterP({ onRegister }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [countdown, setCountdown] = useState(0); // New state for countdown
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setIsSuccess(false);
        setCountdown(0); // Reset countdown on new submission

        try {
            const res = await axios.post("http://localhost:8080/api/auth/signup", {
                username,
                password,
                // role: ["user"] // You can optionally send roles during registration
            });
            setMessage(res.data.message || "Registration successful!");
            setIsSuccess(true);
            onRegister();

            // Start countdown
            setCountdown(2); // Start from 2 seconds
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        navigate("/login");
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000); // Update every second

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
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-4">
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
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
