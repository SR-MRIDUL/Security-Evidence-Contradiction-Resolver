
import React, { useState, useRef } from "react";

export default function UploadTab({ onAddEvidence }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Auth");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);

  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let finalContent = content.trim();
      let finalTitle = title.trim();

      // Read Uploaded File
      if (file) {
        finalContent = await file.text();

        if (!finalTitle) {
          finalTitle = file.name;
        }
      }

      // Validate Content
      if (!finalContent) {
        alert(
          "Please provide text payload or upload a file!"
        );
        return;
      }

      if (!finalTitle) {
        finalTitle = "Manual Log Entry";
      }

      // Send Evidence to App
      onAddEvidence(
        finalTitle,
        type,
        finalContent
      );

      // Reset Form
      setTitle("");
      setType("Auth");
      setContent("");
      setFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("File processing error:", error);

      alert("Unable to process the selected file!");
    }
  };

  return (
    <section className="tab-content active">
      <div className="section-card">
        <h2>
          <i className="fa-solid fa-cloud-arrow-up"></i>
          Upload Security Evidence
        </h2>

        <p>
          Submit raw system log payloads to parse and check
          against current database records.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="evidence-title">
              Log Label / Title
            </label>

            <input
              type="text"
              id="evidence-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. auth_access_kernel.log"
              required={!file}
            />
          </div>

          <div className="form-group">
            <label htmlFor="evidence-type">
              Log Classification
            </label>

            <select
              id="evidence-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="Auth">
                User Authentication
              </option>

              <option value="Network">
                Network Traffic / Packet
              </option>

              <option value="System">
                System Event Log
              </option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="evidence-content">
              Log Payload Content
            </label>

            <textarea
              id="evidence-content"
              rows="6"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste log payload here..."
              required={!file}
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="evidence-file">
              Upload Log File (.log, .txt, .json)
            </label>

            <input
              ref={fileInputRef}
              type="file"
              id="evidence-file"
              className="file-input"
              accept=".log,.txt,.json"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
              }}
            />

            <small
              style={{
                color: "var(--text-secondary)",
                display: "block",
                marginTop: "0.3rem",
              }}
            >
              You can upload a file or paste text below.
            </small>
          </div>

          <button type="submit" className="submit-btn">
            <i className="fa-solid fa-database"></i>
            Process & Register Evidence
          </button>
        </form>
      </div>
    </section>
  );
}
