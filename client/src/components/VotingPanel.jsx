import React, { useState, useEffect } from "react";
import axios from "axios";

const VotingPanel = ({
  userId,
  userName,
  contestants,
  categories,
  onViewResults,
}) => {
  const [votes, setVotes] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [userResults, setUserResults] = useState(null);
  const [resultsRevealed, setResultsRevealed] = useState(false);

  const getApiUrl = () => {
    const host = window.location.hostname;
    return `http://${host}:8001`;
  };

  // Load saved progress on mount
  useEffect(() => {
    const savedVotes = localStorage.getItem(`votes_${userId}`);
    const savedIndex = localStorage.getItem(`currentIndex_${userId}`);
    const savedSubmitted = localStorage.getItem(`submitted_${userId}`);

    if (savedVotes) {
      setVotes(JSON.parse(savedVotes));
    }
    if (savedIndex) {
      setCurrentIndex(parseInt(savedIndex));
    }
    if (savedSubmitted === "true") {
      setSubmitted(true);
    }
  }, [userId]);

  // Poll for results revealed status and fetch results when revealed
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${getApiUrl()}/api/results-revealed`);
        setResultsRevealed(response.data.resultsRevealed);

        // If results are revealed and we haven't fetched yet, fetch them
        if (response.data.resultsRevealed && submitted && !userResults) {
          const resultsResponse = await axios.get(`${getApiUrl()}/api/results`);
          setUserResults(resultsResponse.data);
        }
      } catch (error) {
        console.error("Error checking results status:", error);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted]);

  // Poll for updated results when they are revealed
  useEffect(() => {
    if (!submitted || !resultsRevealed || !userResults) return;

    const interval = setInterval(async () => {
      try {
        const resultsResponse = await axios.get(`${getApiUrl()}/api/results`);
        setUserResults(resultsResponse.data);
      } catch (error) {
        console.error("Error fetching updated results:", error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [submitted, resultsRevealed, userResults]);

  const currentContestant = contestants[currentIndex];
  const contestantId = currentContestant.id.toString();
  const currentVotes = votes[contestantId] || {};
  const allVoted = Object.keys(currentVotes).length === categories.length;

  const handleVote = async (categoryId, score) => {
    try {
      await axios.post(`${getApiUrl()}/api/user/vote`, {
        userId,
        contestantId,
        categoryId,
        score: parseInt(score),
      });

      if (!votes[contestantId]) {
        votes[contestantId] = {};
      }
      votes[contestantId][categoryId] = score.toString();
      const updatedVotes = { ...votes };
      setVotes(updatedVotes);
      // Save votes to localStorage
      localStorage.setItem(`votes_${userId}`, JSON.stringify(updatedVotes));
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const handleNext = () => {
    if (currentIndex < contestants.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      // Save current index to localStorage
      localStorage.setItem(`currentIndex_${userId}`, newIndex.toString());
    } else {
      setShowConfirm(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      // Save current index to localStorage
      localStorage.setItem(`currentIndex_${userId}`, newIndex.toString());
    }
  };

  const handleComplete = async () => {
    try {
      const response = await axios.get(
        `${getApiUrl()}/api/results?userId=${userId}`,
      );
      setUserResults(response.data);
      setSubmitted(true);
      // Save submitted status to localStorage
      localStorage.setItem(`submitted_${userId}`, "true");
    } catch (error) {
      console.error("Error fetching results:", error);
    }
  };

  if (submitted && userResults) {
    return (
      <div className="container">
        <div className="header">
          <h1>🏆 Resultat</h1>
          <p>Tack för dina poäng, {userName}!</p>
        </div>

        <div style={{ marginBottom: "40px" }}>
          <h2>❤️ Dina favoriter - Top 3</h2>
          <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
            {userResults.userTopThree && userResults.userTopThree[userId] ? (
              userResults.userTopThree[userId].topThree.map((item, idx) => (
                <div key={idx} className="card">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0 }}>#{idx + 1}</h3>
                      <p style={{ margin: "5px 0 0 0", fontSize: "1.1em" }}>
                        {item.name}
                      </p>
                    </div>
                    <div
                      style={{
                        fontSize: "2em",
                        fontWeight: "bold",
                        color: "#667eea",
                      }}
                    >
                      {item.score.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>Inga röster ännu</p>
            )}
          </div>
        </div>

        <div style={{ marginBottom: "40px" }}>
          <h2>🌟 Gruppens Favoriter - Top 3</h2>
          <div
            className="grid"
            style={{
              gridTemplateColumns: "1fr",
              filter: resultsRevealed ? "none" : "blur(8px)",
              transition: "filter 0.5s ease",
              position: "relative",
            }}
          >
            {userResults.topContestants &&
            userResults.topContestants.length > 0 ? (
              userResults.topContestants.slice(0, 3).map((item, idx) => (
                <div key={idx} className="card">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0 }}>#{idx + 1}</h3>
                      <p style={{ margin: "5px 0 0 0", fontSize: "1.1em" }}>
                        {item.name}
                      </p>
                    </div>
                    <div
                      style={{
                        fontSize: "2em",
                        fontWeight: "bold",
                        color: "#667eea",
                      }}
                    >
                      {item.totalScore.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>Inga röster ännu</p>
            )}
          </div>
          {!resultsRevealed && (
            <p
              style={{
                textAlign: "center",
                color: "#999",
                marginTop: "15px",
                fontStyle: "italic",
              }}
            >
              Vänta på admin för att se gruppens favoriter...
            </p>
          )}
        </div>

        <div style={{ textAlign: "center" }}>
          {!resultsRevealed && (
            <p style={{ color: "#999" }}>
              Fullständiga resultat visas när admin klickar "Se Resultat"
            </p>
          )}
        </div>
      </div>
    );
  }

  if (showConfirm) {
    return (
      <div className="container">
        <div className="header">
          <h1>❓ Är du klar?</h1>
          <p>Du har röstat på alla {contestants.length} bidrag</p>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: "40px",
            display: "flex",
            gap: "20px",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <button
            className="btn-success"
            onClick={handleComplete}
            style={{ fontSize: "1.2em", padding: "15px 30px" }}
          >
            ✅ Ja, jag är klar
          </button>
          <button
            className="btn-secondary"
            onClick={() => setShowConfirm(false)}
            style={{ fontSize: "1.2em", padding: "15px 30px" }}
          >
            ❌ Nej, gå tillbaka
          </button>
        </div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / contestants.length) * 100;

  return (
    <div className="container">
      <div className="header">
        <h1>🎵 {currentContestant.name}</h1>
        <p>
          Bidrag {currentIndex + 1} av {contestants.length}
        </p>
        <div
          style={{
            width: "100%",
            height: "8px",
            background: "#e2e8f0",
            borderRadius: "4px",
            marginTop: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "#667eea",
              transition: "width 0.3s",
            }}
          />
        </div>
      </div>

      <div className="grid">
        {categories.map((category) => (
          <div key={category.id} className="card">
            <h3>{category.name}</h3>
            <div style={{ marginTop: "15px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: "5px",
                }}
              >
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    onClick={() => handleVote(category.id, score)}
                    style={{
                      padding: "12px",
                      background:
                        currentVotes[category.id] === score.toString()
                          ? "#667eea"
                          : "#e2e8f0",
                      color:
                        currentVotes[category.id] === score.toString()
                          ? "white"
                          : "#333",
                      border:
                        currentVotes[category.id] === score.toString()
                          ? "3px solid #5568d3"
                          : "2px solid #cbd5e0",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "1em",
                      transition: "all 0.2s",
                    }}
                  >
                    {score}
                  </button>
                ))}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: "5px",
                  marginTop: "5px",
                }}
              >
                {[6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    onClick={() => handleVote(category.id, score)}
                    style={{
                      padding: "12px",
                      background:
                        currentVotes[category.id] === score.toString()
                          ? "#667eea"
                          : "#e2e8f0",
                      color:
                        currentVotes[category.id] === score.toString()
                          ? "white"
                          : "#333",
                      border:
                        currentVotes[category.id] === score.toString()
                          ? "3px solid #5568d3"
                          : "2px solid #cbd5e0",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "1em",
                      transition: "all 0.2s",
                    }}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>
            {currentVotes[category.id] && (
              <p
                style={{
                  marginTop: "10px",
                  color: "#667eea",
                  fontWeight: "bold",
                }}
              >
                ✓ {currentVotes[category.id]} poäng
              </p>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          justifyContent: "center",
          marginTop: "30px",
          flexWrap: "wrap",
        }}
      >
        <button
          className="btn-secondary"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          style={{
            opacity: currentIndex === 0 ? 0.5 : 1,
            cursor: currentIndex === 0 ? "not-allowed" : "pointer",
          }}
        >
          ← Tillbaka
        </button>
        <button
          className="btn-primary"
          onClick={handleNext}
          disabled={!allVoted}
          style={{
            opacity: !allVoted ? 0.5 : 1,
            cursor: !allVoted ? "not-allowed" : "pointer",
          }}
        >
          {currentIndex === contestants.length - 1 ? "Slutför" : "Nästa"} →
        </button>
      </div>

      <p style={{ textAlign: "center", color: "#999", marginTop: "15px" }}>
        {allVoted
          ? "✓ Alla kategorier röstade!"
          : `Rösta på ${categories.length - Object.keys(currentVotes).length} kategori${categories.length - Object.keys(currentVotes).length !== 1 ? "er" : ""} till`}
      </p>
    </div>
  );
};

export default VotingPanel;
