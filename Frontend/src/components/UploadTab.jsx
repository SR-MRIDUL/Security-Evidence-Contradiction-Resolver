
import React, { useRef, useState } from "react";

const ALLOWED_EXTENSIONS = [".csv", ".json", ".txt", ".log"];

export default function UploadTab({
  onAddEvidence,
  loading = false
}) {
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [success, setSuccess] = useState(false);

  const inputRef = useRef(null);

  const isBusy = loading || isSubmitting || launching;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isBusy) return;

    if (!file) {
      alert("Please select a security evidence file first.");
      return;
    }

    const name = file.name.toLowerCase();

    if (
      !ALLOWED_EXTENSIONS.some((ext) =>
        name.endsWith(ext)
      )
    ) {
      alert("Supported formats: CSV, JSON, TXT and LOG.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Maximum file size is 10 MB.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload and analysis
      await onAddEvidence(file);

      // Start rocket only after successful operation
      setIsSubmitting(false);
      setLaunching(true);

      await new Promise((resolve) =>
        setTimeout(resolve, 1300)
      );

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

  // SUCCESS SCREEN
  if (success) {
    return (
      <section className="tab-content active">
        <div className="section-card upload-success-card">

          <div className="success-check">
            <i className="fa-solid fa-check"></i>
          </div>

          <h2>
            Analysis Completed Successfully!
          </h2>

          <p>
            Your security evidence has been successfully
            uploaded and analyzed. Your investigation
            report is ready.
          </p>

          <button
            className="submit-btn"
            type="button"
            onClick={() => setSuccess(false)}
          >
            <i className="fa-solid fa-file-shield"></i>
            {" "}Done
          </button>

        </div>
      </section>
    );
  }

  // UPLOAD SCREEN
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
              disabled={isBusy}
              onChange={(event) =>
                setFile(event.target.files?.[0] || null)
              }
            />

            <small className="upload-file-hint">
              CSV, JSON, TXT or LOG · Maximum 10 MB · UTF-8 text files
            </small>

          </div>

          {file && (
            <div className="selected-file-summary">

              <i className="fa-solid fa-file-lines" />

              <span>{file.name}</span>

              <small>
                {(file.size / 1024).toFixed(1)} KB
              </small>

            </div>
          )}

          <button
            type="submit"
            className={`submit-btn rocket-upload-btn ${
              isSubmitting ? "is-loading" : ""
            } ${
              launching ? "is-launching" : ""
            }`}
            disabled={isBusy || !file}
          >

            <span className="rocket-button-text">
              <i className="fa-solid fa-microchip"></i>
              {" "}Upload & Analyze Evidence
            </span>

            {/* ROCKET ANIMATION */}

            <span className="rocket-animation">

              {/* Loading Ring */}

              <span className="rocket-loading-ring">

                <svg viewBox="0 0 100 100">
                  <circle
                    className="rocket-ring-track"
                    cx="50"
                    cy="50"
                    r="44"
                  />

                  <circle
                    className="rocket-ring-progress"
                    cx="50"
                    cy="50"
                    r="44"
                  />
                </svg>

              </span>

              {/* Smoke Trail */}

              <span className="rocket-smoke">

                <span className="smoke-particle smoke-one"></span>

                <span className="smoke-particle smoke-two"></span>

                <span className="smoke-particle smoke-three"></span>

              </span>

              {/* Rocket Fire */}

              <span className="rocket-fire"></span>

              {/* Rocket SVG */}

              <svg
                className="rocket-image"
                viewBox="0 0 64 64"
                fill="none"
                aria-hidden="true"
              >

                <path
                  d="M32 4C21 14 19 27 20 39L32 49L44 39C45 27 43 14 32 4Z"
                  fill="#2563EB"
                />

                <path
                  d="M32 4C32 4 21 17 22 34L32 43L42 34C43 17 32 4 32 4Z"
                  fill="#DBEAFE"
                />

                <circle
                  cx="32"
                  cy="25"
                  r="5"
                  fill="#2563EB"
                />

                <path
                  d="M20 29L9 38L19 41L22 35"
                  fill="#60A5FA"
                />

                <path
                  d="M44 29L55 38L45 41L42 35"
                  fill="#60A5FA"
                />

                <path
                  className="rocket-flame-outer"
                  d="M25 46Q32 57 32 64Q32 57 39 46Z"
                  fill="#F97316"
                />

                <path
                  className="rocket-flame-inner"
                  d="M29 46Q32 54 35 46Z"
                  fill="#FDE68A"
                />

              </svg>

            </span>

          </button>

        </form>

      </div>

    </section>
  );
}
