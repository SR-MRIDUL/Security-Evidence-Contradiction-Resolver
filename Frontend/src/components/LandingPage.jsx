import React from 'react';

export default function LandingPage({ onOpenAuth, onContinueGuest }) {
  return (
    <section className="landing-overlay">
      <div className="landing-bg-decor">
        <i className="fa-solid fa-shield-halved landing-watermark"></i>
      </div>

      <div className="landing-card">
        <div className="landing-logo">
          <i className="fa-solid fa-shield-halved logo-icon"></i>
          <h2>EvidenceResolver AI</h2>
          <span className="sub-tag">Forensic Intelligence System</span>
        </div>

        <p className="landing-desc">
          Automated forensic system to analyze conflicting security logs and detect timeline anomalies.
        </p>

        <div className="landing-actions">
          <button className="landing-btn primary" onClick={onOpenAuth}>
            <i className="fa-solid fa-right-to-bracket"></i> Login / Register
          </button>

          <button className="landing-btn secondary" onClick={onContinueGuest}>
            <i className="fa-solid fa-user-secret"></i> Continue as Guest
          </button>
        </div>
      </div>
    </section>
  );
}