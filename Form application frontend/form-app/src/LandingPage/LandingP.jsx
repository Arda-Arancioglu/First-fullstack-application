import React, { useState } from "react";
import axios from "axios";

function LandingP({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState(null);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);

  try {
    const res = await axios.post("http://localhost:8080/login", { username, password });
    localStorage.setItem("token", res.data.token);       
    localStorage.setItem("userId", res.data.userId);     
    onLogin();
  } catch {
    setError("Invalid username or password");
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
        <button type="submit">Log In</button>
      </form>
      {error && <div>{error}</div>}
    </div>
  );
}

export default LandingP;
