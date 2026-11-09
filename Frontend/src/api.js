
const API_BASE_URL = "http://127.0.0.1:8000";

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("access_token");

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // FormData হলে Content-Type নিজে set করবে browser
  if (!(options.body instanceof FormData) && options.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data.detail ||
      data.message ||
      `Request failed (${response.status})`;

    throw new Error(
      typeof message === "string"
        ? message
        : JSON.stringify(message)
    );
  }

  return data;
}

export async function registerUser(userData) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export async function loginUser(credentials) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function getCurrentUser() {
  return apiRequest("/api/auth/me");
}

export async function getInvestigations() {
  return apiRequest("/api/investigations/");
}

export async function createInvestigation(data) {
  return apiRequest("/api/investigations/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function uploadEvidenceFile(file, investigationId = null) {
  const formData = new FormData();

  formData.append("file", file);

  if (investigationId !== null) {
    formData.append("investigation_id", investigationId);
  }

  return apiRequest("/api/uploads/", {
    method: "POST",
    body: formData,
  });
}

export async function logoutUser() {
  localStorage.removeItem("access_token");
}
