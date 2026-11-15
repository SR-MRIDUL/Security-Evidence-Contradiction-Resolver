import React, { useRef, useState } from "react";

const ALLOWED_EXTENSIONS = [".csv", ".json", ".txt", ".log"];

export default function UploadTab({ onAddEvidence, loading = false }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Auth");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedContent = content.trim();
    const trimmedTitle = title.trim();

    if (!file && !trimmedContent) {
      alert("Please paste log content or select a file.");
      return;
    }

    if (file) {
      const lowerName = file.name.toLowerCase();
      if (!ALLOWED_EXTENSIONS.some((extension) => lowerName.endsWith(extension))) {
        alert("Only CSV, JSON, TXT and LOG files are supported.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("Maximum file size is 10 MB.");
        return;
      }
    }

    try {
      await onAddEvidence(
        trimmedTitle || (file ? file.name : "Manual Log Entry"),
        type,
        trimmedContent,
        file
      );
      setTitle("");
      setType("Auth");
      setContent("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Evidence submission failed:", error);
    }
  };

  return (
    <section className="tab-content active">
      <div className="section-card">
        <h2><i className="fa-solid fa-cloud-arrow-up"></i> Upload Security Evidence</h2>
        <p>Upload a log file or paste raw security log text. The backend will parse and analyze it with the five-agent workflow.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="evidence-title">Investigation Title</label>
            <input
              id="evidence-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Suspicious Login Investigation"
            />
          </div>

          <div className="form-group">
            <label htmlFor="evidence-type">Log Classification</label>
            <select id="evidence-type" value={type} onChange={(event) => setType(event.target.value)}>
              <option value="Auth">User Authentication</option>
              <option value="Network">Network Traffic / Packet</option>
              <option value="System">System Event Log</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="evidence-content">Paste Log Content (optional if file selected)</label>
            <textarea
              id="evidence-content"
              rows="7"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={'Example: timestamp=2026-11-15T09:00:00Z username=admin ip=192.168.1.50 location=Dhaka event=login_success'}
              disabled={Boolean(file)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="evidence-file">Select Evidence File (.csv, .json, .txt, .log)</label>
            <input
              ref={fileInputRef}
              id="evidence-file"
              className="file-input"
              type="file"
              accept=".csv,.json,.txt,.log"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
            <small style={{ color: "var(--text-secondary)", display: "block", marginTop: "0.3rem" }}>
              Maximum size: 10 MB. UTF-8 text files only.
            </small>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            <i className="fa-solid fa-microchip"></i>
            {loading ? "Analyzing..." : "Upload & Run 5 Agents"}
          </button>
        </form>
      </div>
    </section>
  );
}
