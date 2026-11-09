
import React, { useState, useEffect } from "react";
import {
  registerUser,
  loginUser as authenticateUser,
} from "../api";

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
}) {
  const [isLoginTab, setIsLoginTab] = useState(true);

  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginErr, setLoginErr] = useState("");

  const [regUser, setRegUser] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regErr, setRegErr] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setLoginErr("");
      setRegErr("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Login Handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginErr("");

    if (!loginUser.trim() || !loginPass) {
      setLoginErr("Email and password are required.");
      return;
    }

    try {
      setLoading(true);

      const result = await authenticateUser({
        email: loginUser.trim(),
        password: loginPass,
      });

      if (!result.access_token) {
        throw new Error("Access token was not returned by the server.");
      }

      localStorage.setItem("access_token", result.access_token);

      await onLoginSuccess(result.access_token);
    } catch (error) {
      setLoginErr(error.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  // Registration Handler
  const handleRegSubmit = async (e) => {
    e.preventDefault();
    setRegErr("");

    if (!regUser.trim() || !regEmail.trim() || !regPass) {
      setRegErr("All fields are required.");
      return;
    }

    if (regPass.length < 6) {
      setRegErr("Minimum password length is 6 characters.");
      return;
    }

    try {
      setLoading(true);

      await registerUser({
        full_name: regUser.trim(),
        email: regEmail.trim(),
        password: regPass,
      });

      setIsLoginTab(true);
      setLoginUser(regEmail.trim());
      setLoginPass("");
      setRegPass("");

      setLoginErr("Account created successfully. Please login.");
    } catch (error) {
      setRegErr(error.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  // Switch Tabs
  const switchTab = (login) => {
    setIsLoginTab(login);
    setLoginErr("");
    setRegErr("");
  };

  return (
    <div
      className="modal-overlay"
      style={{ display: "flex" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-card">
        <button
          type="button"
          className="close-modal-btn"
          onClick={onClose}
        >
          &times;
        </button>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${
              isLoginTab ? "active" : ""
            }`}
            onClick={() => switchTab(true)}
          >
            Login
          </button>

          <button
            type="button"
            className={`auth-tab-btn ${
              !isLoginTab ? "active" : ""
            }`}
            onClick={() => switchTab(false)}
          >
            Register
          </button>
        </div>

        {/* Login Form */}
        {isLoginTab ? (
          <form
            onSubmit={handleLoginSubmit}
            className="auth-form active"
          >
            <div className="form-group">
              <label htmlFor="login-username">
                Email Address
              </label>

              <input
                type="email"
                id="login-username"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">
                Password
              </label>

              <input
                type="password"
                id="login-password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                required
              />
            </div>

            {loginErr && (
              <div className="error-msg">
                {loginErr}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? "Please wait..." : "Login"}
            </button>
          </form>
        ) : (
          /* Registration Form */
          <form
            onSubmit={handleRegSubmit}
            className="auth-form active"
          >
            <div className="form-group">
              <label htmlFor="reg-username">
                Full Name
              </label>

              <input
                type="text"
                id="reg-username"
                value={regUser}
                onChange={(e) => setRegUser(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">
                Email Address
              </label>

              <input
                type="email"
                id="reg-email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">
                Password (Min 6 chars)
              </label>

              <input
                type="password"
                id="reg-password"
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
                minLength={6}
                required
              />
            </div>

            {regErr && (
              <div className="error-msg">
                {regErr}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? "Please wait..." : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
