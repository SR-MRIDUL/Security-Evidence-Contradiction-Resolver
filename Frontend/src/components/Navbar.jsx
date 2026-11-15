import React from "react";

export default function Navbar({ activeTab, setActiveTab, currentUser, onLogout, onOpenAuth }) {
  const items = [
    ["dashboard", "fa-chart-pie", "Dashboard"],
    ["upload", "fa-upload", "Upload Evidence"],
    ["timeline", "fa-timeline", "Analysis & Timeline"],
    ["audit", "fa-clock-rotate-left", "Audit Trail"],
    ["secure", "fa-lock", "Secure Evidence"],
    ["notifications", "fa-bell", "Notifications"],
    ["cases", "fa-folder-open", "Case Management"],
    ["analytics", "fa-chart-line", "Analytics"],
    ["export", "fa-file-export", "Evidence Export"],
  ];

  return (
    <aside
      className="navbar sidebar-navbar"
      style={{
        width: "260px",
        minWidth: "260px",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        float: "left",
        boxSizing: "border-box",
        padding: "20px 15px",
      }}
    >
      <div className="logo" style={{ marginBottom: "35px" }}>
        <i className="fa-solid fa-shield-halved"></i>
        <span>EvidenceResolver AI</span>
      </div>

      <nav className="nav-links" style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: "12px", width: "100%" }}>
        {items.map(([id, icon, label]) => (
          <button
            key={id}
            className={`nav-btn ${activeTab === id ? "active" : ""}`}
            onClick={() => setActiveTab(id)}
          >
            <i className={`fa-solid ${icon}`}></i>
            {label}
          </button>
        ))}

        <button
          className="nav-btn"
          type="button"
          disabled
          title="Company server integration is planned for a future release."
          style={{ opacity: 0.55, cursor: "not-allowed" }}
        >
          <i className="fa-solid fa-plug"></i>
          Company API <small style={{ marginLeft: "auto" }}>Coming Soon</small>
        </button>
      </nav>

      <div className="user-auth-zone" style={{ marginTop: "auto", paddingTop: "30px" }}>
        {currentUser ? (
          <>
            <span className="user-badge logged-in">
              <i className="fa-solid fa-circle-user"></i>
              Hello, {currentUser}
            </span>
            <button className="logout-btn" onClick={onLogout}>
              <i className="fa-solid fa-right-from-bracket"></i>
              Logout
            </button>
          </>
        ) : (
          <button className="auth-btn" onClick={onOpenAuth}>
            <i className="fa-solid fa-right-to-bracket"></i>
            Login / Register
          </button>
        )}
      </div>
    </aside>
  );
}
