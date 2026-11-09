
import React from "react";

export default function DashboardTab({ evidenceList }) {
  const totalLogs = evidenceList.length;

  const contradictionCount = evidenceList.filter(
    (item) => item.status === "Contradiction"
  ).length;

  const verifiedCount = evidenceList.filter(
    (item) => item.status === "Verified"
  ).length;

  return (
    <section className="tab-content active">
      <div className="welcome-banner">
        <h1>Security Evidence Contradiction Resolver</h1>

        <p>
          Automated forensic system to analyze conflicting
          security logs and detect timeline anomalies.
        </p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <i className="fa-solid fa-file-shield metric-icon"></i>

          <div>
            <h3>{totalLogs}</h3>
            <p>Total Log Entries</p>
          </div>
        </div>

        <div className="metric-card warning">
          <i className="fa-solid fa-triangle-exclamation metric-icon"></i>

          <div>
            <h3>{contradictionCount}</h3>
            <p>Contradiction Detected</p>
          </div>
        </div>

        <div className="metric-card success">
          <i className="fa-solid fa-check-double metric-icon"></i>

          <div>
            <h3>{verifiedCount}</h3>
            <p>Verified Records</p>
          </div>
        </div>
      </div>

      <div className="section-card">
        <h2>
          <i className="fa-solid fa-bullseye"></i>
          Active Contradiction Flag
        </h2>

        <div className="contradiction-box">
          <div className="contradiction-header">
            <span className="badge danger">
              CRITICAL CONFLICT
            </span>

            <span className="timestamp">
              2026-11-07 14:32:10 UTC
            </span>
          </div>

          <h3>Geographical Speed Anomaly Detected</h3>

          <p>
            <strong>User Target:</strong> admin_user
          </p>

          <p>
            <strong>Conflict Detail:</strong>
            Account authenticated from{" "}
            <strong>IP 192.168.1.50 (Dhaka)</strong> and{" "}
            <strong>IP 45.12.89.2 (London)</strong>
            within a 4-minute window.
          </p>

          <div className="evidence-comparison">
            <div className="evidence-item">
              Log #101: Web Portal Auth Success (Dhaka) - 14:28:10
            </div>

            <div className="evidence-item highlight">
              Log #102: SSH Access Grant (London) - 14:32:10
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
