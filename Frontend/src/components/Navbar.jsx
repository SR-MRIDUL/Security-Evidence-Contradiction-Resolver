
import React from "react";

export default function Navbar({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  onOpenAuth
}) {
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
        padding: "20px 15px"
      }}
    >
      {/* Logo */}
      <div className="logo" style={{ marginBottom: "35px" }}>
        <i className="fa-solid fa-shield-halved"></i>
        <span>EvidenceResolver AI</span>
      </div>

      {/* Sidebar Navigation */}
      <nav
        className="nav-links"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: "12px",
          width: "100%"
        }}
      >
        <button
          className={`nav-btn ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          <i className="fa-solid fa-chart-pie"></i>
          Dashboard
        </button>

        <button
          className={`nav-btn ${activeTab === "upload" ? "active" : ""}`}
          onClick={() => setActiveTab("upload")}
        >
          <i className="fa-solid fa-upload"></i>
          Upload Evidence
        </button>

        <button
          className={`nav-btn ${activeTab === "timeline" ? "active" : ""}`}
          onClick={() => setActiveTab("timeline")}
        >
          <i className="fa-solid fa-timeline"></i>
          Analysis & Timeline
        </button>

        {/* FR-30: Audit Trail */}
        <button
          className={`nav-btn ${activeTab === "audit" ? "active" : ""}`}
          onClick={() => setActiveTab("audit")}
        >
          <i className="fa-solid fa-clock-rotate-left"></i>
          Audit Trail
        </button>

        {/* FR-31: Secure Evidence */}
        <button
          className={`nav-btn ${activeTab === "secure" ? "active" : ""}`}
          onClick={() => setActiveTab("secure")}
        >
          <i className="fa-solid fa-lock"></i>
          Secure Evidence
        </button>

        {/* FR-32: Notifications */}
        <button
          className={`nav-btn ${activeTab === "notifications" ? "active" : ""}`}
          onClick={() => setActiveTab("notifications")}
        >
          <i className="fa-solid fa-bell"></i>
          Notifications
        </button>

        {/* FR-33: Case Management */}
        <button
          className={`nav-btn ${activeTab === "cases" ? "active" : ""}`}
          onClick={() => setActiveTab("cases")}
        >
          <i className="fa-solid fa-folder-open"></i>
          Case Management
        </button>

        {/* FR-34: Analytics */}
        <button
          className={`nav-btn ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          <i className="fa-solid fa-chart-line"></i>
          Analytics
        </button>

        {/* FR-35: Evidence Export */}
        <button
          className={`nav-btn ${activeTab === "export" ? "active" : ""}`}
          onClick={() => setActiveTab("export")}
        >
          <i className="fa-solid fa-file-export"></i>
          Evidence Export
        </button>
      </nav>

      {/* User Authentication */}
      <div
        className="user-auth-zone"
        style={{ marginTop: "auto", paddingTop: "30px" }}
      >
        {currentUser ? (
          <>
            <span className="user-badge logged-in">
              <i className="fa-solid fa-circle-user"></i>
              Hello, {currentUser}
            </span>

            <button
              className="logout-btn"
              onClick={onLogout}
            >
              <i className="fa-solid fa-right-from-bracket"></i>
              Logout
            </button>
          </>
        ) : (
          <button
            className="auth-btn"
            onClick={onOpenAuth}
          >
            <i className="fa-solid fa-right-to-bracket"></i>
            Login / Register
          </button>
        )}
      </div>
    </aside>
  );
}
