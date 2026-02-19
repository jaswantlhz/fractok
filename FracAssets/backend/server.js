const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const assetRoutes = require("./routes/assetRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const hederaRoutes = require("./routes/hederaRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json());

// ── Routes ────────────────────────────────────────────────────────────────
app.use("/api", authRoutes);
app.use("/api", assetRoutes);
app.use("/api", portfolioRoutes);
app.use("/api/hedera", hederaRoutes);

// ── Health Check ──────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`FracAssets backend running on http://localhost:${PORT}`);
  console.log(`Hedera API proxied to: ${process.env.HEDERA_API_URL || "http://localhost:8000"}`);
});
