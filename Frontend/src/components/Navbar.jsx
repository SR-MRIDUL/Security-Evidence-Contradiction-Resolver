
import React from 'react';

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
        width: '260px',
        minWidth: '260px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        float: 'left',
        boxSizing: 'border-box',
        padding: '20px 15px'
      }}
    >
      {/* Logo */}
      <div className="logo" style={{ marginBottom: '35px' }}>
        <i className="fa-solid fa-shield-halved"></i>
        <span>EvidenceResolver AI</span>
      </div>

      {/* Sidebar Navigation */}
      <nav
        className="nav-links"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: '12px',
          width: '100%'
        }}
      >
        <button
          className={`nav-btn ${
            activeTab === 'dashboard' ? 'active' : ''
          }`}
          onClick={() => setActiveTab('dashboard')}
        >
          <i className="fa-solid fa-chart-pie"></i>
          Dashboard
        </button>

        <button
          className={`nav-btn ${
            activeTab === 'upload' ? 'active' : ''
          }`}
          onClick={() => setActiveTab('upload')}
        >
          <i className="fa-solid fa-upload"></i>
          Upload Evidence
        </button>

        <button
          className={`nav-btn ${
            activeTab === 'timeline' ? 'active' : ''
          }`}
          onClick={() => setActiveTab('timeline')}
        >
          <i className="fa-solid fa-timeline"></i>
          Analysis & Timeline
        </button>
      </nav>

      {/* User Authentication */}
      <div
        className="user-auth-zone"
        style={{ marginTop: 'auto', paddingTop: '30px' }}
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
