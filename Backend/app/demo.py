import json

from app.agents.workflow import investigation_workflow


sample_events = [
    {
        "event_id": "EVT-001",
        "source": "firewall",
        "username": "admin",
        "ip_address": "192.168.1.50",
        "location": "Dhaka",
        "event_type": "login_success",
        "timestamp": "2026-11-15T09:00:00Z",
        "raw_evidence": "Successful login from Dhaka",
    },
    {
        "event_id": "EVT-002",
        "source": "authentication_server",
        "username": "admin",
        "ip_address": "45.12.10.20",
        "location": "London",
        "event_type": "login_success",
        "timestamp": "2026-11-15T09:05:00Z",
        "raw_evidence": "Successful login from London",
    },
    {
        "event_id": "EVT-003",
        "source": "firewall",
        "username": "user01",
        "ip_address": "10.0.0.15",
        "location": "Dhaka",
        "event_type": "login_success",
        "timestamp": "2026-11-15T09:10:00Z",
        "raw_evidence": "Successful login from internal network",
    },
]


if __name__ == "__main__":
    print("=" * 60)
    print("SECURITY EVIDENCE CONTRADICTION RESOLVER")
    print("MULTI-AGENT INVESTIGATION")
    print("=" * 60)

    result = investigation_workflow.invoke({
        "events": sample_events,
        "agent_outputs": [],
        "agent_status": [],
    })

    print("\nFINAL INVESTIGATION REPORT")
    print(json.dumps(result.get("final_report", {}), indent=2, ensure_ascii=False))

    print("\nAGENT EXECUTION SUMMARY")
    for item in result.get("agent_outputs", []):
        print(
            f"\n{item['agent']} | {item['status']} | "
            f"{item['execution_time_ms']} ms"
        )
        print(json.dumps(item["result"], indent=2, ensure_ascii=False, default=str))
