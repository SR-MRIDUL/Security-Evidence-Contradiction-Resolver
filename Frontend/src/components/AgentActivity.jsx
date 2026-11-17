import React, { useState } from "react";

// Keep the familiar investigation timeline layout while adding readable/JSON views.
const AGENTS = [
  {
    name: "Log Analyzer",
    description: "Reads the uploaded security records, extracts useful fields and prepares normalized events for the other agents.",
    icon: "fa-file-lines",
    purpose: "What this agent does",
  },
  {
    name: "Evidence Correlation",
    description: "Compares events and links records that share identifiers such as usernames or IP addresses.",
    icon: "fa-link",
    purpose: "What this agent does",
  },
  {
    name: "Contradiction Detector",
    description: "Checks for potentially conflicting evidence, such as one account appearing in different locations within a short time window.",
    icon: "fa-triangle-exclamation",
    purpose: "What this agent does",
  },
  {
    name: "Malware & Ransomware Indicator Detector",
    description: "Checks logs for malware/ransomware, brute force, suspicious logins, privilege escalation, unauthorized access, possible exfiltration, lateral movement, network threats and policy violations.",
    icon: "fa-shield-virus",
    purpose: "What this agent does",
  },
  {
    name: "Timeline Reconstructor",
    description: "Arranges extracted events in chronological order so the investigation sequence is easier to understand.",
    icon: "fa-clock-rotate-left",
    purpose: "What this agent does",
  },
  {
    name: "Evidence Reconciliation",
    description: "Combines the findings from the earlier agents into one consolidated investigation report.",
    icon: "fa-file-circle-check",
    purpose: "What this agent does",
  },
];

const LABELS = {
  event_count: "Events processed",
  analysis: "AI-assisted summary",
  analysis_note: "Analysis note",
  event_ids: "Related event IDs",
  shared_username: "Shared username",
  shared_ip: "Shared IP address",
  reason: "Why these events were linked",
  username: "Account",
  first_location: "First reported location",
  second_location: "Second reported location",
  first_ip: "First IP address",
  second_ip: "Second IP address",
  time_difference_minutes: "Time difference (minutes)",
  interpretation: "Interpretation",
  verification_required: "Manual verification required",
  events_scanned: "Events scanned",
  findings_count: "Indicators found",
  findings: "Findings",
  scope: "Detection scope",
  limitations: "Limitations",
  total_events: "Total events",
  total_correlations: "Correlations",
  total_potential_contradictions: "Potential contradictions",
  total_threat_indicators: "Threat indicators",
  timeline_entries: "Timeline entries",
  confidence: "Confidence",
  summary: "Summary",
  category: "Category",
  severity: "Severity",
  source_file: "Source file",
  indicator: "Matched indicator",
  explanation: "Explanation",
  recommended_action: "Recommended next step",
  event_id: "Event ID",
  timestamp: "Timestamp",
  source: "Source",
  ip_address: "IP address",
  location: "Location",
  event_type: "Event type",
  raw_evidence: "Original evidence",
  sha256: "SHA-256",
};

function labelFor(key) {
  return LABELS[key] || key.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatReadable(value, depth = 0) {
  if (value === null || value === undefined || value === "") return "Not available";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    if (!value.length) return "None found";
    return value.map((item, index) => {
      if (item && typeof item === "object") {
        return `${index + 1}.\n${formatReadable(item, depth + 1)}`;
      }
      return `${index + 1}. ${String(item)}`;
    }).join("\n\n");
  }
  if (typeof value === "object") {
    return Object.entries(value).map(([key, child]) => {
      const indentation = "  ".repeat(depth);
      return `${indentation}${labelFor(key)}: ${formatReadable(child, depth + 1)}`;
    }).join("\n");
  }
  return String(value);
}

export default function AgentActivity({ outputs = [] }) {
  const [formats, setFormats] = useState({});
  const outputByName = new Map(outputs.map((item) => [item.agent, item]));

  return (
    <div className="agent-timeline">
      <div className="agent-timeline-intro">
        <span className="agent-timeline-intro-icon"><i className="fa-solid fa-diagram-project" /></span>
        <div>
          <h3>Investigation workflow</h3>
          <p>Follow each agent in execution order. Open an agent to inspect its actual result.</p>
        </div>
      </div>

      <div className="timeline-wrapper agent-timeline-wrapper">
        {AGENTS.map((agent, index) => {
          const output = outputByName.get(agent.name);
          const format = formats[agent.name] || "readable";
          const completed = ["completed", "completed_with_warnings"].includes(output?.status);
          const statusClass = output?.status === "completed_with_warnings" ? "agent-warning" : (completed ? "agent-complete" : "agent-pending");
          const result = output?.result;

          return (
            <article className={`timeline-event agent-timeline-event ${statusClass}`} key={agent.name}>
              <div className="timeline-dot agent-timeline-dot"><span>{index + 1}</span></div>
              <div className="timeline-card agent-timeline-card">
                <div className="agent-timeline-heading">
                  <div className="agent-timeline-title-group">
                    <span className="agent-icon"><i className={`fa-solid ${agent.icon}`} /></span>
                    <div>
                      <h4>{agent.name}</h4>
                      <p className="agent-description">{agent.description}</p>
                    </div>
                  </div>
                  <span className={`badge ${output?.status === "completed_with_warnings" ? "warning" : (completed ? "verified" : "agent-not-run")}`}>
                    {output?.status || "Not run"}
                  </span>
                </div>

                {output ? (
                  <>
                    <div className="agent-execution-meta">
                      <span><i className="fa-regular fa-clock" /> Execution time</span>
                      <strong>{output.execution_time_ms ?? "N/A"} ms</strong>
                    </div>
                    <details className="agent-result-details">
                      <summary>
                        <span><i className="fa-solid fa-eye" /> View actual agent output</span>
                        <i className="fa-solid fa-chevron-down agent-chevron" />
                      </summary>
                      <div className="agent-result-panel">
                        <div className="agent-result-toolbar">
                          <strong>Agent result</strong>
                          <div className="agent-format-switch" role="group" aria-label={`${agent.name} output format`}>
                            <button
                              type="button"
                              className={format === "readable" ? "active" : ""}
                              aria-pressed={format === "readable"}
                              onClick={() => setFormats((current) => ({ ...current, [agent.name]: "readable" }))}
                            >Readable report</button>
                            <button
                              type="button"
                              className={format === "json" ? "active" : ""}
                              aria-pressed={format === "json"}
                              onClick={() => setFormats((current) => ({ ...current, [agent.name]: "json" }))}
                            >Raw JSON</button>
                          </div>
                        </div>
                        {format === "json" ? (
                          <pre className="agent-result-content agent-json-content">{JSON.stringify(result, null, 2)}</pre>
                        ) : (
                          <pre className="agent-result-content agent-readable-content">{formatReadable(result)}</pre>
                        )}
                      </div>
                    </details>
                  </>
                ) : (
                  <div className="agent-no-output">
                    <i className="fa-regular fa-circle-pause" />
                    <span>This agent has no recorded output for the selected investigation.</span>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
