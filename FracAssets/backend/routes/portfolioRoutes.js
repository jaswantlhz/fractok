const express = require("express");
const fetch = require("node-fetch");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();
const HEDERA_API = process.env.HEDERA_API_URL || "http://localhost:8000";

// GET /api/portfolio — fetch user's holdings from MongoDB via Python API
router.get("/portfolio", verifyToken, async (req, res) => {
  try {
    const auth0_id = req.user?.sub;
    if (!auth0_id) return res.status(401).json({ message: "No user identity" });

    const r = await fetch(`${HEDERA_API}/portfolio?auth0_id=${encodeURIComponent(auth0_id)}`);
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/invest — record an investment in MongoDB
router.post("/invest", verifyToken, async (req, res) => {
  try {
    const auth0_id = req.user?.sub;
    if (!auth0_id) return res.status(401).json({ message: "No user identity" });

    const body = { ...req.body, auth0_id };
    const r = await fetch(`${HEDERA_API}/portfolio/invest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
