import json
import unittest
from unittest.mock import patch

from app.agents import nodes


def run_pipeline(events):
    state = {"events": events, "agent_outputs": [], "agent_status": []}
    for agent in (
        nodes.log_analyzer,
        nodes.evidence_correlator,
        nodes.contradiction_detector,
        nodes.threat_indicator_detector,
        nodes.timeline_reconstructor,
        nodes.evidence_reconciler,
    ):
        state.update(agent(state))
    return state


class DetectionEngineTests(unittest.TestCase):
    def setUp(self):
        self.ai_patcher = patch.object(
            nodes, "ask_local_ai",
            return_value=("AI disabled during deterministic unit tests.", False),
        )
        self.ai_patcher.start()

    def tearDown(self):
        self.ai_patcher.stop()

    def test_log_analyzer_preserves_source_specific_fields(self):
        event = {
            "event_id": "PRESERVE-1",
            "timestamp": "2026-11-17T08:00:00Z",
            "username": "alice",
            "process_name": "powershell.exe",
            "command": "powershell.exe -EncodedCommand ABC",
            "file_path": "C:/temp/a.txt",
            "process_hash": "abc123",
            "custom_nested": {"source": "sysmon"},
        }
        result = run_pipeline([event])
        analyzed = result["analyzed_events"][0]
        self.assertEqual(analyzed["command"], event["command"])
        self.assertEqual(analyzed["process_name"], event["process_name"])
        self.assertEqual(analyzed["file_path"], event["file_path"])
        self.assertEqual(analyzed["custom_nested"], event["custom_nested"])

    def test_normal_login_returns_no_problem(self):
        events = [
            {"event_id": "N1", "timestamp": "2026-11-17T08:00:00Z", "username": "alice",
             "source_ip": "203.0.113.10", "location": "Dhaka", "event_type": "login",
             "status": "success", "raw_evidence": "normal successful login"},
            {"event_id": "N2", "timestamp": "2026-11-17T08:10:00Z", "username": "alice",
             "source_ip": "203.0.113.10", "event_type": "logout", "status": "success"},
        ]
        result = run_pipeline(events)
        self.assertEqual(result["final_report"]["security_status"], "no_problem")
        self.assertEqual(result["security_findings"], [])
        self.assertEqual(result["contradictions"], [])

    def test_evidence_file_hash_is_not_used_as_event_correlation(self):
        events = [
            {"event_id": "H1", "sha256": "same-upload-file-hash", "username": "alice", "ip_address": "192.0.2.1"},
            {"event_id": "H2", "sha256": "same-upload-file-hash", "username": "bob", "ip_address": "192.0.2.2"},
        ]
        result = run_pipeline(events)
        self.assertEqual(result["correlations"], [])

    def test_location_contradiction_is_detected(self):
        events = [
            {"event_id": "L1", "timestamp": "2026-11-17T09:00:00Z", "username": "bob", "location": "Dhaka"},
            {"event_id": "L2", "timestamp": "2026-11-17T09:20:00Z", "username": "bob", "location": "London"},
        ]
        result = run_pipeline(events)
        self.assertEqual(len(result["contradictions"]), 1)
        self.assertEqual(result["final_report"]["security_status"], "potential_threat")

    def test_threat_scan_checks_command_and_process_fields(self):
        events = [{
            "event_id": "T1", "timestamp": "2026-11-17T10:00:00Z",
            "process_name": "powershell.exe",
            "command": "powershell.exe -EncodedCommand ABC",
        }]
        result = run_pipeline(events)
        self.assertIn("malware_execution", [f["category"] for f in result["security_findings"]])

    def test_brute_force_and_suspicious_login(self):
        events = [
            {"event_id": f"B{i}", "timestamp": f"2026-11-17T12:0{i}:00Z",
             "username": "sam", "source_ip": "203.0.113.20",
             "event_type": "login", "status": "failed"}
            for i in range(5)
        ]
        events.append({
            "event_id": "B-SUCCESS", "timestamp": "2026-11-17T12:06:00Z",
            "username": "sam", "source_ip": "203.0.113.20",
            "event_type": "login", "status": "success",
        })
        result = run_pipeline(events)
        categories = [f["category"] for f in result["security_findings"]]
        self.assertIn("brute_force", categories)
        self.assertIn("suspicious_login", categories)

    def test_other_security_categories(self):
        events = [
            {"event_id": "P1", "command": "usermod -aG sudo newuser"},
            {"event_id": "U1", "status_code": 403, "raw_evidence": "permission denied accessing file"},
            {"event_id": "D1", "bytes_sent": 70000000, "event_type": "network_transfer"},
            {"event_id": "M1", "command": "psexec.exe \\\\HOST2 cmd.exe"},
            {"event_id": "V1", "raw_evidence": "security policy violation"},
        ]
        result = run_pipeline(events)
        categories = {f["category"] for f in result["security_findings"]}
        self.assertTrue({"privilege_escalation", "unauthorized_access",
                         "possible_data_exfiltration", "lateral_movement",
                         "policy_violation"}.issubset(categories))

    def test_ransomware_indicators_are_detected(self):
        events = [
            {"event_id": "R1", "command": "vssadmin.exe delete shadows /all /quiet"},
            {"event_id": "R2", "command": "bcdedit /set {default} recoveryenabled No"},
            {"event_id": "R3", "raw_evidence": "Your files have been encrypted. Contact support."},
        ]
        result = run_pipeline(events)
        self.assertGreaterEqual(
            sum(1 for finding in result["security_findings"] if finding["category"] == "ransomware"),
            3,
        )

    def test_malformed_json_is_not_reported_as_clean(self):
        events = nodes.parse_evidence_text(
            '{"events":[{"event_id":"X1"}', "json", "broken.json"
        )
        for event in events:
            event["source_file"] = "broken.json"
        result = run_pipeline(events)
        self.assertEqual(result["final_report"]["security_status"], "analysis_incomplete")
        self.assertTrue(result["final_report"]["parser_warnings"])

    def test_missing_timestamp_remains_in_timeline(self):
        result = run_pipeline([{"event_id": "NO-TIME", "username": "x"}])
        self.assertEqual(len(result["timeline"]), 1)
        self.assertEqual(result["timeline"][0]["timestamp_status"], "missing_or_invalid")


if __name__ == "__main__":
    unittest.main()
