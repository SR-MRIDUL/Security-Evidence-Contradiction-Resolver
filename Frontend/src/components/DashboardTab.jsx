import React from "react";
import AgentActivity from "./AgentActivity";

export default function DashboardTab({ evidenceList = [], analysisResult = null }) {
  const report = analysisResult?.final_report;
  const contradictions = analysisResult?.contradictions || [];
  const threatFindings = analysisResult?.threat_findings || [];
  const outputs = analysisResult?.agent_outputs || [];

  return (
    <section className="tab-content active">
      <div className="welcome-banner">
        <h1>Security Evidence Contradiction Resolver</h1>
        <p>Upload security evidence, review automated findings and understand every agent's contribution.</p>
      </div>
      <div className="metrics-grid">
        <div className="metric-card"><i className="fa-solid fa-file-arrow-up metric-icon" /><div><h3>{evidenceList.length}</h3><p>Uploaded files</p></div></div>
        <div className="metric-card"><i className="fa-solid fa-list-check metric-icon" /><div><h3>{report?.total_events ?? 0}</h3><p>Events analyzed</p></div></div>
        <div className="metric-card warning"><i className="fa-solid fa-triangle-exclamation metric-icon" /><div><h3>{contradictions.length}</h3><p>Potential contradictions</p></div></div>
        <div className="metric-card warning"><i className="fa-solid fa-bug metric-icon" /><div><h3>{threatFindings.length}</h3><p>Threat indicators</p></div></div>
      </div>

      <div className="section-card">
        <h2><i className="fa-solid fa-file-circle-check" /> Investigation Summary</h2>
        {report ? <>
          <p>{report.summary}</p>
          <div className="report-stat-row">
            <span><strong>Confidence:</strong> {report.confidence}</span>
            <span><strong>Correlations:</strong> {report.total_correlations ?? 0}</span>
            <span><strong>Timeline events:</strong> {report.timeline_entries ?? 0}</span>
          </div>
          {report.limitations?.length > 0 && <><h3>Detection limitations</h3><ul>{report.limitations.map((item, index) => <li key={index}>{item}</li>)}</ul></>}
        </> : <p>Upload a supported security log file to generate an investigation report.</p>}
      </div>

      <div className="section-card">
        <h2><i className="fa-solid fa-robot" /> Agent Activity & Actual Outputs</h2>
        <p>Switch each agent's output between a readable explanation and the original JSON result.</p>
        {outputs.length ? <AgentActivity outputs={outputs} /> : <p>No agent output is loaded. Upload evidence or select an earlier report from Upload History.</p>}
      </div>

      <div className="section-card">
        <h2><i className="fa-solid fa-triangle-exclamation" /> Potential Contradictions</h2>
        {contradictions.length === 0 ? <p>No potential contradictions were identified by the current rules in this analysis.</p> : contradictions.map((item, index) => (
          <div className="contradiction-box" key={`${item.event_ids?.join("-") || index}`}>
            <span className="badge danger">{item.severity || "suspicious"}</span>
            <h3>{item.username || "Unknown account"} — reported location inconsistency</h3>
            <p>{item.first_location} ({item.first_ip}) → {item.second_location} ({item.second_ip})</p>
            <p>Time difference: {item.time_difference_minutes} minutes · Events: {(item.event_ids || []).join(", ")}</p>
            <small>{item.interpretation || item.reason}</small>
          </div>
        ))}
      </div>

      <div className="section-card">
        <h2><i className="fa-solid fa-shield-virus" /> Malware & Ransomware Indicators</h2>
        {threatFindings.length === 0 ? <p>No configured malware or ransomware text indicators were matched. This does not prove the system or file is malware-free.</p> : threatFindings.map((item, index) => (
          <div className="contradiction-box" key={`${item.category}-${index}`}>
            <span className="badge danger">{item.severity}</span>
            <h3>{item.category?.replaceAll("_", " ")}</h3>
            <p><strong>Matched text:</strong> {item.indicator}</p>
            <p>{item.explanation}</p>
            <p><strong>Recommended action:</strong> {item.recommended_action}</p>
            <small>Events: {(item.event_ids || []).join(", ")} · {item.confidence}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
