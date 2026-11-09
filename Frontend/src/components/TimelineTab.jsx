import React from 'react';

export default function TimelineTab({ evidenceList }) {
  return (
    <section className="tab-content active">
      <div className="section-card">
        <h2><i className="fa-solid fa-clock-rotate-left"></i> Forensic Incident Timeline</h2>
        <p>Sequential analysis of evidence events stored in system memory.</p>

        <div className="timeline-wrapper">
          {evidenceList.map((item) => {
            const isConflict = item.status === "Contradiction";
            return (
              <div key={item.id} className={`timeline-event ${isConflict ? 'conflict' : ''}`}>
                <div className="timeline-dot"></div>
                <div className="timeline-card">
                  <h4>
                    <span>{item.title}</span>
                    <span className={`badge ${isConflict ? 'danger' : 'verified'}`}>{item.status}</span>
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
          })}
        </div>
      </div>
    </section>
  );
}