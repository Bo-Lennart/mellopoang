import React, { useState, useEffect } from "react";
import "./App.css";
import AdminPanel from "./components/AdminPanel";
import JoinPanel from "./components/JoinPanel";
import VotingPanel from "./components/VotingPanel";
import ResultsPanel from "./components/ResultsPanel";

function App() {
  const [view, setView] = useState("admin");
  const [sessionId, setSessionId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(null);
  const [contestants, setContestants] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // --- QR/URL session always takes user to join panel, but if userId/sessionId finns, visa JoinPanel med reconnect ---
    const params = new URLSearchParams(window.location.search);
    const urlSessionId = params.get("session");
    const savedUserId = localStorage.getItem("userId");
    const savedSessionId = localStorage.getItem("sessionId");
    const savedUserName = localStorage.getItem("userName");
    const isAdmin = localStorage.getItem("isAdmin") === "true";

    if (urlSessionId) {
      // Om användaren redan är med i sessionen (userId/sessionId matchar), visa JoinPanel med reconnect
      if (
        savedUserId &&
        savedSessionId &&
        savedSessionId === urlSessionId &&
        !isAdmin
      ) {
        setView("join");
        return;
      }
      // Annars: visa JoinPanel för ny användare
      setView("join");
      return;
    }

    // Check if user was previously logged in (reconnect on refresh) - SECOND PRIORITY

    // If user was in voting session, try to reconnect first
    if (savedUserId && savedSessionId && savedUserName && !isAdmin) {
      attemptReconnect(savedUserId, savedSessionId, savedUserName);
      return;
    }

    // If admin was in session, try to reconnect
    if (isAdmin && savedSessionId) {
      attemptAdminReconnect(savedSessionId);
      return;
    }

    // Default to admin view
    setView("admin");
  }, []);

  const attemptAdminReconnect = async (sessionId) => {
    try {
      const host = window.location.hostname;
      const apiUrl = `http://${host}:8001`;
      const response = await fetch(`${apiUrl}/api/admin/status`, {
        method: "GET",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.sessionId === sessionId) {
          setSessionId(sessionId);
          setContestants(data.contestants || []);
          setCategories([
            { id: "clothing", name: "Klädsel" },
            { id: "performance", name: "Uppträdande" },
            { id: "song", name: "Låt" },
          ]);
          setView("admin-started");
          console.log("Admin reconnected successfully");
          return;
        }
      }
      // Session not found, clear storage
      localStorage.removeItem("sessionId");
      localStorage.removeItem("isAdmin");
      setView("admin");
    } catch (error) {
      console.error("Admin reconnect failed:", error);
      localStorage.removeItem("sessionId");
      localStorage.removeItem("isAdmin");
      setView("admin");
    }
  };

  const attemptReconnect = async (userId, sessionId, userName) => {
    try {
      const host = window.location.hostname;
      const apiUrl = `http://${host}:8001`;
      const response = await fetch(`${apiUrl}/api/user/reconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, sessionId }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserId(userId);
        setUserName(userName);
        setContestants(data.contestants);
        setCategories(data.categories);
        setSessionId(sessionId);
        setView("voting");
        return;
      }
    } catch (error) {
      console.error("Reconnect failed:", error);
    }

    // If reconnect failed, clear localStorage and go back to admin
    localStorage.removeItem("userId");
    localStorage.removeItem("sessionId");
    localStorage.removeItem("userName");
    localStorage.removeItem("isAdmin");
    setView("admin");
  };

  // --- Persist voting progress and restore on reconnect ---
  // This effect runs when userId changes (i.e. after join or reconnect)
  useEffect(() => {
    if (!userId) return;
    // Save all voting progress to localStorage on change
    const saveProgress = () => {
      localStorage.setItem("userId", userId);
      localStorage.setItem("sessionId", sessionId);
      localStorage.setItem("userName", userName || "");
    };
    saveProgress();
  }, [userId, sessionId, userName]);

  const handleAdminStart = (newSessionId, contestantList, categoryList) => {
    setSessionId(newSessionId);
    setContestants(contestantList);
    setCategories(categoryList);
    // Save admin session to localStorage
    localStorage.setItem("sessionId", newSessionId);
    localStorage.setItem("isAdmin", "true");
    setView("admin-started");
  };

  const handleUserJoin = (
    newUserId,
    contestantList,
    categoryList,
    name,
    joinedSessionId,
  ) => {
    setUserId(newUserId);
    setUserName(name);
    setContestants(contestantList);
    setCategories(categoryList);
    setSessionId(joinedSessionId); // Update sessionId in state

    // Save to localStorage for reconnect on refresh
    localStorage.setItem("userId", newUserId);
    localStorage.setItem("sessionId", joinedSessionId);
    localStorage.setItem("userName", name);
    localStorage.setItem("isAdmin", "false"); // Mark as regular user

    setView("voting");
  };

  const handleResultsView = () => {
    setView("results");
  };

  return (
    <div className="app">
      {view === "admin" && <AdminPanel onStart={handleAdminStart} />}
      {view === "admin-started" && (
        <div>
          <AdminPanel
            sessionId={sessionId}
            contestants={contestants}
            onViewResults={handleResultsView}
          />
        </div>
      )}
      {view === "join" && (
        <JoinPanel
          sessionId={
            sessionId ||
            new URLSearchParams(window.location.search).get("session")
          }
          onJoin={handleUserJoin}
        />
      )}
      {view === "voting" && (
        <VotingPanel
          userId={userId}
          userName={userName}
          contestants={contestants}
          categories={categories}
          onViewResults={handleResultsView}
        />
      )}
      {view === "results" && <ResultsPanel />}
    </div>
  );
}

export default App;
