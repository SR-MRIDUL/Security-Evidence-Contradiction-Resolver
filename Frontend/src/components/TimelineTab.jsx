
import React from 'react';

export default function TimelineTab({ evidenceList = [] }) {
  return (
    <section className="tab-content active">
      <div className="section-card">
        <h2><i className="fa-solid fa-clock-rotate-left"></i> Forensic Incident Timeline</h2>
        <p>Sequential analysis of evidence events stored in system memory.</p>

        <div className="timeline-wrapper">
          {evidenceList.length === 0 ? (
            <p>No investigation events available yet.</p>
          ) : (
            evidenceList.map((item) => {
              const status = (item.status || "pending").toLowerCase();

              const isConflict = status === "contradiction";
              const badgeClass = isConflict || status === "failed"
                ? "danger"
                : status === "completed"
                  ? "verified"
                  : "";

              return (
                <div
                  key={item.id}
                  className={`timeline-event ${isConflict ? 'conflict' : ''}`}
                >
                  <div className="timeline-dot"></div>

                  <div className="timeline-card">
                    <h4>
                      <span>{item.title}</span>
                      <span className={`badge ${badgeClass}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </h4>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      Timestamp: {item.time} | Type: {item.type}
                    </p>

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                      {item.detail}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
