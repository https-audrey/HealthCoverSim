// server.js
const express = require("express");
const cors = require("cors");
require("./db"); // ensures the DB file + schema exist before we start

const quotesRouter = require("./routes/quotes");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/quotes", quotesRouter);

// Generic error handler - never let an uncaught error 500 without a message
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`HealthCoverSim backend running on http://localhost:${PORT}`);
});
