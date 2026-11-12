
import React, { useState } from "react";

export default function SecureEvidence() {
  const [evidence] = useState([
    {
      id: 1,
      name: "server_logs.txt",
      type: "Text File",
      size: "24 KB",
      hash: "a81f...92bc",
      status: "Protected",
    },
    {
      id: 2,
      name: "network_capture.pcap",
      type: "PCAP File",
      size: "2.4 MB",
      hash: "b72e...41ad",
      status: "Protected",
    },
    {
      id: 3,
      name: "system_report.pdf",
      type: "PDF",
      size: "850 KB",
      hash: "c93d...72ef",
      status: "Pending",
    },
  ]);

  return (
    <section className="tab-content active">
      <div className="section-card">
        <h2>
          <i className="fa-solid fa-shield-halved"></i>
          Secure Evidence Storage
        </h2>

        <p>
          Review evidence protection information and security status.
        </p>

        <div className="metrics-grid">
          <div className="metric-card success">
            <i className="fa-solid fa-lock metric-icon"></i>
            <div>
              <h3>2</h3>
              <p>Protected Files</p>
            </div>
          </div>

          <div className="metric-card warning">
            <i className="fa-solid fa-clock metric-icon"></i>
            <div>
              <h3>1</h3>
              <p>Pending Review</p>
            </div>
          </div>

          <div className="metric-card">
            <i className="fa-solid fa-file-shield metric-icon"></i>
            <div>
              <h3>3</h3>
              <p>Total Evidence</p>
            </div>
          </div>
        </div>

        <h3 style={{ marginBottom: "15px" }}>
          Evidence Security Information
        </h3>

        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            color: "var(--text-primary)"
          }}>
            <thead>
              <tr>
                {["File Name", "Type", "Size", "Hash", "Status"].map(
                  (heading) => (
                    <th key={heading} style={{
                      padding: "12px",
                      textAlign: "left",
                      borderBottom: "1px solid var(--border-color)"
                    }}>
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {evidence.map((item) => (
                <tr key={item.id}>
                  <td style={{ padding: "12px", borderBottom: "1px solid var(--border-color)" }}>
                    {item.name}
                  </td>
                  <td style={{ padding: "12px", borderBottom: "1px solid var(--border-color)" }}>
                    {item.type}
                  </td>
                  <td style={{ padding: "12px", borderBottom: "1px solid var(--border-color)" }}>
                    {item.size}
                  </td>
                  <td style={{ padding: "12px", borderBottom: "1px solid var(--border-color)" }}>
                    <code>{item.hash}</code>
                  </td>
                  <td style={{ padding: "12px", borderBottom: "1px solid var(--border-color)" }}>
                    <span className={`badge ${
                      item.status === "Protected" ? "verified" : ""
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{
          marginTop: "20px",
          padding: "15px",
          background: "var(--bg-input)",
          border: "1px solid var(--border-color)",
          borderRadius: "6px"
        }}>
          <h4 style={{ color: "var(--accent-blue)", marginBottom: "8px" }}>
            <i className="fa-solid fa-circle-info"></i>
            Security Notice
          </h4>
          <p style={{ marginBottom: 0 }}>
            Encryption, hash verification and secure storage must be
            implemented and verified by the backend.
            The information above is demonstration data.
          </p>
        </div>
      </div>
    </section>
  );
}
