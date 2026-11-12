
import React, { useState } from "react";

export default function CaseManagement() {
  const [cases, setCases] = useState([
    {
      id: 1,
      title: "Unauthorized Login Investigation",
      description: "Review suspicious login activity.",
      status: "Open",
      priority: "High",
    },
    {
      id: 2,
      title: "Network Traffic Analysis",
      description: "Analyze unusual network traffic.",
      status: "In Progress",
      priority: "Medium",
    },
    {
      id: 3,
      title: "Server Log Review",
      description: "Review server access logs.",
      status: "Completed",
      priority: "Low",
    },
  ]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (title.trim().length < 3) {
      alert("Case title must contain at least 3 characters.");
      return;
    }

    if (editingId !== null) {
      setCases((previous) =>
        previous.map((item) =>
          item.id === editingId
            ? { ...item, title: title.trim(), description: description.trim(), priority }
            : item
        )
      );
    } else {
      setCases((previous) => [
        {
          id: Date.now(),
          title: title.trim(),
          description: description.trim(),
          status: "Open",
          priority,
        },
        ...previous,
      ]);
    }

    resetForm();
  };

  const editCase = (item) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description);
    setPriority(item.priority);
  };

  const deleteCase = (id) => {
    if (!window.confirm("Are you sure you want to delete this case?")) {
      return;
    }

    setCases((previous) =>
      previous.filter((item) => item.id !== id)
    );

    if (editingId === id) resetForm();
  };

  const updateStatus = (id, newStatus) => {
    setCases((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, status: newStatus } : item
      )
    );
  };

  const filteredCases = cases.filter((item) => {
    const matchesSearch =
      `${item.title} ${item.description}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <section className="tab-content active">
      <div className="section-card">
        <h2>
          <i className="fa-solid fa-folder-open"></i>
          Investigation Case Management
        </h2>

        <p>Create, review and manage investigation cases.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Case Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter investigation title"
              minLength={3}
              maxLength={200}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter case description"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>

          <button className="submit-btn" type="submit">
            {editingId !== null ? "Update Case" : "Create Case"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              className="auth-btn"
              style={{ marginTop: "10px" }}
              onClick={resetForm}
            >
              Cancel Editing
            </button>
          )}
        </form>
      </div>

      <div className="section-card">
        <h2>Investigation Cases</h2>

        <div className="form-group">
          <label>Search Cases</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search case..."
          />
        </div>

        <div className="form-group">
          <label>Filter by Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All</option>
            <option>Open</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>
        </div>

        {filteredCases.map((item) => (
          <div
            key={item.id}
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              padding: "15px",
              marginBottom: "12px"
            }}
          >
            <h3>{item.title}</h3>
            <p>{item.description || "No description provided."}</p>

            <p>
              Priority: <strong>{item.priority}</strong>
            </p>

            <div className="form-group">
              <label>Case Status</label>
              <select
                value={item.status}
                onChange={(e) => updateStatus(item.id, e.target.value)}
              >
                <option>Open</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>

            <button
              className="auth-btn"
              onClick={() => editCase(item)}
              type="button"
            >
              <i className="fa-solid fa-pen"></i> Edit
            </button>

            <button
              className="logout-btn"
              style={{ marginTop: "8px" }}
              onClick={() => deleteCase(item.id)}
              type="button"
            >
              <i className="fa-solid fa-trash"></i> Delete
            </button>
          </div>
        ))}

        {filteredCases.length === 0 && (
          <p>No investigation cases found.</p>
        )}
      </div>
    </section>
  );
}
