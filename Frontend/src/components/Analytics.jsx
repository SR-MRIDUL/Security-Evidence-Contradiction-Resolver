
import React from "react";

export default function Analytics() {
  const statusData = [
    { name: "Open", value: 8, color: "#38bdf8" },
    { name: "In Progress", value: 5, color: "#f59e0b" },
    { name: "Completed", value: 12, color: "#10b981" },
    { name: "Failed", value: 2, color: "#ef4444" },
  ];

  const priorityData = [
    { name: "High", value: 7, color: "#ef4444" },
    { name: "Medium", value: 12, color: "#f59e0b" },
    { name: "Low", value: 8, color: "#10b981" },
  ];

  const total = statusData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const maxStatus = Math.max(
    ...statusData.map((item) => item.value)
  );

  const maxPriority = Math.max(
    ...priorityData.map((item) => item.value)
  );

  const renderChart = (data, maxValue) => (
    <div>
      {data.map((item) => (
        <div key={item.name} style={{ marginBottom: "18px" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "6px"
          }}>
            <span>{item.name}</span>
            <strong>{item.value}</strong>
          </div>

          <div style={{
            height: "12px",
            background: "var(--bg-main)",
            borderRadius: "10px",
            overflow: "hidden"
          }}>
            <div style={{
              width: `${(item.value / maxValue) * 100}%`,
              height: "100%",
              background: item.color,
              borderRadius: "10px",
              transition: "width 0.3s"
            }} />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <section className="tab-content active">
      <div className="section-card">
        <h2>
          <i className="fa-solid fa-chart-column"></i>
          Advanced Analytics & Visualization
        </h2>

        <p>
          Overview of investigation statistics and case distribution.
        </p>

        <div className="metrics-grid">
          <div className="metric-card">
            <i className="fa-solid fa-folder metric-icon"></i>
            <div>
              <h3>{total}</h3>
              <p>Total Investigations</p>
            </div>
          </div>

          <div className="metric-card success">
            <i className="fa-solid fa-check-circle metric-icon"></i>
            <div>
              <h3>12</h3>
              <p>Completed Cases</p>
            </div>
          </div>

          <div className="metric-card warning">
            <i className="fa-solid fa-spinner metric-icon"></i>
            <div>
              <h3>5</h3>
              <p>In Progress</p>
            </div>
          </div>
        </div>
      </div>

      <div className="section-card">
        <h2>Investigation Status Distribution</h2>
        {renderChart(statusData, maxStatus)}
      </div>

      <div className="section-card">
        <h2>Investigation Priority Distribution</h2>
        {renderChart(priorityData, maxPriority)}
      </div>

      <div className="section-card">
        <h2>Analytics Information</h2>
        <p>
          These charts currently use sample data.
          Live analytics will require backend investigation records
          and aggregation APIs.
        </p>
      </div>
    </section>
  );
}
