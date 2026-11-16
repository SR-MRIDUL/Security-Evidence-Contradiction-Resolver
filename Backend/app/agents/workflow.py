from langgraph.graph import StateGraph, START, END

from .state import InvestigationState
from .nodes import (
    log_analyzer,
    evidence_correlator,
    contradiction_detector,
    threat_indicator_detector,
    timeline_reconstructor,
    evidence_reconciler,
)


def build_investigation_workflow():
    graph = StateGraph(InvestigationState)

    graph.add_node("log_analyzer", log_analyzer)
    graph.add_node("evidence_correlator", evidence_correlator)
    graph.add_node("contradiction_detector", contradiction_detector)
    graph.add_node("threat_indicator_detector", threat_indicator_detector)
    graph.add_node("timeline_reconstructor", timeline_reconstructor)
    graph.add_node("evidence_reconciler", evidence_reconciler)

    graph.add_edge(START, "log_analyzer")
    graph.add_edge("log_analyzer", "evidence_correlator")
    graph.add_edge("evidence_correlator", "contradiction_detector")
    graph.add_edge("contradiction_detector", "threat_indicator_detector")
    graph.add_edge("threat_indicator_detector", "timeline_reconstructor")
    graph.add_edge("timeline_reconstructor", "evidence_reconciler")
    graph.add_edge("evidence_reconciler", END)

    return graph.compile()


investigation_workflow = build_investigation_workflow()
