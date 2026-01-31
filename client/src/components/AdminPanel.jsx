import React, { useState, useEffect } from "react";
import axios from "axios";

const AdminPanel = ({ onStart, sessionId, contestants, onViewResults }) => {
  const [numContestants, setNumContestants] = useState("");
  const [qrCode, setQrCode] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newContestantName, setNewContestantName] = useState("");
  const [editingContestantId, setEditingContestantId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showNewSessionConfirm, setShowNewSessionConfirm] = useState(false);

  const getApiUrl = () => {
    const host = window.location.hostname;
    return `http://${host}:8001`;
  };

  useEffect(() => {
    if (sessionId && !qrCode) {
      generateQRCode(sessionId);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      // Fetch status immediately and then poll every 2 seconds
      fetchStatus();
      const interval = setInterval(fetchStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [sessionId]);

  const generateQRCode = async (sid) => {
    try {
      console.log("Generating QR code for session:", sid);

      // Get local IP from server
      const ipResponse = await axios.get(`${getApiUrl()}/api/local-ip`);
      const localIP = ipResponse.data.localIP;

      // Use the actual port from the client
      const clientPort = window.location.port || 80;

      // Build the join URL with the correct port
      const joinUrl = `http://${localIP}:${clientPort}?session=${sid}`;

      console.log("Join URL for QR:", joinUrl);

      // Call server to generate QR code with the correct join URL
      const response = await axios.post(`${getApiUrl()}/api/admin/qrcode`, {
        joinUrl,
      });
      console.log("QR code received:", response.data);
      setQrCode(response.data.qrCode);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  const handleInitialize = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Clear old user session data
    localStorage.removeItem("userId");
    localStorage.removeItem("sessionId");
    localStorage.removeItem("userName");

    try {
      const response = await axios.post(`${getApiUrl()}/api/admin/init`, {
        numContestants: parseInt(numContestants),
      });

      const sid = response.data.sessionId;

      onStart(sid, response.data.contestants, [
        { id: "clothing", name: "Klädsel" },
        { id: "performance", name: "Uppträdande" },
        { id: "song", name: "Låt" },
      ]);
    } catch (error) {
      console.error("Error initializing session:", error);
      alert(`Fel: ${error.message}`);
    }
    setLoading(false);
  };

  const fetchStatus = async () => {
    try {
      const response = await axios.get(`${getApiUrl()}/api/admin/status`);
      setStatus(response.data);
    } catch (error) {
      console.error("Error fetching status:", error);
    }
  };

  const handleAddContestant = async () => {
    if (!newContestantName.trim()) {
      alert("Ange ett namn på bidraget");
      return;
    }

    try {
      const response = await axios.post(
        `${getApiUrl()}/api/admin/add-contestants?sessionId=${sessionId}`,
        { contestants: [newContestantName] },
      );
      console.log("Contestant added:", response.data);
      setNewContestantName("");
      fetchStatus(); // Refresh the list
    } catch (error) {
      console.error("Error adding contestant:", error);
      alert("Kunde inte lägga till bidrag");
    }
  };

  const handleStartEditingContestant = (contestant) => {
    setEditingContestantId(contestant.id);
    setEditingName(contestant.name);
  };

  const handleUpdateContestant = async (contestantId) => {
    if (!editingName.trim()) {
      alert("Ange ett namn");
      return;
    }

    try {
      const response = await axios.post(
        `${getApiUrl()}/api/admin/update-contestant?sessionId=${sessionId}`,
        { contestantId, name: editingName },
      );
      console.log("Contestant updated:", response.data);
      setEditingContestantId(null);
      setEditingName("");
      fetchStatus(); // Refresh the list
    } catch (error) {
      console.error("Error updating contestant:", error);
      alert("Kunde inte uppdatera bidrag");
    }
  };

  const handleResetSession = async () => {
    try {
      const response = await axios.post(
        `${getApiUrl()}/api/admin/reset-session?sessionId=${sessionId}`,
      );
      console.log("Session reset:", response.data);
      setShowResetConfirm(false);
      fetchStatus(); // Refresh the status
    } catch (error) {
      console.error("Error resetting session:", error);
      alert("Kunde inte starta om sessionen");
    }
  };

  const handleStartNewSession = async () => {
    try {
      await axios.post(`${getApiUrl()}/api/admin/start-new-session`);
      console.log("New session started");
      setShowNewSessionConfirm(false);
      // Clear localStorage and reset everything
      localStorage.removeItem("sessionId");
      localStorage.removeItem("isAdmin");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      // Call parent to reset state and go back to admin setup
      window.location.reload(); // Simple way to reset everything
    } catch (error) {
      console.error("Error starting new session:", error);
      alert("Kunde inte starta ny session");
    }
  };

  if (sessionId) {
    return (
      <div className="container">
        <div className="header">
          <h1>🎵 Mellopoäng Admin</h1>
          <p>
            Session: <strong>{sessionId}</strong>
          </p>
        </div>

        {qrCode && (
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <h2>QR-kod för att ansluta</h2>
            <img src={qrCode} alt="QR Code" style={{ maxWidth: "300px" }} />
            <p style={{ marginTop: "15px", fontSize: "0.9em", color: "#666" }}>
              Dela denna QR-kod eller länken med andra deltagare
            </p>
          </div>
        )}

        <div style={{ marginBottom: "20px", textAlign: "center" }}>
          <button
            className="btn-primary"
            onClick={() => {
              axios.post(`${getApiUrl()}/api/admin/reveal-results`).then(() => {
                onViewResults();
              });
            }}
          >
            Se Resultat
          </button>
        </div>

        {status && (
          <div className="card">
            <h3>Sessionsöversikt</h3>
            <p>
              <strong>Bidrag att bedöma:</strong> {status.numContestants}
            </p>
            <p>
              <strong>Aktiva användare:</strong> {status.activeUsers}
            </p>

            {status.contestants && (
              <div style={{ marginTop: "20px" }}>
                <h4>🎭 Bidrag:</h4>
                <div style={{ marginBottom: "20px" }}>
                  {status.contestants.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginBottom: "10px",
                        alignItems: "center",
                      }}
                    >
                      {editingContestantId === c.id ? (
                        <>
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            style={{
                              flex: 1,
                              padding: "8px",
                              borderRadius: "4px",
                              border: "1px solid #4facfe",
                              backgroundColor: "#1a1a1a",
                              color: "white",
                            }}
                          />
                          <button
                            className="btn-primary"
                            onClick={() => handleUpdateContestant(c.id)}
                            style={{ padding: "8px 12px", fontSize: "0.9em" }}
                          >
                            Spara
                          </button>
                          <button
                            className="btn-secondary"
                            onClick={() => setEditingContestantId(null)}
                            style={{ padding: "8px 12px", fontSize: "0.9em" }}
                          >
                            Avbryt
                          </button>
                        </>
                      ) : (
                        <>
                          <span style={{ flex: 1 }}>
                            {c.id}. {c.name}
                          </span>
                          <button
                            className="btn-secondary"
                            onClick={() => handleStartEditingContestant(c)}
                            style={{ padding: "8px 12px", fontSize: "0.9em" }}
                          >
                            Redigera
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginBottom: "20px",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Nytt bidrag..."
                    value={newContestantName}
                    onChange={(e) => setNewContestantName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddContestant();
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "4px",
                      border: "1px solid #4facfe",
                      backgroundColor: "#1a1a1a",
                      color: "white",
                    }}
                  />
                  <button
                    className="btn-primary"
                    onClick={handleAddContestant}
                    style={{ padding: "10px 15px" }}
                  >
                    + Lägg till
                  </button>
                </div>
              </div>
            )}

            {status.users && status.users.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <h4>Anslutna användare:</h4>
                <ul>
                  {status.users.map((u) => (
                    <li key={u.id}>{u.name}</li>
                  ))}
                </ul>
              </div>
            )}

            <div
              style={{
                marginTop: "20px",
                paddingTop: "20px",
                borderTop: "1px solid #444",
              }}
            >
              {showResetConfirm ? (
                <div
                  style={{
                    backgroundColor: "#2a2a2a",
                    padding: "15px",
                    borderRadius: "4px",
                    border: "2px solid #ff6b6b",
                  }}
                >
                  <p>
                    <strong>⚠️ Är du säker?</strong> Detta rensar alla röster
                    och användare, men behåller bidragen.
                  </p>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      className="btn-primary"
                      onClick={handleResetSession}
                      style={{
                        backgroundColor: "#ff6b6b",
                        padding: "10px 15px",
                      }}
                    >
                      Ja, starta om
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setShowResetConfirm(false)}
                      style={{ padding: "10px 15px" }}
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="btn-secondary"
                  onClick={() => setShowResetConfirm(true)}
                  style={{ padding: "10px 15px", color: "#ff6b6b" }}
                >
                  🔄 Starta om session (rensa röster)
                </button>
              )}

              <div
                style={{
                  marginTop: "20px",
                  paddingTop: "20px",
                  borderTop: "1px solid #444",
                }}
              >
                {showNewSessionConfirm ? (
                  <div
                    style={{
                      backgroundColor: "#2a2a2a",
                      padding: "15px",
                      borderRadius: "4px",
                      border: "2px solid #ff9500",
                    }}
                  >
                    <p>
                      <strong>⚠️ Starta helt ny session?</strong> Alla bidrag,
                      röster och användare tas bort. Du startar från början.
                    </p>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        className="btn-primary"
                        onClick={handleStartNewSession}
                        style={{
                          backgroundColor: "#ff9500",
                          padding: "10px 15px",
                        }}
                      >
                        Ja, starta ny session
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => setShowNewSessionConfirm(false)}
                        style={{ padding: "10px 15px" }}
                      >
                        Avbryt
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="btn-secondary"
                    onClick={() => setShowNewSessionConfirm(true)}
                    style={{ padding: "10px 15px", color: "#ff9500" }}
                  >
                    ➕ Starta ny session
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🎵 Mellopoäng Admin - Setup</h1>
        <p>Sätt upp en ny bedömningssession</p>
      </div>

      <form
        onSubmit={handleInitialize}
        style={{ maxWidth: "500px", margin: "0 auto" }}
      >
        <div className="form-group">
          <label htmlFor="numContestants">Hur många bidrag deltar?</label>
          <input
            id="numContestants"
            type="number"
            min="1"
            max="50"
            value={numContestants}
            onChange={(e) => setNumContestants(e.target.value)}
            placeholder="T.ex: 20"
            required
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={loading || !numContestants}
          style={{ width: "100%" }}
        >
          {loading ? "Startar..." : "Starta Session"}
        </button>
      </form>
    </div>
  );
};

export default AdminPanel;
