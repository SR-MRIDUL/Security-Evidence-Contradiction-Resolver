const isLocalFrontend = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  isLocalFrontend ? "http://127.0.0.1:8000" : window.location.origin
);

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("access_token");
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!(options.body instanceof FormData) && options.body) headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.detail || data.message || `Request failed (${response.status})`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
  return data;
}

export function registerUser(userData) {
  return apiRequest("/api/auth/register", { method: "POST", body: JSON.stringify(userData) });
}
export function loginUser(credentials) {
  return apiRequest("/api/auth/login", { method: "POST", body: JSON.stringify(credentials) });
}
export function getCurrentUser() { return apiRequest("/api/auth/me"); }
export function getInvestigations() { return apiRequest("/api/investigations/"); }
export function getUploadHistory() { return apiRequest("/api/uploads/history"); }
export function getUploadedFileContent(fileId) { return apiRequest(`/api/uploads/${fileId}/content`); }
export function uploadEvidenceFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest("/api/uploads/", { method: "POST", body: formData });
}
export function logoutUser() { localStorage.removeItem("access_token"); }
export function getAdminUsers() { return apiRequest("/api/admin/users"); }
export function updateUserRole(userId, role) {
  return apiRequest(`/api/admin/users/${userId}/role`, { method: "PATCH", body: JSON.stringify({ role }) });
}
export function updateUserStatus(userId, isActive) {
  return apiRequest(`/api/admin/users/${userId}/status`, { method: "PATCH", body: JSON.stringify({ is_active: isActive }) });
}
