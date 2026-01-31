import React, { useState, useEffect } from "react";
import axios from "axios";

const ResultsPanel = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  const getApiUrl = () => {
    const host = window.location.hostname;
    return `http://${host}:8001`;
  };

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchResults = async () => {
    try {
      const response = await axios.get(`${getApiUrl()}/api/results`);
      setResults(response.data);
    } catch (error) {
      console.error("Error fetching results:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="container">
        <p>Laddar resultat...</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="container">
        <p>Ingen data tillgänglig ännu</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🏆 Resultat</h1>
        <p>Total röstande: {results.totalVoters}</p>
      </div>

      <div style={{ marginBottom: "40px" }}>
        <h2>🌟 Gruppens Favoriter - Top 3</h2>
        {results.topContestants && results.topContestants.length > 0 ? (
          <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
            {results.topContestants.slice(0, 3).map((contestant, idx) => (
              <div key={contestant.id} className="card">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.5em" }}>#{idx + 1}</h3>
                    <p
                      style={{
                        margin: "10px 0 0 0",
                        fontSize: "1.3em",
                        fontWeight: "bold",
                      }}
                    >
                      {contestant.name}
                    </p>
                  </div>
                  <div className="score-display" style={{ fontSize: "2.5em" }}>
                    {contestant.totalScore.toFixed(1)}
                  </div>
                </div>
                <div
                  style={{
                    marginTop: "15px",
                    fontSize: "0.95em",
                    color: "#666",
                  }}
                >
                  <p>
                    🧥 Klädsel:{" "}
                    {contestant.categoryScores.clothing.avg.toFixed(1)}
                  </p>
                  <p>
                    🎤 Uppträdande:{" "}
                    {contestant.categoryScores.performance.avg.toFixed(1)}
                  </p>
                  <p>🎵 Låt: {contestant.categoryScores.song.avg.toFixed(1)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>Inga röster ännu</p>
        )}
      </div>

      <div style={{ marginBottom: "40px" }}>
        <h2>👥 Alla Bidrag - Fullständig Ranking</h2>
        {results.topContestants && results.topContestants.length > 0 ? (
          <div className="grid">
            {results.topContestants.map((contestant, idx) => (
              <div key={contestant.id} className="card">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0 }}>#{idx + 1}</h3>
                    <p
                      style={{
                        margin: "5px 0 0 0",
                        fontSize: "1.1em",
                        fontWeight: "bold",
                      }}
                    >
                      {contestant.name}
                    </p>
                  </div>
                  <div
                    style={{
                      fontSize: "1.8em",
                      fontWeight: "bold",
                      color: "#667eea",
                    }}
                  >
                    {contestant.totalScore.toFixed(1)}
                  </div>
                </div>
                <div
                  style={{
                    marginTop: "10px",
                    fontSize: "0.9em",
                    color: "#999",
                  }}
                >
                  <p>
                    K: {contestant.categoryScores.clothing.avg.toFixed(1)} | U:{" "}
                    {contestant.categoryScores.performance.avg.toFixed(1)} | L:{" "}
                    {contestant.categoryScores.song.avg.toFixed(1)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>Inga röster ännu</p>
        )}
      </div>

      <div>
        <h2>Varje Röstares Top 3</h2>
        {results.userTopThree &&
        Object.keys(results.userTopThree).length > 0 ? (
          <div className="grid">
            {Object.entries(results.userTopThree).map(([userId, userData]) => (
              <div key={userId} className="card">
                <h3>{userData.userName}</h3>
                <ol>
                  {userData.topThree.map((item, idx) => (
                    <li key={idx}>
                      <strong>{item.name}</strong> - {item.score.toFixed(1)}{" "}
                      poäng
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        ) : (
          <p>Inga röster ännu</p>
        )}
      </div>
    </div>
  );
};

export default ResultsPanel;
