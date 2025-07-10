import React, { useState } from "react";
import axios from "axios";
import { Link } from 'react-router-dom';

function RegisterP({ onRegister }){
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);


const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);


    try {
        const res = await axios.post("http://localhost:8080/register", {username, password})
        onRegister();
    } catch  {
        setError("Registration failed. Please try again.");
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
      {error && <div>{error}</div>}
      <p>
        Already have an account? <Link to="/login">Log in here</Link>
      </p>
    </div>
  );

}

export default RegisterP;

