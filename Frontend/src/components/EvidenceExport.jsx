
import React, { useState } from "react";

export default function EvidenceExport() {
  const [exportType, setExportType] = useState("JSON");

  const evidence = [
    {
      id: 1,
      title: "Unauthorized Login",
      type: "Auth",
      status: "Pending",
      date: "2026-11-12",
      description: "Suspicious login attempt detected.",
    },
    {
      id: 2,
      title: "Network Traffic Analysis",
      type: "Network",
      status: "Completed",
      date: "2026-11-11",
      description: "Unusual network activity identified.",
    },
    {
      id: 3,
      title: "Server Log Review",
      type: "Server",
      status: "Processing",
      date: "2026-11-10",
      description: "Server logs are under review.",
    },
  ];

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    downloadFile(
      JSON.stringify(evidence, null, 2),
      "evidence-report.json",
      "application/json"
    );
  };

  const exportCSV = () => {
    const headers = Object.keys(evidence[0]);

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = evidence.map((item) =>
      headers.map((key) => escapeCSV(item[key])).join(",")
    );

    const csv = [
      headers.join(","),
      ...rows
    ].join("\r\n");

    downloadFile(
      "\uFEFF" + csv,
      "evidence-report.csv",
      "text/csv;charset=utf-8;"
    );
  };

  const exportPDF = () => {
    window.print();
  };

  const handleExport = () => {
    if (evidence.length === 0) {
      alert("No evidence available for export.");
      return;
    }

    if (exportType === "JSON") {
      exportJSON();
    } else if (exportType === "CSV") {
      exportCSV();
    } else if (exportType === "PDF") {
      exportPDF();
    }
  };

  return (
    <section className="tab-content active">
      <div className="section-card">
        <h2>
          <i className="fa-solid fa-file-export"></i>
          Multi-Format Evidence Export
        </h2>

        <p>
          Export investigation evidence and reports in different formats.
        </p>

        <div className="metrics-grid">
          <div className="metric-card">
            <i className="fa-solid fa-file-lines metric-icon"></i>
            <div>
              <h3>{evidence.length}</h3>
              <p>Available Records</p>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Select Export Format</label>
          <select
            value={exportType}
            onChange={(e) => setExportType(e.target.value)}
          >
            <option value="JSON">JSON</option>
            <option value="CSV">CSV</option>
            <option value="PDF">PDF / Print</option>
          </select>
        </div>

        <button
          className="submit-btn"
          onClick={handleExport}
          type="button"
        >
          <i className="fa-solid fa-download"></i>
          Export Evidence
        </button>
      </div>

      <div className="section-card">
        <h2>Export Preview</h2>

        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            color: "var(--text-primary)"
          }}>
            <thead>
              <tr>
                {["ID", "Title", "Type", "Status", "Date"].map(
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
                  <td style={{ padding: "12px" }}>{item.id}</td>
                  <td style={{ padding: "12px" }}>{item.title}</td>
                  <td style={{ padding: "12px" }}>{item.type}</td>
                  <td style={{ padding: "12px" }}>{item.status}</td>
                  <td style={{ padding: "12px" }}>{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
