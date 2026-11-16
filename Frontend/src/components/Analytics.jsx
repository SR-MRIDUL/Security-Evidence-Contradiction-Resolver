import React from "react";

export default function Analytics({ evidenceList = [], analysisResult = null }) {
  const report = analysisResult?.final_report || {};
  const metrics = [
    ["Investigations", evidenceList.length],
    ["Events analyzed", report.total_events ?? analysisResult?.analyzed_events?.length ?? 0],
    ["Correlations", report.total_correlations ?? analysisResult?.correlations?.length ?? 0],
    ["Potential contradictions", report.total_potential_contradictions ?? analysisResult?.contradictions?.length ?? 0],
    ["Threat indicators", report.total_threat_indicators ?? analysisResult?.threat_findings?.length ?? 0],
  ];

  return (
    <section className="tab-content active">
      <div className="section-card">
        <h2><i className="fa-solid fa-chart-column" /> Investigation Analytics</h2>
        <p>Live metrics from records and the most recently loaded investigation result. No sample/demo counts are mixed into these figures.</p>
        <div className="report-stat-grid">
          {metrics.map(([label, value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
        </div>
      </div>
      <div className="section-card">
        <h2>Current investigation assessment</h2>
        {analysisResult ? <>
          <p><strong>Status:</strong> {analysisResult.status || "completed"}</p>
          <p><strong>Heuristic confidence:</strong> {report.confidence || "Not available"}</p>
          <p>{report.summary || "No summary was stored for this result."}</p>
        </> : <p>No analysis result is currently loaded. Upload evidence and run the workflow to populate analytics.</p>}
      </div>
      <div className="section-card">
        <h2>Investigation records</h2>
        {evidenceList.length === 0 ? <p>No investigation records are available for this account.</p> : evidenceList.map((item) => (
          <div className="timeline-card" key={item.id}>
            <h4>{item.title}</h4>
            <p>{item.time} · Status: {item.status}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
