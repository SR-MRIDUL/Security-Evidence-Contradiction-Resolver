import React from 'react';

export default function Navbar({ activeTab, setActiveTab, currentUser, onLogout, onOpenAuth }) {
  return (
    <header className="navbar">
      <div className="logo">
        <i className="fa-solid fa-shield-halved"></i>
        <span>EvidenceResolver AI</span>
      </div>

      <nav className="nav-links">
        <button 
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} 
          onClick={() => setActiveTab('dashboard')}
        >
          <i className="fa-solid fa-chart-pie"></i> Dashboard
        </button>
        <button 
          className={`nav-btn ${activeTab === 'upload' ? 'active' : ''}`} 
          onClick={() => setActiveTab('upload')}
        >
          <i className="fa-solid fa-upload"></i> Upload Evidence
        </button>
        <button 
          className={`nav-btn ${activeTab === 'timeline' ? 'active' : ''}`} 
          onClick={() => setActiveTab('timeline')}
        >
          <i className="fa-solid fa-timeline"></i> Analysis & Timeline
        </button>
      </nav>

      <div className="user-auth-zone">
        {currentUser ? (
          <>
            <span className="user-badge logged-in">
              <i className="fa-solid fa-circle-user"></i> Hello, {currentUser}
            </span>
            <button className="logout-btn" onClick={onLogout}>
              <i className="fa-solid fa-right-from-bracket"></i> Logout
            </button>
          </>
        ) : (
          <button className="auth-btn" onClick={onOpenAuth}>
            <i className="fa-solid fa-right-to-bracket"></i> Login / Register
          </button>
        )}
      </div>
    </header>
  );
}