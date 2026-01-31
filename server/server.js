import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import os from "os";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8001;
const SESSION_FILE = path.join(__dirname, "session_data.json");

app.use(cors());
app.use(express.json());

// In-memory storage - load from file if exists
let sessionData = loadSession() || {
  sessionId: null,
  numContestants: 0,
  contestants: [],
  categories: [
    { id: "clothing", name: "Klädsel" },
    { id: "performance", name: "Uppträdande" },
    { id: "song", name: "Låt" },
  ],
  votes: {}, // userId -> { contestantId -> { categoryId -> score } }
  users: {}, // userId -> { name, scores }
  resultsRevealed: false, // Flag for whether admin has revealed results
  qrCode: null, // Store QR code for later retrieval
};

// Helper function to get local IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

// Save session data to file
function saveSession() {
  try {
    fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));
  } catch (error) {
    console.error("Error saving session:", error);
  }
}

// Load session data from file
function loadSession() {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      const data = fs.readFileSync(SESSION_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading session:", error);
  }
  return null;
}

// Admin endpoints
app.post("/api/admin/init", async (req, res) => {
  const { numContestants, contestantNames } = req.body;

  if (!numContestants || numContestants < 1) {
    return res.status(400).json({ error: "Invalid number of contestants" });
  }

  sessionData.sessionId = uuidv4().slice(0, 8).toUpperCase();
  sessionData.numContestants = numContestants;

  // Create contestant list
  if (contestantNames && contestantNames.length === numContestants) {
    sessionData.contestants = contestantNames.map((name, idx) => ({
      id: idx + 1,
      name: name,
    }));
  } else {
    sessionData.contestants = Array.from(
      { length: numContestants },
      (_, i) => ({
        id: i + 1,
        name: `Bidrag ${i + 1}`,
      }),
    );
  }

  sessionData.votes = {};
  sessionData.users = {};
  sessionData.resultsRevealed = false; // Reset flag when starting new session

  saveSession(); // Save to disk
  res.json({
    sessionId: sessionData.sessionId,
    contestants: sessionData.contestants,
  });
});

app.post("/api/admin/qrcode", async (req, res) => {
  const { joinUrl } = req.body;

  if (!joinUrl) {
    return res.status(400).json({ error: "No join URL provided" });
  }

  try {
    const qrCode = await QRCode.toDataURL(joinUrl);
    sessionData.qrCode = qrCode;
    saveSession();
    res.json({ qrCode });
  } catch (error) {
    console.error("Error generating QR code:", error);
    res.status(500).json({ error: "Failed to generate QR code" });
  }
});

app.get("/api/local-ip", (req, res) => {
  res.json({ localIP: getLocalIP(), clientPort: 3003 });
});

app.get("/api/admin/qrcode", (req, res) => {
  if (!sessionData.qrCode) {
    return res.status(400).json({ error: "No QR code generated yet" });
  }
  res.json({ qrCode: sessionData.qrCode });
});

app.get("/api/admin/status", (req, res) => {
  res.json({
    sessionId: sessionData.sessionId,
    numContestants: sessionData.numContestants,
    contestants: sessionData.contestants,
    activeUsers: Object.keys(sessionData.users).length,
    users: Object.values(sessionData.users).map((u) => ({
      id: u.id,
      name: u.name,
    })),
  });
});

// Add contestants endpoint
app.post("/api/admin/add-contestants", (req, res) => {
  const { contestants } = req.body;

  if (!Array.isArray(contestants) || contestants.length === 0) {
    return res.status(400).json({ error: "Invalid contestants array" });
  }

  // Get the max ID currently used
  const maxId = Math.max(...sessionData.contestants.map((c) => c.id), 0);

  // Add new contestants
  contestants.forEach((name, idx) => {
    sessionData.contestants.push({
      id: maxId + idx + 1,
      name: name,
    });
  });

  sessionData.numContestants = sessionData.contestants.length;
  saveSession();

  res.json({
    contestants: sessionData.contestants,
    numContestants: sessionData.numContestants,
  });
});

// Update contestant name endpoint
app.post("/api/admin/update-contestant", (req, res) => {
  const { contestantId, name } = req.body;

  const contestant = sessionData.contestants.find(
    (c) => c.id.toString() === contestantId.toString(),
  );

  if (!contestant) {
    return res.status(404).json({ error: "Contestant not found" });
  }

  contestant.name = name;
  saveSession();

  res.json({ success: true, contestant });
});

// Reset session endpoint
app.post("/api/admin/reset-session", (req, res) => {
  sessionData.votes = {};
  sessionData.users = {};
  sessionData.resultsRevealed = false;
  saveSession();

  res.json({ success: true, message: "Session reset successfully" });
});

// Start a completely new session (reset everything)
app.post("/api/admin/start-new-session", (req, res) => {
  sessionData.sessionId = null;
  sessionData.numContestants = 0;
  sessionData.contestants = [];
  sessionData.votes = {};
  sessionData.users = {};
  sessionData.resultsRevealed = false;
  sessionData.qrCode = null;
  saveSession();

  res.json({ success: true, message: "New session started, ready for setup" });
});

// User endpoints
app.post("/api/user/join", (req, res) => {
  const { sessionId, userName } = req.body;

  console.log(
    `Join attempt: sessionId="${sessionId}" vs stored="${sessionData.sessionId}"`,
  );

  if (!sessionData.sessionId) {
    console.log("No session started yet!");
    return res.status(400).json({ error: "No session has been started" });
  }

  if (sessionId.toUpperCase() !== sessionData.sessionId) {
    console.log("Session ID mismatch!");
    return res.status(400).json({
      error: "Invalid session ID - expected " + sessionData.sessionId,
    });
  }

  const userId = uuidv4();
  sessionData.users[userId] = {
    id: userId,
    name: userName,
  };
  sessionData.votes[userId] = {};
  saveSession(); // Save to disk

  res.json({
    userId,
    contestants: sessionData.contestants,
    categories: sessionData.categories,
  });
});

// Reconnect endpoint for users who refreshed
app.post("/api/user/reconnect", (req, res) => {
  const { userId, sessionId } = req.body;

  console.log(`Reconnect attempt: userId="${userId}" sessionId="${sessionId}"`);

  if (sessionId !== sessionData.sessionId) {
    return res.status(400).json({ error: "Invalid session ID" });
  }

  if (!sessionData.users[userId]) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    userId,
    userName: sessionData.users[userId].name,
    contestants: sessionData.contestants,
    categories: sessionData.categories,
    votes: sessionData.votes[userId] || {},
  });
});

app.get("/api/user/contestants/:userId", (req, res) => {
  const { userId } = req.params;

  if (!sessionData.users[userId]) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    contestants: sessionData.contestants,
    categories: sessionData.categories,
  });
});

app.post("/api/user/vote", (req, res) => {
  const { userId, contestantId, categoryId, score } = req.body;

  if (!sessionData.users[userId]) {
    return res.status(404).json({ error: "User not found" });
  }

  if (!sessionData.votes[userId][contestantId]) {
    sessionData.votes[userId][contestantId] = {};
  }

  sessionData.votes[userId][contestantId][categoryId] = score;
  saveSession(); // Save to disk

  res.json({ success: true });
});

app.get("/api/user/votes/:userId", (req, res) => {
  const { userId } = req.params;

  if (!sessionData.users[userId]) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(sessionData.votes[userId]);
});

// Results endpoint
app.get("/api/results", (req, res) => {
  const results = calculateResults();
  res.json(results);
});

function calculateResults() {
  const contestantScores = {};

  // Initialize contestant scores
  sessionData.contestants.forEach((c) => {
    contestantScores[c.id] = {
      id: c.id,
      name: c.name,
      totalScore: 0,
      categoryScores: {
        clothing: { total: 0, count: 0, avg: 0 },
        performance: { total: 0, count: 0, avg: 0 },
        song: { total: 0, count: 0, avg: 0 },
      },
    };
  });

  // Aggregate votes
  Object.entries(sessionData.votes).forEach(([userId, userVotes]) => {
    Object.entries(userVotes).forEach(([contestantId, categoryVotes]) => {
      Object.entries(categoryVotes).forEach(([categoryId, score]) => {
        if (contestantScores[contestantId]) {
          const categoryMap = {
            clothing: "clothing",
            performance: "performance",
            song: "song",
          };
          const cat = categoryMap[categoryId];
          if (cat && contestantScores[contestantId].categoryScores[cat]) {
            contestantScores[contestantId].categoryScores[cat].total += score;
            contestantScores[contestantId].categoryScores[cat].count += 1;
          }
        }
      });
    });
  });

  // Calculate averages and totals
  Object.values(contestantScores).forEach((contestant) => {
    Object.values(contestant.categoryScores).forEach((cat) => {
      if (cat.count > 0) {
        cat.avg = cat.total / cat.count;
      }
    });
    const avgScore =
      (contestant.categoryScores.clothing.avg +
        contestant.categoryScores.performance.avg +
        contestant.categoryScores.song.avg) /
      3;
    contestant.totalScore = avgScore;
  });

  // Top contestants
  const topContestants = Object.values(contestantScores)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 10);

  // User top 3
  const userTopThree = {};
  Object.entries(sessionData.votes).forEach(([userId, userVotes]) => {
    const userContestantScores = {};

    Object.entries(userVotes).forEach(([contestantId, categoryVotes]) => {
      let contestantTotal = 0;
      Object.values(categoryVotes).forEach((score) => {
        contestantTotal += score;
      });
      userContestantScores[contestantId] = {
        name: sessionData.contestants.find(
          (c) => c.id.toString() === contestantId.toString(),
        )?.name,
        score: contestantTotal / Object.keys(categoryVotes).length,
      };
    });

    userTopThree[userId] = {
      userName: sessionData.users[userId]?.name,
      topThree: Object.entries(userContestantScores)
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, 3)
        .map(([cid, data]) => data),
    };
  });

  return {
    topContestants,
    userTopThree,
    totalVoters: Object.keys(sessionData.users).length,
    resultsRevealed: sessionData.resultsRevealed,
  };
}

// Admin endpoint to reveal results
app.post("/api/admin/reveal-results", (req, res) => {
  sessionData.resultsRevealed = true;
  saveSession(); // Save to disk
  res.json({ success: true, resultsRevealed: true });
});

// Check if results are revealed
app.get("/api/results-revealed", (req, res) => {
  res.json({ resultsRevealed: sessionData.resultsRevealed });
});

app.listen(PORT, () => {
  const localIP = getLocalIP();
  console.log(`\n🎵 Mellopoäng server kör på http://localhost:${PORT}`);
  console.log(`👥 Participant network: http://${localIP}:${PORT}\n`);
});

// Clean up session data when server is stopped
process.on("SIGINT", () => {
  console.log("\n🛑 Stänger ner servern...");
  if (fs.existsSync(SESSION_FILE)) {
    fs.unlinkSync(SESSION_FILE);
    console.log("🗑️  Session data raderad.");
  }
  process.exit(0);
});
