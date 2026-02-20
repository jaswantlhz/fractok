const express = require("express");
const fetch = require("node-fetch");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();
const HEDERA_API = process.env.HEDERA_API_URL || "http://localhost:8000";

// GET /api/assets — fetch real marketplace listings from MongoDB via Python API
router.get("/assets", verifyToken, async (req, res) => {
  try {
    const r = await fetch(`${HEDERA_API}/marketplace`);
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
