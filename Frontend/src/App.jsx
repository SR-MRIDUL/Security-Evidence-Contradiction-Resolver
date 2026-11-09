
import React, { useState, useEffect, useCallback } from "react";

import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import AuthModal from "./components/AuthModal";
import DashboardTab from "./components/DashboardTab";
import UploadTab from "./components/UploadTab";
import TimelineTab from "./components/TimelineTab";

import {
  getCurrentUser,
  getInvestigations,
  createInvestigation,
  logoutUser,
} from "./api";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const [evidenceList, setEvidenceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const isGuest = currentUser === "Guest";

  // Load investigations from Backend
  const loadInvestigations = useCallback(async () => {
    if (!localStorage.getItem("access_token")) return;

    try {
      setLoading(true);
      setApiError("");

      const data = await getInvestigations();

      const formattedData = data.map((item) => ({
        id: item.id,
        title: item.title,
        type: "Investigation",
        status: item.status || "Pending",
        time: item.created_at
          ? new Date(item.created_at).toLocaleString()
          : "N/A",
        detail: item.description || "No description provided.",
      }));

      setEvidenceList(formattedData);
    } catch (error) {
      setApiError(error.message || "Unable to load investigations.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Restore session after browser refresh
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) return;

      try {
        const user = await getCurrentUser();
        setCurrentUser(user.full_name);
        await loadInvestigations();
      } catch (error) {
        await logoutUser();
        setCurrentUser(null);
      }
    };

    restoreSession();
  }, [loadInvestigations]);

  // Login Success
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

  // Guest Login
  const handleGuestLogin = () => {
    setCurrentUser("Guest");
    setEvidenceList([]);
    setActiveTab("dashboard");
  };

  // Logout
  const handleLogout = async () => {
    await logoutUser();

    setCurrentUser(null);
    setEvidenceList([]);
    setActiveTab("dashboard");
    setIsAuthModalOpen(false);
    setApiError("");

    alert("Logged out successfully.");
  };

  // Create Investigation in Backend
  const handleAddEvidence = async (title, type, content) => {
    if (!content || !content.trim()) {
      alert("Please provide valid evidence content!");
      return;
    }

    if (isGuest) {
      alert("Please login to save data to the database.");
      setIsAuthModalOpen(true);
      return;
    }

    try {
      setApiError("");

      await createInvestigation({
        title: title || "New Investigation",
        description: `[${type || "General"}] ${content}`,
      });

      await loadInvestigations();

      alert("Investigation saved successfully in the database!");

      setActiveTab("dashboard");
    } catch (error) {
      setApiError(error.message || "Failed to save investigation.");
      alert(error.message || "Failed to save investigation.");
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
        <>
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentUser={currentUser}
            onLogout={handleLogout}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />

          <main className="main-container">
            {apiError && (
              <div className="error-msg">
                {apiError}
              </div>
            )}

            {loading && (
              <p>Loading data from database...</p>
            )}

            {activeTab === "dashboard" && (
              <DashboardTab evidenceList={evidenceList} />
            )}

            {activeTab === "upload" && (
              <UploadTab onAddEvidence={handleAddEvidence} />
            )}

            {activeTab === "timeline" && (
              <TimelineTab evidenceList={evidenceList} />
            )}
          </main>
        </>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
