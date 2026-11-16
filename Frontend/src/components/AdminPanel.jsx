import React, { useEffect, useState } from "react";
import { getAdminUsers, updateUserRole, updateUserStatus } from "../api";

const ROLE_LABELS = {
  user: "Normal User",
  analyst: "Security Analyst",
  admin: "Administrator",
};

export default function AdminPanel({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingUserId, setSavingUserId] = useState(null);

  const refresh = async () => {
    try {
      setError("");
      setLoading(true);
      setUsers(await getAdminUsers());
    } catch (err) {
      setError(err.message || "Could not load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const changeRole = async (user, role) => {
    if (role === user.role) return;
    if (user.id === currentUser?.id) {
      setError("You cannot change your own administrator role here.");
      return;
    }
    if (!window.confirm(`Change ${user.full_name}'s role to ${ROLE_LABELS[role]}?`)) return;
    try {
      setSavingUserId(user.id);
      setError("");
      await updateUserRole(user.id, role);
      await refresh();
    } catch (err) {
      setError(err.message || "Role update failed.");
    } finally {
      setSavingUserId(null);
    }
  };

  const changeStatus = async (user) => {
    if (user.id === currentUser?.id) return;
    const next = !user.is_active;
    if (!window.confirm(`${next ? "Activate" : "Deactivate"} ${user.full_name}?`)) return;
    try {
      setSavingUserId(user.id);
      setError("");
      await updateUserStatus(user.id, next);
      await refresh();
    } catch (err) {
      setError(err.message || "Account status update failed.");
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <section className="tab-content active">
      <div className="section-card">
        <div className="admin-heading">
          <div>
            <h2><i className="fa-solid fa-user-shield" /> Administration & Access Control</h2>
            <p>Manage registered customers, assign security analysts and control administrator access.</p>
          </div>
          <button className="secondary-btn" onClick={refresh} disabled={loading}>Refresh users</button>
        </div>

        <div className="role-explainer-grid">
          <div className="role-explainer">
            <strong>Normal User</strong>
            <p>Uploads their own evidence and views only their own files, investigations and reports.</p>
          </div>
          <div className="role-explainer">
            <strong>Security Analyst</strong>
            <p>Reviews uploaded evidence and investigations across customer accounts, and performs security review.</p>
          </div>
          <div className="role-explainer">
            <strong>Administrator</strong>
            <p>Manages accounts, assigns roles, controls access and reviews all investigations.</p>
          </div>
        </div>

        {error && <div className="error-msg">{error}</div>}
        {loading ? <p>Loading user accounts...</p> : (
          <div className="table-scroll">
            <table className="admin-users-table">
              <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Account Access</th></tr></thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.full_name}{user.id === currentUser?.id ? " (You)" : ""}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-pill ${user.role}`}>
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td>
                      <span className={user.is_active ? "status-active" : "status-inactive"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="admin-actions">
                      <select
                        aria-label={`Role for ${user.full_name}`}
                        value={user.role}
                        disabled={user.id === currentUser?.id || savingUserId === user.id}
                        onChange={(event) => changeRole(user, event.target.value)}
                      >
                        <option value="user">Normal User</option>
                        <option value="analyst">Security Analyst</option>
                        <option value="admin">Administrator</option>
                      </select>
                      <button
                        className="small-action danger-action"
                        onClick={() => changeStatus(user)}
                        disabled={user.id === currentUser?.id || savingUserId === user.id}
                      >
                        {user.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="admin-footnote">
          New registrations are always created as Normal Users. Users cannot select or request a privileged role during registration. Only an administrator can assign Analyst or Administrator access.
        </p>
      </div>
    </section>
  );
}
