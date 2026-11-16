import React, { useMemo, useState } from "react";

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export default function EvidenceExport({ history = [], analysisResult = null }) {
  const [exportType, setExportType] = useState("JSON");
  const exportRows = useMemo(() => history.map((item) => {
    const file = item.file || {};
    const investigation = item.investigation || {};
    const report = item.analysis?.final_report || {};
    return {
      file_id: file.id,
      filename: file.original_filename,
      uploaded_at: file.uploaded_at,
      uploaded_by: item.uploaded_by?.email || "",
      status: investigation.status || "unknown",
      events_analyzed: report.total_events ?? item.analysis?.analyzed_events?.length ?? 0,
      correlations: report.total_correlations ?? item.analysis?.correlations?.length ?? 0,
      potential_contradictions: report.total_potential_contradictions ?? item.analysis?.contradictions?.length ?? 0,
      threat_indicators: report.total_threat_indicators ?? item.analysis?.threat_findings?.length ?? 0,
      summary: report.summary || "",
      sha256: file.sha256 || "",
    };
  }), [history]);

  const exportJSON = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      uploads: history,
      selected_analysis: analysisResult,
    };
    downloadFile(JSON.stringify(payload, null, 2), "sercr-investigation-export.json", "application/json");
  };

  const exportCSV = () => {
    if (!exportRows.length) return;
    const headers = Object.keys(exportRows[0]);
    const rows = [headers.map(csvCell).join(","), ...exportRows.map((row) => headers.map((key) => csvCell(row[key])).join(","))];
    downloadFile("\uFEFF" + rows.join("\r\n"), "sercr-upload-history.csv", "text/csv;charset=utf-8;");
  };

  const handleExport = () => {
    if (!history.length && !analysisResult) {
      alert("There is no investigation data to export yet.");
      return;
    }
    if (exportType === "JSON") exportJSON();
    else if (exportType === "CSV") exportCSV();
    else window.print();
  };

  return (
    <section className="tab-content active">
      <div className="section-card">
        <h2><i className="fa-solid fa-file-export" /> Export Investigation Data</h2>
        <p>Export the actual saved upload history and investigation results. No sample records are included.</p>
        <div className="report-stat-grid">
          <div><strong>{history.length}</strong><span>Uploaded files</span></div>
          <div><strong>{exportRows.reduce((sum, row) => sum + Number(row.events_analyzed || 0), 0)}</strong><span>Events analyzed</span></div>
          <div><strong>{exportRows.reduce((sum, row) => sum + Number(row.threat_indicators || 0), 0)}</strong><span>Threat indicators</span></div>
        </div>
        <div className="form-group">
          <label htmlFor="export-format">Select export format</label>
          <select id="export-format" value={exportType} onChange={(event) => setExportType(event.target.value)}>
            <option value="JSON">JSON — complete saved results</option>
            <option value="CSV">CSV — upload summary</option>
            <option value="PDF">Print / Save as PDF</option>
          </select>
        </div>
        <button className="submit-btn" onClick={handleExport} type="button">
          <i className="fa-solid fa-download" /> Export Data
        </button>
      </div>
      <div className="section-card">
        <h2>Export Preview</h2>
        {exportRows.length === 0 ? <p>No uploaded evidence is available to export.</p> : (
          <div className="table-scroll">
            <table className="admin-users-table">
              <thead><tr><th>File</th><th>Status</th><th>Events</th><th>Contradictions</th><th>Threat indicators</th></tr></thead>
              <tbody>{exportRows.map((row) => (
                <tr key={row.file_id}><td>{row.filename}</td><td>{row.status}</td><td>{row.events_analyzed}</td><td>{row.potential_contradictions}</td><td>{row.threat_indicators}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
