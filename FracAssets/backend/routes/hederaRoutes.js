const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const verifyToken = require("../middleware/authMiddleware");

const HEDERA_API = process.env.HEDERA_API_URL || "http://localhost:8000";

// Helper: forward JSON POST to Python Hedera API
const forwardToHedera = async (path, body) => {
    const res = await fetch(`${HEDERA_API}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
        const err = new Error(data.detail || data.message || "Hedera API error");
        err.status = res.status;
        throw err;
    }
    return data;
};

// ── POST /api/hedera/create-token ─────────────────────────────────────────
// Injects auth0_id from JWT so Python can store the asset creator
router.post("/create-token", verifyToken, async (req, res) => {
    try {
        const auth0_id = req.user?.sub || null;
        const result = await forwardToHedera("/create-token", { ...req.body, auth0_id });
        res.json(result);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
});

// ── POST /api/hedera/mint-token ───────────────────────────────────────────
router.post("/mint-token", verifyToken, async (req, res) => {
    try {
        const result = await forwardToHedera("/mint-token", req.body);
        res.json(result);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
});

// ── POST /api/hedera/transfer-token ──────────────────────────────────────
router.post("/transfer-token", verifyToken, async (req, res) => {
    try {
        const result = await forwardToHedera("/transfer-token", req.body);
        res.json(result);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
});

// ── POST /api/hedera/create-account ──────────────────────────────────────
router.post("/create-account", verifyToken, async (req, res) => {
    try {
        const result = await forwardToHedera("/create-account", req.body);
        res.json(result);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
});

// ── GET /api/hedera/balance ───────────────────────────────────────────────
router.get("/balance", verifyToken, async (req, res) => {
    try {
        const { account_id } = req.query;
        const fetchRes = await fetch(`${HEDERA_API}/balance?account_id=${account_id}`);
        const data = await fetchRes.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── GET /api/hedera/transactions/:accountId ───────────────────────────────
router.get("/transactions/:accountId", verifyToken, async (req, res) => {
    try {
        const { accountId } = req.params;
        const fetchRes = await fetch(`${HEDERA_API}/transactions/${accountId}`);
        const data = await fetchRes.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
