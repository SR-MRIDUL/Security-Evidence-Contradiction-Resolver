import csv
import io
import json
import re
from datetime import datetime, timezone
from time import perf_counter
from typing import Any

from langchain_ollama import ChatOllama

from .state import InvestigationState


# The local model is used only for supporting explanations.
# Deterministic Python rules produce the actual findings and report facts.
llm = ChatOllama(model="gemma3:4b", temperature=0)


def ask_local_ai(prompt: str) -> str:
    """Call the local Ollama model without making the workflow depend on it."""
    try:
        response = llm.invoke(prompt)
        return str(response.content).strip()
    except Exception as exc:
        return f"Local AI unavailable: {exc}"


def _record_agent(
    state: InvestigationState,
    agent: str,
    result: Any,
    started: float,
    status: str = "completed",
) -> tuple[list[dict], list[dict]]:
    outputs = list(state.get("agent_outputs", []))
    statuses = list(state.get("agent_status", []))
    duration_ms = round((perf_counter() - started) * 1000, 2)

    outputs.append({
        "agent": agent,
        "status": status,
        "execution_time_ms": duration_ms,
        "result": result,
    })
    statuses.append({
        "agent": agent,
        "status": status,
        "execution_time_ms": duration_ms,
    })
    return outputs, statuses


def parse_timestamp(value: Any) -> datetime | None:
    """Parse an ISO timestamp and normalize it to UTC."""
    if not value:
        return None
    try:
        text = str(value).strip()
        if text.endswith("Z"):
            text = text[:-1] + "+00:00"
        parsed = datetime.fromisoformat(text)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    except (TypeError, ValueError):
        return None


def _first_value(record: dict, *keys: str, default: str = "unknown") -> str:
    for key in keys:
        value = record.get(key)
        if value not in (None, ""):
            return str(value).strip()
    return default


def parse_evidence_text(content: str, file_type: str = "txt", source_name: str = "uploaded evidence") -> list[dict]:
    """
    Parse JSON arrays/objects, CSV rows, JSON-lines, and common key=value log lines.
    Unrecognized lines are retained as raw evidence instead of being discarded.
    """
    text = (content or "").strip()
    if not text:
        return []

    extension = file_type.lower().lstrip(".")
    records: list[dict] = []

    if extension == "json" or text.startswith(("{", "[")):
        try:
            parsed = json.loads(text)
            if isinstance(parsed, list):
                records = [item for item in parsed if isinstance(item, dict)]
            elif isinstance(parsed, dict):
                if isinstance(parsed.get("events"), list):
                    records = [item for item in parsed["events"] if isinstance(item, dict)]
                elif isinstance(parsed.get("records"), list):
                    records = [item for item in parsed["records"] if isinstance(item, dict)]
                else:
                    records = [parsed]
        except json.JSONDecodeError:
            records = []

    if not records and extension == "csv":
        try:
            reader = csv.DictReader(io.StringIO(text))
            records = [dict(row) for row in reader if row]
        except (csv.Error, TypeError):
            records = []

    if not records:
        # Support newline-delimited JSON as well as key=value / plain text logs.
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        for line in lines:
            try:
                parsed_line = json.loads(line)
                if isinstance(parsed_line, dict):
                    records.append(parsed_line)
                    continue
            except json.JSONDecodeError:
                pass

            item: dict[str, Any] = {
                "source": source_name,
                "raw_evidence": line,
            }
            pairs = re.findall(r"([A-Za-z_][\w.-]*)\s*[:=]\s*[\x22\x27]?([^,\x22\x27]+)", line)
            for key, value in pairs:
                item[key.strip().lower()] = value.strip()

            timestamp_match = re.search(
                r'\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?',
                line,
            )
            if timestamp_match:
                item.setdefault("timestamp", timestamp_match.group(0))

            ip_match = re.search(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', line)
            if ip_match:
                item.setdefault("ip_address", ip_match.group(0))

            user_match = re.search(r'\b(?:user(?:name)?|account)\s*[=:]\s*([\w.@-]+)', line, re.I)
            if user_match:
                item.setdefault("username", user_match.group(1))

            lower_line = line.lower()
            if "login" in lower_line or "authentication" in lower_line:
                item.setdefault("event_type", "authentication_event")
            elif "firewall" in lower_line or "connection" in lower_line:
                item.setdefault("event_type", "network_event")
            else:
                item.setdefault("event_type", "log_event")

            location_match = re.search(r'\bfrom\s+([A-Za-z][A-Za-z ._-]{1,30})$', line, re.I)
            if location_match:
                item.setdefault("location", location_match.group(1).strip())

            records.append(item)

    normalized = []
    for index, record in enumerate(records, start=1):
        normalized.append({
            **record,
            "event_id": _first_value(record, "event_id", "id", default=f"EVT-{index:03d}"),
            "source": _first_value(record, "source", "host", "system", default=source_name),
            "username": _first_value(record, "username", "user", "account"),
            "ip_address": _first_value(record, "ip_address", "ip", "src_ip", "source_ip", "client_ip"),
            "location": _first_value(record, "location", "city", "geo"),
            "event_type": _first_value(record, "event_type", "event", "action", "type"),
            "timestamp": _first_value(record, "timestamp", "time", "datetime", default=""),
            "raw_evidence": _first_value(record, "raw_evidence", "message", "log", default=str(record)),
        })
    return normalized


# --------------------------------------------------
# AGENT 1: LOG ANALYZER
# --------------------------------------------------

def log_analyzer(state: InvestigationState) -> dict:
    started = perf_counter()
    print("\\n[AGENT 1] Log Analyzer started")
    events = state.get("events", [])
    analyzed = []

    for index, event in enumerate(events, start=1):
        analyzed.append({
            "event_id": _first_value(event, "event_id", "id", default=f"EVT-{index:03d}"),
            "source": _first_value(event, "source", "host", "system"),
            "username": _first_value(event, "username", "user", "account"),
            "ip_address": _first_value(event, "ip_address", "ip", "src_ip", "source_ip"),
            "location": _first_value(event, "location", "city", "geo"),
            "event_type": _first_value(event, "event_type", "event", "action", "type"),
            "timestamp": _first_value(event, "timestamp", "time", "datetime", default=""),
            "raw_evidence": _first_value(event, "raw_evidence", "message", "log", default=str(event)),
            "source_file": _first_value(event, "source_file", default="manual evidence"),
            "sha256": _first_value(event, "sha256", default="not available"),
        })

    # AI output is explicitly advisory and is never used to create findings.
    ai_analysis = ask_local_ai(
        "Summarize only the visible fields in these structured security events. "
        "Do not infer missing dates, locations, successful logins, or source verification. "
        "If a field is unknown, say it is unknown. Events:\\n"
        + json.dumps(analyzed, ensure_ascii=False)
    )
    result = {
        "event_count": len(analyzed),
        "analysis": ai_analysis,
        "analysis_note": "AI-generated notes are advisory; findings are generated by deterministic rules.",
    }
    outputs, statuses = _record_agent(state, "Log Analyzer", result, started)
    print(f"[AGENT 1] Processed {len(analyzed)} events")
    return {
        "analyzed_events": analyzed,
        "agent_outputs": outputs,
        "agent_status": statuses,
    }


# --------------------------------------------------
# AGENT 2: EVIDENCE CORRELATION
# --------------------------------------------------

def evidence_correlator(state: InvestigationState) -> dict:
    started = perf_counter()
    print("\\n[AGENT 2] Evidence Correlation started")
    events = state.get("analyzed_events", [])
    correlations = []

    for i in range(len(events)):
        for j in range(i + 1, len(events)):
            first, second = events[i], events[j]
            same_user = first["username"] != "unknown" and first["username"] == second["username"]
            same_ip = first["ip_address"] != "unknown" and first["ip_address"] == second["ip_address"]
            if same_user or same_ip:
                correlations.append({
                    "event_ids": [first["event_id"], second["event_id"]],
                    "shared_username": same_user,
                    "shared_ip": same_ip,
                    "reason": "Events share a username or IP address.",
                })

    outputs, statuses = _record_agent(state, "Evidence Correlation", correlations, started)
    print(f"[AGENT 2] Found {len(correlations)} related event pairs")
    return {"correlations": correlations, "agent_outputs": outputs, "agent_status": statuses}


# --------------------------------------------------
# AGENT 3: CONTRADICTION DETECTOR
# --------------------------------------------------

def contradiction_detector(state: InvestigationState) -> dict:
    started = perf_counter()
    print("\\n[AGENT 3] Contradiction Detector started")
    events = state.get("analyzed_events", [])
    contradictions = []

    for i in range(len(events)):
        for j in range(i + 1, len(events)):
            first, second = events[i], events[j]
            if first["username"] == "unknown" or first["username"] != second["username"]:
                continue
            if first["location"] == "unknown" or second["location"] == "unknown":
                continue
            if first["location"].casefold() == second["location"].casefold():
                continue

            first_time = parse_timestamp(first["timestamp"])
            second_time = parse_timestamp(second["timestamp"])
            if not first_time or not second_time:
                continue

            difference = abs((second_time - first_time).total_seconds())
            if difference <= 3600:
                contradictions.append({
                    "event_ids": [first["event_id"], second["event_id"]],
                    "username": first["username"],
                    "first_location": first["location"],
                    "second_location": second["location"],
                    "first_ip": first["ip_address"],
                    "second_ip": second["ip_address"],
                    "time_difference_minutes": round(difference / 60, 2),
                    "severity": "suspicious",
                    "reason": "The same account appears in different reported locations within 60 minutes.",
                    "verification_required": True,
                    "interpretation": "Potential location inconsistency only; not proof of impossible travel or malicious access.",
                })

    outputs, statuses = _record_agent(state, "Contradiction Detector", contradictions, started)
    print(f"[AGENT 3] Found {len(contradictions)} potential contradictions")
    return {"contradictions": contradictions, "agent_outputs": outputs, "agent_status": statuses}


# --------------------------------------------------
# AGENT 4: MALWARE & RANSOMWARE INDICATOR DETECTOR

THREAT_RULES = [
    ("ransomware", "critical", r"vssadmin\s+delete\s+shadows|delete\s+shadows\s*/all|wbadmin\s+delete\s+catalog", "Shadow-copy deletion command observed; this can inhibit recovery."),
    ("ransomware", "critical", r"bcdedit.*recoveryenabled\s+no|bcdedit.*bootstatuspolicy\s+ignoreallfailures", "Boot recovery settings modification observed."),
    ("ransomware", "high", r"\b(readme|how_to_decrypt|restore_files|decrypt_instructions|ransom_note)\b|your files have been encrypted|pay\s+(the\s+)?ransom", "Text resembles a ransom note or recovery instruction."),
    ("ransomware", "high", r"\.(locked|encrypted|crypt|cryptolocker|wncry|lockbit)\b", "A filename or extension associated with encrypted-file activity was observed."),
    ("malware_execution", "high", r"powershell(?:\.exe)?[^\n]{0,160}-(?:enc|encodedcommand)\b|frombase64string", "Encoded PowerShell or Base64 command execution indicator observed."),
    ("malware_execution", "high", r"downloadstring|invoke-expression|\biex\b|new-object\s+net\.webclient", "PowerShell download-and-execute pattern observed."),
    ("malware_execution", "medium", r"\b(certutil|bitsadmin)\b[^\n]{0,160}(?:urlcache|download|transfer|decode)", "Living-off-the-land utility used for download or decoding."),
    ("malware_execution", "medium", r"\b(mshta|regsvr32|rundll32)\.exe\b", "Potentially abused Windows execution utility observed."),
    ("credential_access", "critical", r"mimikatz|sekurlsa::|lsass[^\n]{0,80}(?:dump|read)|procdump[^\n]{0,80}lsass", "Credential-dumping tool or LSASS access indicator observed."),
    ("persistence", "high", r"\b(currentversion\\run|\\runonce)\b|schtasks\s+/create|new-service", "Possible persistence mechanism observed."),
    ("defense_evasion", "high", r"wevtutil\s+cl|clear-eventlog|disable-defender|set-mppreference[^\n]*disablerealtimemonitoring", "Security logging or endpoint protection tampering indicator observed."),
]


def threat_indicator_detector(state: InvestigationState) -> dict:
    started = perf_counter()
    print("\\n[AGENT 4] Malware & Ransomware Indicator Detector started")
    events = state.get("analyzed_events", [])
    findings = []
    for event in events:
        haystack = " ".join(str(event.get(key, "")) for key in (
            "raw_evidence", "event_type", "source", "source_file"
        ))
        for category, severity, pattern, explanation in THREAT_RULES:
            match = re.search(pattern, haystack, re.IGNORECASE)
            if match:
                findings.append({
                    "category": category,
                    "severity": severity,
                    "event_ids": [event.get("event_id", "unknown")],
                    "source_file": event.get("source_file", "unknown"),
                    "indicator": match.group(0)[:180],
                    "explanation": explanation,
                    "recommended_action": "Validate the original event, investigate the endpoint, and preserve evidence before remediation.",
                    "confidence": "heuristic indicator",
                    "verification_required": True,
                })
    result = {
        "events_scanned": len(events),
        "findings_count": len(findings),
        "findings": findings,
        "scope": "Text/log indicator analysis only; uploaded files are not executed or deeply scanned as binaries.",
        "limitations": [
            "A matched string is an indicator, not proof of infection.",
            "This is not a replacement for antivirus, EDR, YARA, sandboxing, or threat-intelligence services.",
            "Unknown, obfuscated, encrypted, or unlogged malware may not be detected.",
        ],
    }
    outputs, statuses = _record_agent(
        state, "Malware & Ransomware Indicator Detector", result, started
    )
    print(f"[AGENT 4] Found {len(findings)} potential threat indicators")
    return {"threat_findings": findings, "agent_outputs": outputs, "agent_status": statuses}


# AGENT 5: TIMELINE RECONSTRUCTOR
# --------------------------------------------------

def timeline_reconstructor(state: InvestigationState) -> dict:
    started = perf_counter()
    print("\\n[AGENT 5] Timeline Reconstructor started")
    events = state.get("analyzed_events", [])

    def sort_key(event: dict):
        parsed = parse_timestamp(event.get("timestamp"))
        return (parsed is None, parsed or datetime.max.replace(tzinfo=timezone.utc))

    timeline = sorted(events, key=sort_key)
    outputs, statuses = _record_agent(state, "Timeline Reconstructor", timeline, started)
    print(f"[AGENT 5] Timeline created with {len(timeline)} events")
    return {"timeline": timeline, "agent_outputs": outputs, "agent_status": statuses}


# --------------------------------------------------
# AGENT 6: EVIDENCE RECONCILIATION
# --------------------------------------------------

def evidence_reconciler(state: InvestigationState) -> dict:
    started = perf_counter()
    print("\\n[AGENT 6] Evidence Reconciliation started")
    events = state.get("analyzed_events", [])
    correlations = state.get("correlations", [])
    contradictions = state.get("contradictions", [])
    threat_findings = state.get("threat_findings", [])
    timeline = state.get("timeline", [])

    if contradictions or threat_findings:
        confidence = "Medium (heuristic)"
        summary = (
            f"Processed {len(events)} events; identified {len(contradictions)} potential "
            f"location inconsistency pattern(s) and {len(threat_findings)} malware/ransomware "
            "indicator(s). All findings require manual verification."
        )
    elif events:
        confidence = "Low (heuristic)"
        summary = (
            f"Processed {len(events)} events. No potential location inconsistency "
            "was identified by the current detection rules."
        )
    else:
        confidence = "Insufficient evidence"
        summary = "No usable security events were available for analysis."

    findings = []
    for item in contradictions:
        findings.append({
            "type": "potential_location_inconsistency",
            "severity": item["severity"],
            "event_ids": item["event_ids"],
            "username": item["username"],
            "description": item["reason"],
            "time_difference_minutes": item["time_difference_minutes"],
            "verification_required": True,
        })

    report = {
        "total_events": len(events),
        "total_correlations": len(correlations),
        "total_potential_contradictions": len(contradictions),
        "total_threat_indicators": len(threat_findings),
        "timeline_entries": len(timeline),
        "confidence": confidence,
        "summary": summary,
        "findings": findings,
        "threat_findings": threat_findings,
        "limitations": [
            "Confidence is a simple heuristic, not a calibrated probability.",
            "Reported locations have not been independently verified.",
            "Different location labels do not prove impossible travel or malicious activity.",
            "Unrecognized log formats may be retained as raw events with unknown fields.",
            "AI-generated notes are advisory and are not used as evidence.",
            "Malware and ransomware checks are heuristic text/log indicator checks, not binary antivirus scanning."
        ],
    }

    outputs, statuses = _record_agent(state, "Evidence Reconciliation", report, started)
    print("[AGENT 6] Final report generated")
    return {"final_report": report, "agent_outputs": outputs, "agent_status": statuses}
