import React, { useState } from "react";
import axios from "axios";
import { Link } from 'react-router-dom';

function LandingP({ onLogin }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState(null); // Changed from error to message for success/failure

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null); // Clear previous messages

        try {
            const res = await axios.post("http://localhost:8080/api/auth/signin", {
                username,
                password
            });

            // Store the JWT and user details from the backend's JwtResponse
            if (res.data.token) {
                // Store the entire user object or specific details
                localStorage.setItem("user", JSON.stringify(res.data)); // Stores token, id, username, roles
            }

            setMessage("Login successful!");
            onLogin(); // Callback for successful login (e.g., redirect)
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
            <h1>Login</h1>
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
                <button className="form-button" type="submit">Log In</button>
                <p>
                    Don't have an account? <Link to="/register">Register here</Link>
                </p>
            </form>
            {message && <div style={{ color: message.includes("Invalid") || message.includes("failed") ? 'red' : 'green' }}>{message}</div>}

        </div>
    );
}

export default LandingP;