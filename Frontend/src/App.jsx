import React, { useState, useEffect, useCallback } from "react";

import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import AuthModal from "./components/AuthModal";
import DashboardTab from "./components/DashboardTab";
import UploadTab from "./components/UploadTab";
import TimelineTab from "./components/TimelineTab";

import AuditTrail from "./components/AuditTrail";
import SecureEvidence from "./components/SecureEvidence";
import Notifications from "./components/Notifications";
import CaseManagement from "./components/CaseManagement";
import Analytics from "./components/Analytics";
import EvidenceExport from "./components/EvidenceExport";

import {
  getCurrentUser,
  getInvestigations,
  createInvestigation,
  uploadEvidenceFile,
  analyzeInvestigation,
  getInvestigationResult,
  logoutUser,
} from "./api";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [evidenceList, setEvidenceList] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const isGuest = currentUser === "Guest";

  const loadInvestigations = useCallback(async () => {
    if (!localStorage.getItem("access_token")) return;
    try {
      setLoading(true);
      setApiError("");
      const data = await getInvestigations();
      setEvidenceList(data.map((item) => ({
        id: item.id,
        title: item.title,
        type: "Investigation",
        status: item.status || "pending",
        time: item.created_at ? new Date(item.created_at).toLocaleString() : "N/A",
        detail: item.description || "No description provided.",
      })));

      // Restore the most recent saved analysis, if one exists.
      setAnalysisResult(null);
      for (const item of data) {
        try {
          const result = await getInvestigationResult(item.id);
          setAnalysisResult(result);
          break;
        } catch (error) {
          if (!String(error.message).includes("404")) {
            // No saved result is normal for a newly created investigation.
          }
        }
      }
    } catch (error) {
      setApiError(error.message || "Unable to load investigations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      if (!localStorage.getItem("access_token")) return;
      try {
        const user = await getCurrentUser();
        setCurrentUser(user.full_name);
        await loadInvestigations();
      } catch {
        await logoutUser();
        setCurrentUser(null);
      }
    };
    restoreSession();
  }, [loadInvestigations]);

  const handleLoginSuccess = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user.full_name);
      setIsAuthModalOpen(false);
      setActiveTab("dashboard");
      await loadInvestigations();
    } catch (error) {
      setApiError(error.message || "Unable to load user profile.");
    }
  };

  const handleGuestLogin = () => {
    setCurrentUser("Guest");
    setEvidenceList([]);
    setAnalysisResult(null);
    setActiveTab("dashboard");
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setEvidenceList([]);
    setAnalysisResult(null);
    setActiveTab("dashboard");
    setIsAuthModalOpen(false);
    setApiError("");
    alert("Logged out successfully.");
  };

  const handleAddEvidence = async (title, type, content, file = null) => {
    if (!file && (!content || !content.trim())) {
      alert("Please provide valid evidence content!");
      return;
    }
    if (isGuest) {
      alert("Please login to save data to the database.");
      setIsAuthModalOpen(true);
      return;
    }

    try {
      setLoading(true);
      setApiError("");
      const investigation = await createInvestigation({
        title: title || "New Investigation",
        description: file
          ? `[${type || "General"}] Uploaded file: ${file.name}`
          : `[${type || "General"}] ${content}`,
      });

      if (file) {
        await uploadEvidenceFile(file, investigation.id);
      }

      const result = await analyzeInvestigation(investigation.id);
      setAnalysisResult(result);
      await loadInvestigations();
      setActiveTab("dashboard");
      alert("Evidence analyzed successfully. Results saved in MySQL.");
    } catch (error) {
      setApiError(error.message || "Failed to upload or analyze evidence.");
      alert(error.message || "Failed to upload or analyze evidence.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {!currentUser ? (
        <LandingPage
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onContinueGuest={handleGuestLogin}
        />
      ) : (
        <div className="app-layout">
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentUser={currentUser}
            onLogout={handleLogout}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
          <main className="main-container">
            {apiError && <div className="error-msg">{apiError}</div>}
            {loading && <p>Uploading and analyzing evidence...</p>}

            {activeTab === "dashboard" && (
              <DashboardTab
                evidenceList={evidenceList}
                analysisResult={analysisResult}
              />
            )}
            {activeTab === "upload" && (
              <UploadTab onAddEvidence={handleAddEvidence} loading={loading} />
            )}
            {activeTab === "timeline" && (
              <TimelineTab
                evidenceList={evidenceList}
                analysisResult={analysisResult}
              />
            )}
            {activeTab === "audit" && <AuditTrail />}
            {activeTab === "secure" && <SecureEvidence />}
            {activeTab === "notifications" && <Notifications />}
            {activeTab === "cases" && <CaseManagement />}
            {activeTab === "analytics" && <Analytics />}
            {activeTab === "export" && <EvidenceExport />}
          </main>
        </div>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
