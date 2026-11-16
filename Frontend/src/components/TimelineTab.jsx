import React from "react";

export default function TimelineTab({ evidenceList = [], analysisResult = null }) {
  const timeline = analysisResult?.timeline || [];

  return (
    <section className="tab-content active">
      <div className="section-card">
        <h2><i className="fa-solid fa-clock-rotate-left"></i> Forensic Event Timeline</h2>
        <p>Chronological security events reconstructed by Agent 5.</p>

        <div className="timeline-wrapper">
          {timeline.length === 0 ? (
            <p>No analyzed security-event timeline is available. Upload evidence and run an investigation first.</p>
          ) : (
            timeline.map((event, index) => (
              <div className="timeline-event" key={`${event.event_id || "event"}-${index}`}>
                <div className="timeline-dot"></div>
                <div className="timeline-card">
                  <h4>{event.event_id || `Event ${index + 1}`} — {event.event_type || "Unknown event"}</h4>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    {event.timestamp || "Timestamp unavailable"} | Source: {event.source || "Unknown"}
                  </p>
                  <p><strong>User:</strong> {event.username || "Unknown"} | <strong>IP:</strong> {event.ip_address || "Unknown"}</p>
                  <p><strong>Location:</strong> {event.location || "Unknown"}</p>
                  <p style={{ wordBreak: "break-word" }}>{event.raw_evidence}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="section-card">
        <h2><i className="fa-solid fa-folder-open"></i> Investigation Records</h2>
        {evidenceList.length === 0 ? <p>No investigation records found.</p> : (
          evidenceList.map((item) => (
            <div className="timeline-card" key={item.id}>
              <h4>{item.title}</h4>
              <p>{item.time} | Status: {item.status}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
