import React, { useState } from "react";
import { getUploadedFileContent } from "../api";

function formatSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function UploadHistory({ history = [], onView }) {
  const [expandedFileId, setExpandedFileId] = useState(null);
  const [originalContents, setOriginalContents] = useState({});
  const [contentLoadingId, setContentLoadingId] = useState(null);
  const [contentErrors, setContentErrors] = useState({});

  const toggleOriginalContent = async (fileId) => {
    if (expandedFileId === fileId) {
      setExpandedFileId(null);
      return;
    }
    setExpandedFileId(fileId);
    if (originalContents[fileId] !== undefined) return;
    try {
      setContentLoadingId(fileId);
      setContentErrors((old) => ({ ...old, [fileId]: "" }));
      const result = await getUploadedFileContent(fileId);
      setOriginalContents((old) => ({ ...old, [fileId]: result.content || "" }));
    } catch (error) {
      setContentErrors((old) => ({ ...old, [fileId]: error.message || "Could not load original file content." }));
    } finally {
      setContentLoadingId(null);
    }
  };

  return (
    <section className="tab-content active">
      <div className="section-card">
        <div className="history-heading">
          <div>
            <h2><i className="fa-solid fa-clock-rotate-left" /> Previous Uploads & Findings</h2>
            <p>Review every file you previously uploaded, its analysis status and the problems detected.</p>
          </div>
          <span className="history-count">{history.length} uploads</span>
        </div>
        {history.length === 0 ? <div className="empty-state"><i className="fa-regular fa-folder-open" /><p>No uploaded files yet. Upload a security log to start your first investigation.</p></div> : (
          <div className="upload-history-list">
            {history.map((item) => {
              const file = item.file || {};
              const investigation = item.investigation || {};
              const report = item.analysis?.final_report || {};
              const contradictions = item.analysis?.contradictions?.length ?? report.total_potential_contradictions ?? 0;
              const threats = item.analysis?.threat_findings?.length ?? report.total_threat_indicators ?? 0;
              const events = report.total_events ?? item.analysis?.analyzed_events?.length ?? 0;
              return (
                <article className="upload-history-card" key={file.id || investigation.id}>
                  <div className="upload-history-top">
                    <div className="history-file-icon"><i className="fa-solid fa-file-shield" /></div>
                    <div className="history-file-info">
                      <h3>{file.original_filename || investigation.title || "Uploaded evidence"}</h3>
                      <p>{file.uploaded_at ? new Date(file.uploaded_at).toLocaleString() : "Upload date unavailable"} · {formatSize(file.file_size)} · {(file.file_type || "file").toUpperCase()}</p>
                    </div>
                    <span className={`badge ${investigation.status === "completed" ? "verified" : investigation.status === "failed" ? "danger" : "warning"}`}>{investigation.status || "unknown"}</span>
                  </div>
                  <div className="history-findings-grid">
                    <div><strong>{events}</strong><span>Events analyzed</span></div>
                    <div><strong>{contradictions}</strong><span>Potential contradictions</span></div>
                    <div><strong>{threats}</strong><span>Threat indicators</span></div>
                  </div>
                  {report.summary && <p className="history-summary">{report.summary}</p>}
                  {item.uploaded_by?.full_name && <p className="history-hash"><strong>Uploaded by:</strong> {item.uploaded_by.full_name} ({item.uploaded_by.email})</p>}
                  {file.sha256 && <p className="history-hash"><strong>SHA-256:</strong> {file.sha256}</p>}
                  <div className="history-card-actions">
                    <button type="button" className="secondary-btn" onClick={() => onView(item)} disabled={!item.analysis}>View full analysis & agent outputs</button>
                    <button type="button" className="secondary-btn" onClick={() => toggleOriginalContent(file.id)} disabled={contentLoadingId === file.id}>
                      {contentLoadingId === file.id ? "Loading original file..." : expandedFileId === file.id ? "Hide original file data" : "View original file data"}
                    </button>
                  </div>
                  {expandedFileId === file.id && (
                    <div className="original-file-viewer">
                      <h4>Original uploaded data</h4>
                      {contentErrors[file.id] && <p className="error-msg">{contentErrors[file.id]}</p>}
                      {originalContents[file.id] !== undefined && <pre>{originalContents[file.id]}</pre>}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
