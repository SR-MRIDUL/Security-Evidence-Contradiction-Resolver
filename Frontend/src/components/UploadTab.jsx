
import React, { useRef, useState } from "react";

const ALLOWED_EXTENSIONS = [".csv", ".json", ".txt", ".log"];

export default function UploadTab({ onAddEvidence, loading = false }) {
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [success, setSuccess] = useState(false);

  const inputRef = useRef(null);

  const isBusy = loading || isSubmitting;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isBusy || launching) return;

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
      setIsSubmitting(true);

      // Existing upload and analysis function
      await onAddEvidence(file);

      setIsSubmitting(false);

      // Rocket launches after successful analysis
      setLaunching(true);

      await new Promise((resolve) => setTimeout(resolve, 1200));

      setLaunching(false);
      setSuccess(true);

      setFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

    } catch (error) {
      console.error("Evidence upload failed:", error);

      setIsSubmitting(false);
      setLaunching(false);

      alert(
        error?.message ||
        "Evidence upload or analysis failed. Please try again."
      );
    }
  };

  // Success Screen
  if (success) {
    return (
      <section className="tab-content active">
        <div className="section-card upload-success-card">

          <div className="success-check">
            <i className="fa-solid fa-check"></i>
          </div>

          <h2>Analysis Completed Successfully!</h2>

          <p>
            Your security evidence has been successfully uploaded
            and analyzed. Your investigation report is ready.
          </p>

          <button
            className="submit-btn"
            type="button"
            onClick={() => setSuccess(false)}
          >
            <i className="fa-solid fa-file-shield"></i>
            Done
          </button>

        </div>
      </section>
    );
  }

  return (
    <section className="tab-content active">

      <div className="section-card upload-panel">

        <h2>
          <i className="fa-solid fa-cloud-arrow-up" />
          {" "}Upload Security Evidence
        </h2>

        <p>
          Select a security log file. SERCR will automatically
          create an investigation, run its analysis agents and
          save the report to your account.
        </p>

        <form onSubmit={handleSubmit}>

          <div className="form-group">

            <label htmlFor="evidence-file">
              Choose evidence file
            </label>

            <input
              ref={inputRef}
              id="evidence-file"
              className="file-input"
              type="file"
              accept=".csv,.json,.txt,.log"
              disabled={isBusy || launching}
              onChange={(event) =>
                setFile(event.target.files?.[0] || null)
              }
            />

            <small
              style={{
                color: "var(--text-secondary)",
                display: "block",
                marginTop: "0.5rem"
              }}
            >
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

          <button
            type="submit"
            className={`submit-btn rocket-upload-btn
              ${isBusy ? "is-loading" : ""}
              ${launching ? "is-launching" : ""}`}
            disabled={isBusy || launching || !file}
          >

            <span className="rocket-button-text">
              <i className="fa-solid fa-microchip"></i>
              {" "}
              Upload & Analyze Evidence
            </span>

            <span className="rocket-animation">

              <span className="rocket-loading-ring"></span>

              <span className="rocket-fire"></span>

              <svg
                className="rocket-image"
                viewBox="0 0 64 64"
                fill="none"
              >
                <path
                  d="M32 4C21 14 19 27 20 39L32 49L44 39C45 27 43 14 32 4Z"
                  fill="#FFFFFF"
                />

                <path
                  d="M32 4C32 4 21 17 22 34L32 43L42 34C43 17 32 4 32 4Z"
                  fill="#DBEAFE"
                />

                <circle cx="32" cy="25" r="5" fill="#2563EB" />

                <path
                  d="M20 29L9 38L19 41L22 35"
                  fill="#FFFFFF"
                />

                <path
                  d="M44 29L55 38L45 41L42 35"
                  fill="#FFFFFF"
                />

                <path
                  d="M27 47L32 58L37 47"
                  fill="#F59E0B"
                />

                <path
                  d="M29 47L32 54L35 47"
                  fill="#EF4444"
                />
              </svg>

            </span>

          </button>

        </form>

      </div>

    </section>
  );
}
