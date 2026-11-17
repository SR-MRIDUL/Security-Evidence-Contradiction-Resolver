import csv
import io
import json
import re
from collections import defaultdict
from datetime import datetime, timezone
from time import perf_counter
from typing import Any

from langchain_ollama import ChatOllama

from .state import InvestigationState


# Gemma is advisory only. Deterministic Python checks remain authoritative.
llm = ChatOllama(model="gemma3:4b", temperature=0)


def ask_local_ai(prompt: str) -> tuple[str, bool]:
    """Return advisory text and availability; AI failure never hides rule-based results."""
    try:
        response = llm.invoke(prompt)
        return str(response.content).strip(), True
    except Exception:
        return "AI unavailable: Ollama is not reachable or gemma3:4b is not installed. Deterministic checks continued.", False


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
    if value in (None, ""):
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
    Parse JSON, CSV, JSON-lines and key=value/plain-text logs.
    Original fields and raw records are retained. Parser warnings travel with events.
    """
    text = (content or "").strip()
    if not text:
        return []

    extension = file_type.lower().lstrip(".")
    records: list[dict] = []
    parser_warnings: list[str] = []

    if extension == "json" or text.startswith(("{", "[")):
        try:
            parsed = json.loads(text)
            if isinstance(parsed, list):
                records = [item for item in parsed if isinstance(item, dict)]
                if len(records) != len(parsed):
                    parser_warnings.append("Some JSON array entries were not objects and were skipped.")
            elif isinstance(parsed, dict):
                if isinstance(parsed.get("events"), list):
                    records = [item for item in parsed["events"] if isinstance(item, dict)]
                    if len(records) != len(parsed["events"]):
                        parser_warnings.append("Some JSON events were not objects and were skipped.")
                elif isinstance(parsed.get("records"), list):
                    records = [item for item in parsed["records"] if isinstance(item, dict)]
                    if len(records) != len(parsed["records"]):
                        parser_warnings.append("Some JSON records were not objects and were skipped.")
                else:
                    records = [parsed]
            else:
                parser_warnings.append("JSON root must be an object or array.")
        except json.JSONDecodeError as exc:
            parser_warnings.append(f"Invalid JSON syntax near line {exc.lineno}, column {exc.colno}; retained line-level fallback records.")

    if not records and extension == "csv":
        try:
            reader = csv.DictReader(io.StringIO(text))
            records = [dict(row) for row in reader if row]
            if not records:
                parser_warnings.append("CSV contained a header but no data rows.")
        except (csv.Error, TypeError):
            parser_warnings.append("CSV parsing failed; raw-line fallback was used.")

    if not records:
        # Fallback: JSON-lines, key=value records, or raw lines.
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
            if any(token in lower_line for token in ("login", "authentication", "logon", "sign-in")):
                item.setdefault("event_type", "authentication_event")
            elif any(token in lower_line for token in ("firewall", "connection", "network")):
                item.setdefault("event_type", "network_event")
            else:
                item.setdefault("event_type", "log_event")

            records.append(item)

    normalized = []
    for index, record in enumerate(records, start=1):
        if not isinstance(record, dict):
            continue
        event = {
            **record,  # Preserve all source-specific fields.
            "event_id": _first_value(record, "event_id", "id", default=f"EVT-{index:03d}"),
            "source": _first_value(record, "source", "host", "hostname", "system", default=source_name),
            "username": _first_value(record, "username", "user", "account"),
            "ip_address": _first_value(record, "ip_address", "ip", "src_ip", "source_ip", "client_ip"),
            "location": _first_value(record, "location", "city", "geo"),
            "event_type": _first_value(record, "event_type", "event", "action", "type"),
            "timestamp": _first_value(record, "timestamp", "time", "datetime", default=""),
            "raw_evidence": _first_value(record, "raw_evidence", "message", "log", default=json.dumps(record, ensure_ascii=False, default=str)),
        }
        if parser_warnings:
            event["_parse_warnings"] = list(parser_warnings)
        normalized.append(event)
    return normalized


def _event_text(event: dict) -> str:
    """Serialize nested event values safely so detector coverage is not field-limited."""
    try:
        return json.dumps(event, ensure_ascii=False, default=str)
    except (TypeError, ValueError):
        return " ".join(str(value) for value in event.values())


def _source_files(events: list[dict]) -> list[str]:
    return sorted({str(e.get("source_file")) for e in events if e.get("source_file")})


def _finding(category: str, severity: str, events: list[dict], indicator: str,
             explanation: str, recommended_action: str, confidence: str = "medium") -> dict:
    return {
        "category": category,
        "severity": severity,
        "event_ids": [str(e.get("event_id", "unknown")) for e in events],
        "source_files": _source_files(events),
        "indicator": indicator[:240],
        "explanation": explanation,
        "recommended_action": recommended_action,
        "confidence": confidence,
        "verification_required": True,
    }


# Pattern-based indicators are intentionally phrased as indicators, not proof of compromise.
THREAT_RULES = [
    ("ransomware", "critical", r"vssadmin\s+delete\s+shadows|delete\s+shadows\s*/all|wbadmin\s+delete\s+catalog",
     "Shadow-copy deletion command observed; this can inhibit recovery."),
    ("ransomware", "critical", r"bcdedit.*recoveryenabled\s+no|bcdedit.*bootstatuspolicy\s+ignoreallfailures",
     "Boot recovery settings modification observed."),
    ("ransomware", "high", r"\b(readme|how_to_decrypt|restore_files|decrypt_instructions|ransom_note)\b|your files have been encrypted|pay\s+(the\s+)?ransom",
     "Text resembles a ransom note or recovery instruction."),
    ("ransomware", "high", r"\.(locked|encrypted|crypt|cryptolocker|wncry|lockbit)\b",
     "A filename or extension associated with encrypted-file activity was observed."),
    ("malware_execution", "high", r"powershell(?:\.exe)?[^\n]{0,200}-(?:enc|encodedcommand)\b|frombase64string",
     "Encoded PowerShell or Base64 command execution indicator observed."),
    ("malware_execution", "high", r"downloadstring|invoke-expression|\biex\b|new-object\s+net\.webclient",
     "PowerShell download-and-execute pattern observed."),
    ("malware_execution", "medium", r"\b(certutil|bitsadmin)\b[^\n]{0,180}(?:urlcache|download|transfer|decode)",
     "Living-off-the-land utility used for download or decoding."),
    ("malware_execution", "medium", r"\b(mshta|regsvr32|rundll32)\.exe\b",
     "Potentially abused Windows execution utility observed."),
    ("credential_access", "critical", r"mimikatz|sekurlsa::|lsass[^\n]{0,100}(?:dump|read)|procdump[^\n]{0,100}lsass",
     "Credential-dumping tool or LSASS access indicator observed."),
    ("persistence", "high", r"currentversion\\run|\\runonce|schtasks\s+/create|new-service|crontab\s+-e",
     "Possible scheduled task, service, startup or cron persistence mechanism observed."),
    ("defense_evasion", "high", r"wevtutil\s+cl|clear-eventlog|disable-defender|set-mppreference[^\n]*disablerealtimemonitoring|auditpol\s+/clear",
     "Security logging or endpoint protection tampering indicator observed."),
    ("privilege_escalation", "high", r"sudo\s+su\b|sudoers|usermod\s+-aG\s+(?:sudo|wheel)|net\s+localgroup\s+administrators.*\/add|add-localgroupmember.*administrators|runas\s+/user",
     "Command or operation may add privileges or execute under a more privileged identity."),
    ("network_threat", "medium", r"\bnmap\b|\bmasscan\b|\bzmap\b|port[\s_-]?scan(?:ning)?|syn[\s_-]?scan",
     "Port-scanning tool or scan behavior indicator observed."),
    ("lateral_movement", "high", r"\\\\admin\$|\\\\c\$|\bpsexec(?:\.exe)?\b|\bwmiexec\b|\bwinrs\b|\benter-pssession\b|\binvoke-command\b",
     "Remote execution or administrative-share activity may indicate lateral movement."),
]


def _auth_status(event: dict) -> str:
    fields = " ".join(str(event.get(k, "")) for k in (
        "status", "result", "outcome", "event_status", "message", "raw_evidence", "event_type", "action"
    )).lower()
    is_auth = bool(re.search(r"login|logon|authentication|sign[\s_-]?in|sshd|rdp", fields))
    if not is_auth:
        return "other"
    if re.search(r"failed|failure|denied|invalid password|bad password|unsuccessful|authentication error", fields):
        return "failed"
    if re.search(r"success|successful|authenticated|accepted password|logged in", fields):
        return "success"
    return "other"


def _timestamp(event: dict) -> datetime | None:
    return parse_timestamp(event.get("timestamp"))


def _detect_auth_patterns(events: list[dict]) -> list[dict]:
    findings = []
    failed = [e for e in events if _auth_status(e) == "failed"]
    successful = [e for e in events if _auth_status(e) == "success"]

    # Group failed authentication attempts by username; fall back to source IP.
    groups: dict[str, list[dict]] = defaultdict(list)
    for event in failed:
        user = event.get("username")
        ip = event.get("ip_address")
        key = f"user:{user}" if user and user != "unknown" else (f"ip:{ip}" if ip and ip != "unknown" else "")
        if key:
            groups[key].append(event)

    for key, group in groups.items():
        timed = sorted(((_timestamp(e), e) for e in group if _timestamp(e)), key=lambda pair: pair[0])
        window_group = []
        for current_time, current_event in timed:
            window_group = [(t, e) for t, e in window_group if (current_time - t).total_seconds() <= 600]
            window_group.append((current_time, current_event))
            if len(window_group) >= 5:
                group_events = [e for _, e in window_group]
                findings.append(_finding(
                    "brute_force", "high", group_events,
                    f"{len(group_events)} failed authentication attempts for {key} within 10 minutes",
                    "Repeated failed authentication attempts crossed the configured threshold of 5 within 10 minutes.",
                    "Verify whether the attempts are expected; review source IP reputation, MFA events and account lockout controls.",
                    "medium",
                ))
                break

    # Successful authentication after failures from the same account/IP is a review signal.
    for success_event in successful:
        success_time = _timestamp(success_event)
        if not success_time:
            continue
        related = []
        for failed_event in failed:
            failed_time = _timestamp(failed_event)
            same_user = (
                success_event.get("username") not in (None, "", "unknown")
                and success_event.get("username") == failed_event.get("username")
            )
            same_ip = (
                success_event.get("ip_address") not in (None, "", "unknown")
                and success_event.get("ip_address") == failed_event.get("ip_address")
            )
            if (same_user or same_ip) and failed_time and 0 <= (success_time - failed_time).total_seconds() <= 600:
                related.append(failed_event)
        if len(related) >= 3:
            related.append(success_event)
            findings.append(_finding(
                "suspicious_login", "medium", related,
                "Successful login followed repeated failed authentication attempts within 10 minutes",
                "The same account or source IP had failed authentication attempts shortly before a successful login.",
                "Confirm the login with the account owner and review MFA, device and source-IP context.",
                "medium",
            ))
    return findings


def _detect_other_security_patterns(events: list[dict]) -> list[dict]:
    findings = []
    for event in events:
        haystack = _event_text(event)
        for category, severity, pattern, explanation in THREAT_RULES:
            match = re.search(pattern, haystack, re.IGNORECASE)
            if match:
                findings.append(_finding(
                    category, severity, [event], match.group(0), explanation,
                    "Validate the original event, preserve evidence and investigate the affected host/account before remediation.",
                    "medium",
                ))

        # Explicit access-denial evidence; failed logins are handled separately.
        if re.search(r"unauthorized|permission denied|access denied|HTTP[/ ]?1?\.?[01]?\s+403|status(?:_code)?[=: ]+403", haystack, re.I):
            if re.search(r"file|resource|api|object|directory|share|access|request|http", haystack, re.I):
                findings.append(_finding(
                    "unauthorized_access", "medium", [event],
                    "Access denied / unauthorized / HTTP 403 indicator",
                    "The event records an access-denial response. This may be expected policy enforcement or attempted unauthorized access.",
                    "Check the requested resource, user role, source IP and whether the denial was expected.",
                    "medium",
                ))

        # Only use a numeric byte count when the source explicitly provides one.
        byte_value = None
        for key in ("bytes_sent", "bytes_out", "outbound_bytes", "transferred_bytes", "upload_bytes"):
            raw = event.get(key)
            try:
                byte_value = int(float(raw))
                break
            except (TypeError, ValueError):
                continue
        if byte_value is not None and byte_value >= 50 * 1024 * 1024:
            findings.append(_finding(
                "possible_data_exfiltration", "medium", [event],
                f"Explicit outbound transfer field reports {byte_value} bytes",
                "A single event reports at least 50 MiB in an outbound/transfer byte field. Volume alone does not prove data theft.",
                "Validate destination, business purpose, user, data classification and network telemetry.",
                "low",
            ))
        elif re.search(r"data exfiltration|exfiltrated|unauthorized bulk upload", haystack, re.I):
            findings.append(_finding(
                "possible_data_exfiltration", "high", [event],
                "Explicit data-exfiltration wording in source evidence",
                "The source record explicitly describes possible data exfiltration; corroborate with network and endpoint evidence.",
                "Preserve network flow records and validate destination, volume and data sensitivity.",
                "medium",
            ))

        if re.search(r"policy[_ -]?violation|non[_ -]?compliant|security policy denied|policy breach", haystack, re.I):
            findings.append(_finding(
                "policy_violation", "medium", [event],
                "Explicit policy-violation or non-compliance indicator",
                "The source event explicitly reports a policy violation or non-compliant action.",
                "Compare the event with the applicable security policy and confirm whether an exception was approved.",
                "medium",
            ))

    # Burst file deletions: group only explicit delete operations by host/user.
    delete_groups: dict[str, list[dict]] = defaultdict(list)
    for event in events:
        text = _event_text(event).lower()
        if re.search(r"file_delete|file deleted|delete_file|action[=: ]+delete|operation[=: ]+delete", text):
            host = event.get("hostname") or event.get("source") or "unknown-host"
            user = event.get("username") or "unknown-user"
            delete_groups[f"{host}:{user}"].append(event)
    for key, group in delete_groups.items():
        if len(group) >= 20:
            findings.append(_finding(
                "suspicious_file_activity", "high", group,
                f"{len(group)} file deletion events for {key}",
                "A burst of 20 or more file deletion records was observed in the supplied evidence.",
                "Check whether this was an authorized cleanup job; preserve file-system and endpoint telemetry.",
                "medium",
            ))
    return findings


# AGENT 1: LOG ANALYZER
def log_analyzer(state: InvestigationState) -> dict:
    started = perf_counter()
    events = state.get("events", [])
    analyzed = []
    for index, event in enumerate(events, start=1):
        # Keep every original field, then ensure canonical aliases are available.
        analyzed.append({
            **event,
            "event_id": _first_value(event, "event_id", "id", default=f"EVT-{index:03d}"),
            "source": _first_value(event, "source", "host", "hostname", "system"),
            "username": _first_value(event, "username", "user", "account"),
            "ip_address": _first_value(event, "ip_address", "ip", "src_ip", "source_ip", "client_ip"),
            "location": _first_value(event, "location", "city", "geo"),
            "event_type": _first_value(event, "event_type", "event", "action", "type"),
            "timestamp": _first_value(event, "timestamp", "time", "datetime", default=""),
            "raw_evidence": _first_value(event, "raw_evidence", "message", "log", default=json.dumps(event, ensure_ascii=False, default=str)),
            "source_file": _first_value(event, "source_file", default="manual evidence"),
            "sha256": _first_value(event, "sha256", default="not available"),
        })

    ai_analysis, ai_available = ask_local_ai(
        "Summarize only the visible fields in these structured security events. "
        "Do not infer missing dates, locations, successful logins, or source verification. "
        "If a field is unknown, say it is unknown. Events:\n"
        + json.dumps(analyzed, ensure_ascii=False, default=str)
    )
    result = {
        "event_count": len(analyzed),
        "analysis": ai_analysis,
        "analysis_note": "AI notes are advisory; deterministic Python rules produce findings.",
        "ai_status": "available" if ai_available else "unavailable",
    }
    status = "completed" if ai_available else "completed_with_warnings"
    outputs, statuses = _record_agent(state, "Log Analyzer", result, started, status)
    return {"analyzed_events": analyzed, "agent_outputs": outputs, "agent_status": statuses}


# AGENT 2: EVIDENCE CORRELATION
def evidence_correlator(state: InvestigationState) -> dict:
    started = perf_counter()
    events = state.get("analyzed_events", [])
    correlations = []
    identifier_keys = ("username", "ip_address", "hostname", "process_id", "process_guid", "file_hash", "process_hash", "session_id")
    for i in range(len(events)):
        for j in range(i + 1, len(events)):
            first, second = events[i], events[j]
            shared = []
            for key in identifier_keys:
                left, right = first.get(key), second.get(key)
                if left not in (None, "", "unknown", "not available") and right not in (None, "", "unknown", "not available") and str(left).casefold() == str(right).casefold():
                    shared.append(key)
            if shared:
                correlations.append({
                    "event_ids": [first["event_id"], second["event_id"]],
                    "matching_keys": shared,
                    "shared_username": "username" in shared,
                    "shared_ip": "ip_address" in shared,
                    "reason": "Events share: " + ", ".join(shared),
                })
    outputs, statuses = _record_agent(state, "Evidence Correlation", correlations, started)
    return {"correlations": correlations, "agent_outputs": outputs, "agent_status": statuses}


# AGENT 3: CONTRADICTION DETECTOR
def contradiction_detector(state: InvestigationState) -> dict:
    started = perf_counter()
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
                    "severity": "medium",
                    "reason": "The same account appears in different reported locations within 60 minutes.",
                    "verification_required": True,
                    "interpretation": "Potential location inconsistency only; not proof of impossible travel or malicious access.",
                })
    outputs, statuses = _record_agent(state, "Contradiction Detector", contradictions, started)
    return {"contradictions": contradictions, "agent_outputs": outputs, "agent_status": statuses}


# AGENT 4: SECURITY THREAT INDICATOR DETECTOR
def threat_indicator_detector(state: InvestigationState) -> dict:
    started = perf_counter()
    events = state.get("analyzed_events", [])
    findings = _detect_other_security_patterns(events)
    findings.extend(_detect_auth_patterns(events))

    # Stable IDs make findings easier to cite in reports and UI.
    for index, finding in enumerate(findings, start=1):
        finding["finding_id"] = f"FND-{index:03d}"

    category_counts = {}
    for finding in findings:
        category_counts[finding["category"]] = category_counts.get(finding["category"], 0) + 1
    result = {
        "events_scanned": len(events),
        "findings_count": len(findings),
        "category_counts": category_counts,
        "findings": findings,
        "scope": "Deterministic text/log indicators and event-pattern checks. No binary malware scanning or file execution.",
        "limitations": [
            "A matched indicator is not proof of compromise.",
            "Brute-force detection requires at least 5 timestamped failed attempts for one account/IP within 10 minutes.",
            "Large outbound transfer detection requires an explicit byte-count field; volume alone is not proof of exfiltration.",
            "This is not a replacement for antivirus, EDR, YARA, sandboxing or threat-intelligence services.",
            "Unknown, obfuscated, encrypted or unlogged activity may not be detected.",
        ],
    }
    outputs, statuses = _record_agent(state, "Malware & Ransomware Indicator Detector", result, started)
    return {"threat_findings": findings, "security_findings": findings, "agent_outputs": outputs, "agent_status": statuses}


# AGENT 5: TIMELINE RECONSTRUCTOR
def timeline_reconstructor(state: InvestigationState) -> dict:
    started = perf_counter()
    events = state.get("analyzed_events", [])
    timeline = []
    for event in events:
        parsed = parse_timestamp(event.get("timestamp"))
        timeline.append({
            **event,
            "timestamp_status": "valid" if parsed else "missing_or_invalid",
            "_normalized_timestamp": parsed.isoformat() if parsed else None,
        })
    timeline.sort(key=lambda event: (
        event["_normalized_timestamp"] is None,
        event["_normalized_timestamp"] or "",
    ))
    outputs, statuses = _record_agent(state, "Timeline Reconstructor", timeline, started)
    return {"timeline": timeline, "agent_outputs": outputs, "agent_status": statuses}


# AGENT 6: EVIDENCE RECONCILIATION
def evidence_reconciler(state: InvestigationState) -> dict:
    started = perf_counter()
    events = state.get("analyzed_events", [])
    correlations = state.get("correlations", [])
    contradictions = state.get("contradictions", [])
    threat_findings = state.get("security_findings", state.get("threat_findings", []))
    timeline = state.get("timeline", [])
    outputs_so_far = state.get("agent_outputs", [])
    statuses_so_far = state.get("agent_status", [])

    parser_warnings = sorted({
        warning
        for event in events
        for warning in event.get("_parse_warnings", [])
    })
    invalid_timestamps = [
        event.get("event_id", "unknown") for event in events
        if not parse_timestamp(event.get("timestamp"))
    ]
    agent_warnings = [
        item for item in statuses_so_far
        if item.get("status") not in {"completed"}
    ]

    finding_count = len(contradictions) + len(threat_findings)
    has_failed_agent = any(item.get("status") == "failed" for item in statuses_so_far)
    if parser_warnings or agent_warnings:
        analysis_status = "completed_with_warnings"
    else:
        analysis_status = "completed"

    # Ollama is advisory in this build. Its unavailability is shown as a warning,
    # but does not invalidate deterministic Python detection results.
    if parser_warnings or has_failed_agent:
        security_status = "analysis_incomplete"
        status_message = "Analysis completed with warnings; review parser/agent failures before treating the result as clean."
    elif finding_count:
        security_status = "potential_threat"
        status_message = f"{finding_count} potential security finding(s) require investigation."
    elif events:
        security_status = "no_problem"
        status_message = "No configured security indicators were detected in the successfully analyzed evidence."
    else:
        security_status = "analysis_incomplete"
        status_message = "No usable events were available for analysis."

    categories = {}
    for finding in threat_findings:
        category = finding.get("category", "other")
        categories[category] = categories.get(category, 0) + 1

    findings = []
    for item in contradictions:
        findings.append({
            "type": "potential_location_inconsistency",
            "category": "potential_contradiction",
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
        "total_security_findings": finding_count,
        "category_counts": categories,
        "timeline_entries": len(timeline),
        "confidence": "Heuristic; not a calibrated probability",
        "analysis_status": analysis_status,
        "security_status": security_status,
        "status_message": status_message,
        "summary": (
            f"Processed {len(events)} events and found {len(contradictions)} potential contradiction(s) "
            f"and {len(threat_findings)} security threat indicator(s)."
            if finding_count else
            f"Processed {len(events)} events. {status_message}"
        ),
        "findings": findings,
        "security_findings": threat_findings,
        "threat_findings": threat_findings,
        "parser_warnings": parser_warnings,
        "events_with_missing_or_invalid_timestamps": invalid_timestamps,
        "agent_warnings": agent_warnings,
        "limitations": [
            "Findings are rule-based indicators and require human verification.",
            "Reported locations have not been independently verified; different labels do not prove impossible travel.",
            "AI-generated notes are advisory and are not used as evidence.",
            "Malware/ransomware checks analyze text and log fields, not executable binaries.",
            "No Problem means no configured rule matched the supplied evidence; it is not a guarantee that the environment is safe.",
        ],
    }
    outputs, statuses = _record_agent(state, "Evidence Reconciliation", report, started)
    return {"final_report": report, "agent_outputs": outputs, "agent_status": statuses}
