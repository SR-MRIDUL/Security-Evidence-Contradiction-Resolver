from typing import Any, TypedDict


class InvestigationState(TypedDict, total=False):
    events: list[dict[str, Any]]
    analyzed_events: list[dict[str, Any]]
    correlations: list[dict[str, Any]]
    contradictions: list[dict[str, Any]]
    threat_findings: list[dict[str, Any]]
    security_findings: list[dict[str, Any]]
    timeline: list[dict[str, Any]]
    agent_outputs: list[dict[str, Any]]
    agent_status: list[dict[str, Any]]
    final_report: dict[str, Any]
