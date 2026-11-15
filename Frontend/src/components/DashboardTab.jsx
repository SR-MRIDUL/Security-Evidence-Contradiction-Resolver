import React from "react";

const AGENTS = [
  "Log Analyzer",
  "Evidence Correlation",
  "Contradiction Detector",
  "Timeline Reconstructor",
  "Evidence Reconciliation",
];

export default function DashboardTab({ evidenceList = [], analysisResult = null }) {
  const report = analysisResult?.final_report;
  const agentOutputs = analysisResult?.agent_outputs || [];
  const contradictions = analysisResult?.contradictions || [];
  const totalEvents = report?.total_events ?? 0;

  return (
    <section className="tab-content active">
      <div className="welcome-banner">
        <h1>Security Evidence Contradiction Resolver</h1>
        <p>Multi-agent security investigation and evidence reconciliation dashboard.</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <i className="fa-solid fa-folder-open metric-icon"></i>
          <div><h3>{evidenceList.length}</h3><p>Investigations</p></div>
        </div>
        <div className="metric-card">
          <i className="fa-solid fa-file-shield metric-icon"></i>
          <div><h3>{totalEvents}</h3><p>Events Analyzed</p></div>
        </div>
        <div className="metric-card warning">
          <i className="fa-solid fa-triangle-exclamation metric-icon"></i>
          <div><h3>{contradictions.length}</h3><p>Potential Contradictions</p></div>
        </div>
      </div>

      <div className="section-card">
        <h2><i className="fa-solid fa-robot"></i> Agent Activity</h2>
        {!analysisResult ? (
          <p>No analysis result loaded yet. Upload evidence to run the five agents.</p>
        ) : (
          <div className="timeline-wrapper">
            {AGENTS.map((name) => {
              const output = agentOutputs.find((item) => item.agent === name);
              return (
                <div className="timeline-event" key={name}>
                  <div className="timeline-dot"></div>
                  <div className="timeline-card">
                    <h4>
                      <span>{name}</span>
                      <span className={`badge ${output?.status === "completed" ? "verified" : "danger"}`}>
                        {output?.status || "Not run"}
                      </span>
                    </h4>
                    <p>
                      Execution time: {output ? `${output.execution_time_ms} ms` : "N/A"}
                    </p>
                    {output && (
                      <details>
                        <summary>View agent output</summary>
                        <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                          {JSON.stringify(output.result, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="section-card">
        <h2><i className="fa-solid fa-triangle-exclamation"></i> Potential Contradictions</h2>
        {contradictions.length === 0 ? (
          <p>No potential contradictions in the currently loaded analysis.</p>
        ) : (
          contradictions.map((item, index) => (
            <div className="contradiction-box" key={`${item.event_ids?.join("-") || index}`}>
              <span className="badge danger">{item.severity || "suspicious"}</span>
              <h3>{item.username || "Unknown user"} — location inconsistency</h3>
              <p>{item.first_location} ({item.first_ip}) → {item.second_location} ({item.second_ip})</p>
              <p>Time difference: {item.time_difference_minutes} minutes</p>
              <p>Evidence: {(item.event_ids || []).join(", ")}</p>
              <small>{item.interpretation}</small>
            </div>
          ))
        )}
      </div>

      <div className="section-card">
        <h2><i className="fa-solid fa-file-lines"></i> Final Investigation Report</h2>
        {report ? (
          <>
            <p><strong>Summary:</strong> {report.summary}</p>
            <p><strong>Heuristic confidence:</strong> {report.confidence}</p>
            <p><strong>Events:</strong> {report.total_events} | <strong>Correlations:</strong> {report.total_correlations} | <strong>Timeline entries:</strong> {report.timeline_entries}</p>
            <h3>Limitations</h3>
            <ul>{(report.limitations || []).map((item, index) => <li key={index}>{item}</li>)}</ul>
          </>
        ) : (
          <p>Final report will appear here after an investigation is analyzed.</p>
        )}
      </div>
    </section>
  );
}
