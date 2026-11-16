import React from "react";

export default function Navbar({ activeTab, setActiveTab, currentUser, onLogout }) {
  const role = currentUser?.role || "user";
  const historyLabel = role === "admin" ? "All Uploads" : role === "analyst" ? "Review Queue" : "My Upload History";
  const items = [
    ["dashboard", "fa-chart-pie", "Dashboard"],
    ["upload", "fa-upload", "Upload Evidence"],
    ["history", "fa-clock-rotate-left", historyLabel],
    ["timeline", "fa-timeline", "Analysis & Timeline"],
    ["export", "fa-file-export", "Evidence Export"],
  ];
  if (role === "analyst" || role === "admin") items.push(["analytics", "fa-chart-line", "Analytics"]);
  if (role === "admin") items.push(["admin", "fa-user-shield", "Admin Console"]);

  const roleLabel = role === "admin" ? "Administrator" : role === "analyst" ? "Security Analyst" : role === "guest" ? "Guest" : "Normal User";
  return (
    <aside className="navbar sidebar-navbar" style={{ width: "260px", minWidth: "260px", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "stretch", float: "left", boxSizing: "border-box", padding: "20px 15px" }}>
      <div className="logo" style={{ marginBottom: "35px" }}><i className="fa-solid fa-shield-halved" /><span>EvidenceResolver AI</span></div>
      <nav className="nav-links" style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: "12px", width: "100%" }}>
        {items.map(([id, icon, label]) => <button key={id} className={`nav-btn ${activeTab === id ? "active" : ""}`} onClick={() => setActiveTab(id)}><i className={`fa-solid ${icon}`} />{label}</button>)}
        <button className="nav-btn" type="button" disabled title="Company server integration is planned for a future release." style={{ opacity: 0.55, cursor: "not-allowed" }}><i className="fa-solid fa-plug" />Company API <small style={{ marginLeft: "auto" }}>Coming Soon</small></button>
      </nav>
      <div className="user-auth-zone" style={{ marginTop: "auto", paddingTop: "30px" }}>
        <span className="user-badge logged-in"><i className="fa-solid fa-circle-user" />Hello, {currentUser?.full_name}</span>
        <span className={`role-pill ${role}`}>{roleLabel}</span>
        <button className="logout-btn" onClick={onLogout}><i className="fa-solid fa-right-from-bracket" />Logout</button>
      </div>
    </aside>
  );
}
