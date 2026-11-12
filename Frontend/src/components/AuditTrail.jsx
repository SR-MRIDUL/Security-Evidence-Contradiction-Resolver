
import React, { useState } from "react";

export default function AuditTrail() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  // Temporary frontend demo data
  const activities = [
    {
      id: 1,
      user: "Admin",
      action: "Login",
      description: "User logged into the system",
      time: "2026-11-12 09:30 AM",
      status: "Success",
    },
    {
      id: 2,
      user: "Security Analyst",
      action: "Evidence Upload",
      description: "New evidence file uploaded",
      time: "2026-11-12 10:15 AM",
      status: "Success",
    },
    {
      id: 3,
      user: "Admin",
      action: "Investigation",
      description: "Investigation case created",
      time: "2026-11-12 11:00 AM",
      status: "Success",
    },
    {
      id: 4,
      user: "Guest",
      action: "Access Attempt",
      description: "Unauthorized access attempt",
      time: "2026-11-12 11:45 AM",
      status: "Failed",
    },
  ];

  const filteredActivities = activities.filter((item) => {
    const text = `${item.user} ${item.action} ${item.description}`;

    const matchesSearch = text
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter =
      filter === "All" || item.status === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <section className="tab-content active">
      <div className="section-card">

        <h2>
          <i className="fa-solid fa-clock-rotate-left"></i>
          Audit Trail & Activity Monitoring
        </h2>

        <p>
          Monitor and review user activities and system events.
        </p>

        <div className="form-group">
          <label>Search Activity</label>
          <input
            type="text"
            placeholder="Search by user, action or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Filter by Status</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All Activities</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
          </select>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            color: "var(--text-primary)"
          }}>
            <thead>
              <tr>
                {["User", "Action", "Description", "Date & Time", "Status"].map(
                  (heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: "14px",
                        textAlign: "left",
                        borderBottom: "1px solid var(--border-color)"
                      }}
                    >
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {filteredActivities.map((item) => (
                <tr key={item.id}>
                  <td style={{ padding: "14px", borderBottom: "1px solid var(--border-color)" }}>
                    {item.user}
                  </td>

                  <td style={{ padding: "14px", borderBottom: "1px solid var(--border-color)" }}>
                    {item.action}
                  </td>

                  <td style={{ padding: "14px", borderBottom: "1px solid var(--border-color)" }}>
                    {item.description}
                  </td>

                  <td style={{ padding: "14px", borderBottom: "1px solid var(--border-color)" }}>
                    {item.time}
                  </td>

                  <td style={{ padding: "14px", borderBottom: "1px solid var(--border-color)" }}>
                    <span className={`badge ${
                      item.status === "Failed" ? "danger" : "verified"
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredActivities.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: "20px", textAlign: "center" }}>
                    No activities found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </section>
  );
}
