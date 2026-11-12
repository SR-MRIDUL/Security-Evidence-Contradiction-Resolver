
import React, { useState } from "react";

export default function Notifications() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Evidence Uploaded",
      message: "A new evidence file has been uploaded.",
      time: "Today, 09:30 AM",
      type: "success",
      read: false,
    },
    {
      id: 2,
      title: "Investigation Created",
      message: "A new investigation case has been created.",
      time: "Today, 10:15 AM",
      type: "info",
      read: false,
    },
    {
      id: 3,
      title: "Security Alert",
      message: "An unauthorized access attempt was detected.",
      time: "Today, 11:00 AM",
      type: "danger",
      read: true,
    },
  ]);

  const unreadCount = notifications.filter(
    (item) => !item.read
  ).length;

  const markAllAsRead = () => {
    setNotifications((previous) =>
      previous.map((item) => ({ ...item, read: true }))
    );
  };

  const toggleRead = (id) => {
    setNotifications((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, read: !item.read } : item
      )
    );
  };

  const deleteNotification = (id) => {
    setNotifications((previous) =>
      previous.filter((item) => item.id !== id)
    );
  };

  return (
    <section className="tab-content active">
      <div className="section-card">
        <h2>
          <i className="fa-solid fa-bell"></i>
          Notifications & Alerts
        </h2>

        <p>
          Review system alerts and investigation notifications.
        </p>

        <div className="metrics-grid">
          <div className="metric-card">
            <i className="fa-solid fa-bell metric-icon"></i>
            <div>
              <h3>{notifications.length}</h3>
              <p>Total Notifications</p>
            </div>
          </div>

          <div className="metric-card warning">
            <i className="fa-solid fa-envelope metric-icon"></i>
            <div>
              <h3>{unreadCount}</h3>
              <p>Unread Notifications</p>
            </div>
          </div>
        </div>

        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "15px"
        }}>
          <button className="auth-btn" onClick={markAllAsRead}>
            <i className="fa-solid fa-check-double"></i>
            Mark All as Read
          </button>
        </div>

        {notifications.length === 0 ? (
          <p>No notifications available.</p>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-color)",
                borderLeft: `4px solid ${
                  item.type === "danger"
                    ? "var(--danger)"
                    : item.type === "success"
                      ? "var(--success)"
                      : "var(--accent-blue)"
                }`,
                padding: "15px",
                borderRadius: "6px",
                marginBottom: "12px",
                opacity: item.read ? 0.7 : 1
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap"
              }}>
                <div>
                  <h3 style={{ marginBottom: "6px" }}>
                    {item.title}
                    {!item.read && (
                      <span className="badge danger" style={{ marginLeft: "10px" }}>
                        New
                      </span>
                    )}
                  </h3>

                  <p style={{ marginBottom: "8px" }}>
                    {item.message}
                  </p>

                  <span className="timestamp">{item.time}</span>
                </div>

                <div style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "center"
                }}>
                  <button
                    className="auth-btn"
                    onClick={() => toggleRead(item.id)}
                  >
                    {item.read ? "Mark Unread" : "Mark Read"}
                  </button>

                  <button
                    className="logout-btn"
                    onClick={() => deleteNotification(item.id)}
                  >
                    <i className="fa-solid fa-trash"></i>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
