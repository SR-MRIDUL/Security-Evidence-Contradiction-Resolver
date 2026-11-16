import React, { useState, useEffect, useCallback } from "react";

import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import AuthModal from "./components/AuthModal";
import DashboardTab from "./components/DashboardTab";
import UploadTab from "./components/UploadTab";
import TimelineTab from "./components/TimelineTab";
import UploadHistory from "./components/UploadHistory";
import Analytics from "./components/Analytics";
import EvidenceExport from "./components/EvidenceExport";
import AdminPanel from "./components/AdminPanel";
import { getCurrentUser, getUploadHistory, uploadEvidenceFile, logoutUser } from "./api";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [uploadHistory, setUploadHistory] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("evidenceresolver-theme") || "dark"; }
    catch { return "dark"; }
  });

  useEffect(() => {
    try { localStorage.setItem("evidenceresolver-theme", theme); } catch { /* optional preference */ }
  }, [theme]);

  const isGuest = currentUser?.role === "guest";

  const loadHistory = useCallback(async () => {
    if (!localStorage.getItem("access_token")) return;
    try {
      setApiError("");
      const records = await getUploadHistory();
      setUploadHistory(records);
      const latest = records.find((item) => item.analysis)?.analysis || null;
      setAnalysisResult(latest);
    } catch (error) {
      setApiError(error.message || "Unable to load upload history.");
    }
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      if (!localStorage.getItem("access_token")) return;
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
        await loadHistory();
      } catch {
        await logoutUser();
        setCurrentUser(null);
      }
    };
    restoreSession();
  }, [loadHistory]);

  const handleLoginSuccess = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      setIsAuthModalOpen(false);
      setActiveTab("dashboard");
      await loadHistory();
    } catch (error) {
      setApiError(error.message || "Unable to load user profile.");
    }
  };

  const handleGuestLogin = () => {
    setCurrentUser({ full_name: "Guest", role: "guest" });
    setUploadHistory([]);
    setAnalysisResult(null);
    setActiveTab("dashboard");
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setUploadHistory([]);
    setAnalysisResult(null);
    setActiveTab("dashboard");
    setIsAuthModalOpen(false);
    setApiError("");
  };

  const handleAddEvidence = async (file) => {
    if (!file) throw new Error("Select a file to upload.");
    if (isGuest) {
      setIsAuthModalOpen(true);
      throw new Error("Please login or register before uploading evidence.");
    }
    setLoading(true);
    setApiError("");
    try {
      const response = await uploadEvidenceFile(file);
      setAnalysisResult(response.analysis || null);
      await loadHistory();
      // Keep the just-completed result selected, even if history refresh returns older records first.
      setAnalysisResult(response.analysis || null);
      setActiveTab("dashboard");
    } catch (error) {
      setApiError(error.message || "Failed to upload or analyze evidence.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = (item) => {
    setAnalysisResult(item.analysis);
    setActiveTab("dashboard");
  };

  const evidenceList = uploadHistory.map((item) => ({
    id: item.file?.id,
    title: item.file?.original_filename || item.investigation?.title || "Uploaded evidence",
    status: item.investigation?.status || "unknown",
    time: item.file?.uploaded_at ? new Date(item.file.uploaded_at).toLocaleString() : "N/A",
  }));

  const renderActiveTab = () => {
    if (activeTab === "dashboard") return <DashboardTab evidenceList={evidenceList} analysisResult={analysisResult} />;
    if (activeTab === "upload") return <UploadTab onAddEvidence={handleAddEvidence} loading={loading} />;
    if (activeTab === "history") return <UploadHistory history={uploadHistory} onView={handleViewHistory} />;
    if (activeTab === "timeline") return <TimelineTab evidenceList={evidenceList} analysisResult={analysisResult} />;
    if (activeTab === "analytics" && (currentUser?.role === "analyst" || currentUser?.role === "admin")) return <Analytics evidenceList={evidenceList} analysisResult={analysisResult} />;
    if (activeTab === "export") return <EvidenceExport history={uploadHistory} analysisResult={analysisResult} />;
    if (activeTab === "admin" && currentUser?.role === "admin") return <AdminPanel currentUser={currentUser} />;
    return <DashboardTab evidenceList={evidenceList} analysisResult={analysisResult} />;
  };

  return (
    <div className="app-container" data-theme={theme}>
      <button type="button" className="theme-toggle" onClick={() => setTheme((value) => value === "dark" ? "light" : "dark")}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
        <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"}`} aria-hidden="true" />
        <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
      </button>
      {!currentUser ? (
        <LandingPage onOpenAuth={() => setIsAuthModalOpen(true)} onContinueGuest={handleGuestLogin} />
      ) : (
        <div className="app-layout">
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onLogout={handleLogout} />
          <main className="main-container">
            {apiError && <div className="error-msg">{apiError}</div>}
            {loading && <p className="loading-banner">Uploading evidence and running the six analysis agents...</p>}
            {renderActiveTab()}
          </main>
        </div>
      )}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={handleLoginSuccess} />
    </div>
  );
}
