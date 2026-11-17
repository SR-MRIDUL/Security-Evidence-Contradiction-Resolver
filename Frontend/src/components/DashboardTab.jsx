import React from "react";
import AgentActivity from "./AgentActivity";

const STATUS_LABELS = {
  no_problem: "No Problem",
  potential_threat: "Potential Threat Detected",
  analysis_incomplete: "Analysis Incomplete",
};

const CATEGORY_LABELS = {
  ransomware: "Ransomware Indicator",
  malware_execution: "Malware Execution",
  credential_access: "Credential Access",
  persistence: "Persistence",
  defense_evasion: "Defense Evasion",
  brute_force: "Brute Force Attack",
  suspicious_login: "Suspicious Login",
  privilege_escalation: "Privilege Escalation",
  unauthorized_access: "Unauthorized Access",
  possible_data_exfiltration: "Possible Data Exfiltration",
  network_threat: "Network Threat",
  lateral_movement: "Lateral Movement",
  policy_violation: "Policy Violation",
  suspicious_file_activity: "Suspicious File Activity",
};

function statusClass(status) {
  if (status === "no_problem") return "verified";
  if (status === "potential_threat") return "danger";
  return "warning";
}

export default function DashboardTab({ evidenceList = [], analysisResult = null }) {
  const report = analysisResult?.final_report;
  const contradictions = analysisResult?.contradictions || [];
  const securityFindings = analysisResult?.security_findings || analysisResult?.threat_findings || [];
  const outputs = analysisResult?.agent_outputs || [];
  const status = report?.security_status;
  const parserWarnings = report?.parser_warnings || [];
  const agentWarnings = report?.agent_warnings || [];

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
        <div className={`metric-card ${securityFindings.length ? "warning" : "success"}`}><i className="fa-solid fa-shield-halved metric-icon" /><div><h3>{securityFindings.length}</h3><p>Security findings</p></div></div>
      </div>

      <div className="section-card">
        <h2><i className="fa-solid fa-shield-heart" /> Overall Security Status</h2>
        {report ? (
          <>
            <p><span className={`badge ${statusClass(status)}`}>{STATUS_LABELS[status] || "Status unavailable"}</span></p>
            <h3>{report.status_message || report.summary}</h3>
            <p>{report.analysis_status === "completed" ? "The configured analysis workflow completed." : "Some optional components or parser steps reported warnings. Review the details below; the security status reflects the deterministic checks that completed."}</p>
            <div className="report-stat-row">
              <span><strong>Analysis:</strong> {report.analysis_status || "Legacy result"}</span>
              <span><strong>Correlations:</strong> {report.total_correlations ?? 0}</span>
              <span><strong>Timeline events:</strong> {report.timeline_entries ?? 0}</span>
            </div>
            {parserWarnings.length > 0 && <><h3>Parser warnings</h3><ul>{parserWarnings.map((item, index) => <li key={index}>{item}</li>)}</ul></>}
            {agentWarnings.length > 0 && <><h3>Agent warnings</h3><ul>{agentWarnings.map((item, index) => <li key={index}>{item.agent}: {item.status}</li>)}</ul></>}
            {report.limitations?.length > 0 && <><h3>Analysis limitations</h3><ul>{report.limitations.map((item, index) => <li key={index}>{item}</li>)}</ul></>}
          </>
        ) : <p>Upload a supported security log file to generate an investigation report.</p>}
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
        <h2><i className="fa-solid fa-shield-virus" /> Security Threat Findings</h2>
        <p>These are rule-based indicators. Each item requires validation against the original evidence.</p>
        {securityFindings.length === 0 ? (
          <p>No configured security indicators were matched in the analyzed events. This does not guarantee that the environment is threat-free.</p>
        ) : securityFindings.map((item, index) => (
          <div className="contradiction-box" key={item.finding_id || `${item.category}-${index}`}>
            <span className="badge danger">{item.severity || "review"}</span>
            <h3>{CATEGORY_LABELS[item.category] || item.category?.replaceAll("_", " ") || "Security finding"}</h3>
            <p><strong>Matched evidence:</strong> {item.indicator}</p>
            <p>{item.explanation}</p>
            <p><strong>Recommended action:</strong> {item.recommended_action}</p>
            <small>
              Finding: {item.finding_id || "N/A"} · Events: {(item.event_ids || []).join(", ") || "N/A"} ·
              Sources: {(item.source_files || (item.source_file ? [item.source_file] : [])).join(", ") || "N/A"} ·
              Confidence: {item.confidence || "Not calibrated"}
            </small>
          </div>
        ))}
      </div>
    </section>
  );
}
