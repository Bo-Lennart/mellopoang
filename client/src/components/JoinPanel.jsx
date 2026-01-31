import React, { useState, useEffect } from "react";
import axios from "axios";

const JoinPanel = ({ onJoin, sessionId: propSessionId }) => {
  const [userName, setUserName] = useState("");
  const [sessionId, setSessionId] = useState(propSessionId || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [canReconnect, setCanReconnect] = useState(false);
  const [savedUserName, setSavedUserName] = useState("");

  const getApiUrl = () => {
    // If on localhost, use localhost:8001
    // If on IP, use IP:8001
    const host = window.location.hostname;
    return `http://${host}:8001`;
  };

  useEffect(() => {
    // Get session ID from URL if available
    const params = new URLSearchParams(window.location.search);
    const urlSessionId = params.get("session");
    if (urlSessionId) {
      setSessionId(urlSessionId);
      // Save to localStorage immediately when we get it from URL
      localStorage.setItem("sessionId", urlSessionId);
    }

    // --- Återanslutningsknapp för användare som redan är med ---
    const savedUserId = localStorage.getItem("userId");
    const savedSessionId = localStorage.getItem("sessionId");
    const savedUserName = localStorage.getItem("userName");
    const canReconnectValue = savedUserId && savedSessionId && savedUserName;

    setCanReconnect(canReconnectValue);
    setSavedUserName(savedUserName || "");

    if (canReconnectValue) {
      setSessionId(savedSessionId);
      setUserName(savedUserName);
    }
  }, []);

  const handleJoin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    console.log(
      "Attempting to join with sessionId:",
      sessionId,
      "userName:",
      userName,
    );

    try {
      const response = await axios.post(`${getApiUrl()}/api/user/join`, {
        sessionId: sessionId,
        userName,
      });

      console.log("Join response:", response.data);

      onJoin(
        response.data.userId,
        response.data.contestants,
        response.data.categories,
        userName,
        sessionId,
      );
    } catch (error) {
      console.error(
        "Error joining session:",
        error.response?.data || error.message,
      );
      setError(
        error.response?.data?.error ||
          "Kunde inte ansluta. Kontrollera session-ID.",
      );
    }
    setLoading(false);
  };

  const handleReconnect = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.post(`${getApiUrl()}/api/user/reconnect`, {
        userId: localStorage.getItem("userId"),
        sessionId: localStorage.getItem("sessionId"),
      });
      if (response.data && response.data.userId) {
        onJoin(
          response.data.userId,
          response.data.contestants,
          response.data.categories,
          response.data.userName,
          response.data.sessionId,
        );
      } else {
        setError("Kunde inte återansluta. Försök gå med på nytt.");
      }
    } catch (error) {
      setError("Kunde inte återansluta. Försök gå med på nytt.");
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <div className="header">
        <h1>🎵 Mellopoäng</h1>
        <p>Anslut för att bedöma bidragen</p>
      </div>

      <form
        onSubmit={handleJoin}
        style={{ maxWidth: "400px", margin: "0 auto" }}
      >
        <div className="form-group">
          <label htmlFor="userName">Ditt namn</label>
          <input
            id="userName"
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="T.ex: Anna"
            required
          />
        </div>

        {!sessionId && (
          <div className="form-group">
            <label htmlFor="sessionId">Session-ID</label>
            <input
              id="sessionId"
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="T.ex: ABC123"
              required
            />
          </div>
        )}

        {sessionId && (
          <div className="form-group">
            <p style={{ color: "#667eea", fontWeight: "bold" }}>
              Session: {sessionId}
            </p>
          </div>
        )}

        {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{ width: "100%" }}
        >
          {loading ? "Ansluter..." : "Anslut"}
        </button>

        {canReconnect && (
          <button
            type="button"
            className="btn-secondary"
            style={{ width: "100%", marginBottom: 10 }}
            onClick={handleReconnect}
            disabled={loading}
          >
            Återanslut som {savedUserName}
          </button>
        )}
      </form>
    </div>
  );
};

export default JoinPanel;
