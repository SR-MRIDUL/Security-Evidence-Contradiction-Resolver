
import React, { useState, useEffect } from "react";

const EMPTY_HASH =
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

async function computeSha256(str) {
  const buffer = new TextEncoder().encode(str);

  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    buffer
  );

  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

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

  const [shaHash, setShaHash] = useState(EMPTY_HASH);

  // Real-time SHA-256 Hash
  useEffect(() => {
    let cancelled = false;

    const updateHash = async () => {
      try {
        if (!regPass) {
          setShaHash(EMPTY_HASH);
          return;
        }

        const hash = await computeSha256(regPass);

        if (!cancelled) {
          setShaHash(hash);
        }
      } catch (error) {
        console.error("Hash generation failed:", error);
      }
    };

    updateHash();

    return () => {
      cancelled = true;
    };
  }, [regPass]);

  if (!isOpen) return null;

  // Login Handler
  const handleLoginSubmit = (e) => {
    e.preventDefault();

    if (!loginUser.trim() || !loginPass.trim()) {
      setLoginErr(
        "Error: Username and Password required!"
      );
      return;
    }

    setLoginErr("");

    onLoginSuccess(loginUser.trim());
  };

  // Register Handler
   const handleRegSubmit = (e) => {
    e.preventDefault();

    if (
      !regUser.trim() ||
      !regEmail.trim() ||
      !regPass.trim()
    ) {
            setRegErr("Error: Input fields cannot be left empty.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      setRegErr("Error: Please enter a valid email address.");
      return;
    }
    if (regPass.length < 6) {
      setRegErr(
        "Error: Minimum password length is 6 characters."
      );
      return;
    }

    setRegErr("");

    onLoginSuccess(regUser.trim());
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
                Username
              </label>

              <input
                type="text"
                id="login-username"
                value={loginUser}
                onChange={(e) =>
                  setLoginUser(e.target.value)
                }
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
                onChange={(e) =>
                  setLoginPass(e.target.value)
                }
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
            >
              Login
            </button>
          </form>
        ) : (
          /* Register Form */
          <form
            onSubmit={handleRegSubmit}
            className="auth-form active"
          >
            <div className="form-group">
              <label htmlFor="reg-username">
                Username
              </label>

              <input
                type="text"
                id="reg-username"
                value={regUser}
                onChange={(e) =>
                  setRegUser(e.target.value)
                }
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
                onChange={(e) =>
                  setRegEmail(e.target.value)
                }
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
                onChange={(e) =>
                  setRegPass(e.target.value)
                }
                minLength={6}
                required
              />
            </div>

            <div className="hash-preview">
              <small>
                Real-time SHA-256 Encrypted Hash (DB Store Format):
              </small>

              <code>{shaHash}</code>
            </div>

            {regErr && (
              <div className="error-msg">
                {regErr}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit-btn"
            >
              Create Account
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
