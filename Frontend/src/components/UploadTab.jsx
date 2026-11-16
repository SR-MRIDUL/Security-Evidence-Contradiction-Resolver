import React, { useRef, useState } from "react";

const ALLOWED_EXTENSIONS = [".csv", ".json", ".txt", ".log"];

export default function UploadTab({ onAddEvidence, loading = false }) {
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      alert("Please select a security evidence file first.");
      return;
    }
    const name = file.name.toLowerCase();
    if (!ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
      alert("Supported formats: CSV, JSON, TXT and LOG.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Maximum file size is 10 MB.");
      return;
    }
    try {
      await onAddEvidence(file);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (error) {
      console.error("Evidence upload failed:", error);
    }
  };

  return (
    <section className="tab-content active">
      <div className="section-card upload-panel">
        <h2><i className="fa-solid fa-cloud-arrow-up" /> Upload Security Evidence</h2>
        <p>Select a security log file. SERCR will automatically create an investigation, run its analysis agents and save the report to your account.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="evidence-file">Choose evidence file</label>
            <input
              ref={inputRef}
              id="evidence-file"
              className="file-input"
              type="file"
              accept=".csv,.json,.txt,.log"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
            <small style={{ color: "var(--text-secondary)", display: "block", marginTop: "0.5rem" }}>
              CSV, JSON, TXT or LOG · Maximum 10 MB · UTF-8 text files
            </small>
          </div>
          {file && (
            <div className="selected-file-summary">
              <i className="fa-solid fa-file-lines" />
              <span>{file.name}</span>
              <small>{(file.size / 1024).toFixed(1)} KB</small>
            </div>
          )}
          <button type="submit" className="submit-btn" disabled={loading || !file}>
            <i className="fa-solid fa-microchip" />
            {loading ? "Uploading & Analyzing..." : "Upload & Analyze Evidence"}
          </button>
        </form>
      </div>
    </section>
  );
}
