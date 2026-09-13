from langgraph.graph import StateGraph, START, END

from app.agents.state import ComplaintAgentState
from app.agents.nodes import (
    router_node,
    extract_or_merge_node,
    completeness_node,
    duplicate_check_node,
    risk_assessment_node,
    respond_node,
)


def build_graph():
    graph = StateGraph(ComplaintAgentState)

    graph.add_node("router", router_node)
    graph.add_node("extract_or_merge", extract_or_merge_node)
    graph.add_node("completeness_check", completeness_node)
    graph.add_node("check_duplicates", duplicate_check_node)
    graph.add_node("assess_risk", risk_assessment_node)
    graph.add_node("respond", respond_node)

    graph.add_edge(START, "router")
    graph.add_edge("router", "extract_or_merge")
    graph.add_edge("extract_or_merge", "completeness_check")
    graph.add_edge("completeness_check", "check_duplicates")
    graph.add_edge("check_duplicates", "assess_risk")
    graph.add_edge("assess_risk", "respond")
    graph.add_edge("respond", END)

    return graph.compile()


# Compiled once at import time and reused across requests.
complaint_agent_graph = build_graph()
