import React, { useState } from "react";
import axios from "axios";
import { Link } from 'react-router-dom';

function RegisterP({ onRegister }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState(null); // Changed from error to message for success/failure

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null); // Clear previous messages

        try {
            const res = await axios.post("http://localhost:8080/api/auth/signup", {
                username,
                password,
                // role: ["user"] // You can optionally send roles during registration
            });
            setMessage(res.data.message || "Registration successful!"); // Display success message from backend
            onRegister(); // Callback for successful registration (e.g., redirect)
            // Optionally clear form fields
            setUsername('');
            setPassword('');
        } catch (error) {
            // More robust error handling
            const resMessage =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
            setMessage(resMessage); // Display error message from backend or generic
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
                <button className="form-button" type="submit">Register</button>
            </form>
            {message && <div style={{ color: message.includes("Error") || message.includes("failed") ? 'red' : 'green' }}>{message}</div>}
            <p>
                Already have an account? <Link to="/login">Log in here</Link>
            </p>
        </div>
    );
}

export default RegisterP;