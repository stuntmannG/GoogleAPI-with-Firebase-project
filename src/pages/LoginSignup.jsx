import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuth from "../auth/useAuth";
import "./LoginSignup.css";

export default function LoginSignup(){
  const [mode, setMode] = useState("login");
  return (
    <div className="auth-wrapper page-wrap">
      <div className="auth-card">
        <div className="tabs">
          <button className={mode === "login" ? "tab active" : "tab"} onClick={() => setMode("login")}>Login</button>
          <button className={mode === "signup" ? "tab active" : "tab"} onClick={() => setMode("signup")}>Signup</button>
        </div>
        {mode === "login" ? <LoginForm /> : <SignupForm onSwitch={() => setMode("login")} />}
      </div>
      <div className="corner-image" aria-hidden="true" />
    </div>
  );
}

function LoginForm(){
  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    try{ await login(email.trim(), password); nav(redirectTo, { replace: true }); }
    catch(err){ setError(err.message); }
  };
  return (<form className="form" onSubmit={handleSubmit}>
    <h2>Welcome back</h2>
    <label>Email</label>
    <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required />
    <label>Password</label>
    <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required />
    {error && <div className="error">{error}</div>}
    <button type="submit" className="primary">Login</button>
  </form>);
}

function SignupForm({ onSwitch }){
  const { signup } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    if (password !== confirm) return setError("Passwords do not match");
    try{ await signup(email.trim(), password); nav("/", { replace: true }); }
    catch(err){ setError(err.message); }
  };
  return (<form className="form" onSubmit={handleSubmit}>
    <h2>Create account</h2>
    <label>Email</label>
    <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required />
    <label>Password</label>
    <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required />
    <label>Confirm password</label>
    <input value={confirm} onChange={e=>setConfirm(e.target.value)} type="password" required />
    {error && <div className="error">{error}</div>}
    <button type="submit" className="primary">Sign up</button>
    <button type="button" className="linklike" onClick={onSwitch}>Already have an account? Login</button>
  </form>);
}
