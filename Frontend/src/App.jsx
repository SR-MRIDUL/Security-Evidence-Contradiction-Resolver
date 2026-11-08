
import React, { useState } from "react";

import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import AuthModal from "./components/AuthModal";
import DashboardTab from "./components/DashboardTab";
import UploadTab from "./components/UploadTab";
import TimelineTab from "./components/TimelineTab";

const initialEvidence = [
  {
    id: 101,
    title: "Auth Log: Web Portal Login",
    type: "Auth",
    status: "Verified",
    time: "2026-11-07 14:28:10",
    detail: "Login success from IP 192.168.1.50 (Dhaka)",
  },
  {
    id: 102,
    title: "SSH Access: Remote Connection",
    type: "Network",
    status: "Contradiction",
    time: "2026-11-07 14:32:10",
    detail:
      "Remote session created from IP 45.12.89.2 (London) - Speed Conflict",
  },
  {
    id: 103,
    title: "System Event: Sudo Privilege Escalation",
    type: "System",
    status: "Verified",
    time: "2026-11-07 14:40:00",
    detail: "Sudo elevation granted for automated tasks",
  },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const [evidenceList, setEvidenceList] = useState(initialEvidence);

  // Login Success
  const handleLoginSuccess = (username) => {
    setCurrentUser(username);
    setIsAuthModalOpen(false);
    setActiveTab("dashboard");
  };

  // Guest Login
  const handleGuestLogin = () => {
    handleLoginSuccess("Guest");
  };

  // Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab("dashboard");
    setIsAuthModalOpen(false);

    alert("Logged out successfully.");
  };

  // Add New Evidence
  const handleAddEvidence = (title, type, content) => {
    if (!content || !content.trim()) {
      alert("Please provide valid evidence content!");
      return;
    }

    const isConflict =
      content.toLowerCase().includes("failed") ||
      content.toLowerCase().includes("unauthorized") ||
      content.toLowerCase().includes("error");

    const now = new Date();

    const timestamp = now
      .toISOString()
      .replace("T", " ")
      .substring(0, 19);

    const newEntry = {
      id: Date.now(),
      title: title || "Manual Log Entry",
      type,
      status: isConflict ? "Contradiction" : "Verified",
      time: timestamp,
      detail:
        content.length > 120
          ? content.substring(0, 120) + "..."
          : content,
    };

    setEvidenceList((previousList) => [
      newEntry,
      ...previousList,
    ]);

    alert(
      "Evidence Log file processed & registered into system database successfully!"
    );

    setActiveTab("dashboard");
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
