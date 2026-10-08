import { useState } from "react";
import { useUser } from "../UserContext";

export default function Login() {
  const { login } = useUser();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    login(name);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h1>HealthCoverSim</h1>
        <p className="login-subtitle">Enter your name to view and manage your quotes</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="login-name">Your name</label>
          <input
            id="login-name"
            type="text"
            placeholder="e.g. Audrey"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            autoFocus
          />
          {error && <span className="field-error">{error}</span>}
          <button type="submit">Continue</button>
        </form>
      </div>
    </div>
  );
}
