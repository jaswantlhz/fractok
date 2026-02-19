const BASE_URL = "http://localhost:5000/api";
const HEDERA_URL = "http://localhost:8000";  // testnet_test.py — token ops
const ONBOARDING_URL = "http://localhost:8001"; // user_onboarding.py — signups

// ─────────────────────────────────────────────
// Helper: Handle Response
// ─────────────────────────────────────────────
const handleResponse = async (res) => {
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || error.detail || "Something went wrong");
  }
  return res.json();
};

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
export const loginUser = async (email, password) => {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
};

// ─────────────────────────────────────────────
// USER REGISTRATION (Python API)
// ─────────────────────────────────────────────
export const registerUser = async (userData) => {
  const res = await fetch(`${ONBOARDING_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return handleResponse(res);
};

// ─────────────────────────────────────────────
// ASSETS
// ─────────────────────────────────────────────
export const getAssets = async (token) => {
  const res = await fetch(`${BASE_URL}/assets`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
};

// ─────────────────────────────────────────────
// PORTFOLIO
// ─────────────────────────────────────────────
export const getPortfolio = async (token) => {
  const res = await fetch(`${BASE_URL}/portfolio`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
};

// ─────────────────────────────────────────────
// INVEST
// ─────────────────────────────────────────────
export const investInAsset = async (token, assetId, amount) => {
  const res = await fetch(`${BASE_URL}/invest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ assetId, amount }),
  });
  return handleResponse(res);
};

// ─────────────────────────────────────────────
// TOKENIZE ASSET (via Express → Python)
// ─────────────────────────────────────────────
export const tokenizeAsset = async (token, assetData) => {
  const res = await fetch(`${BASE_URL}/hedera/create-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(assetData),
  });
  return handleResponse(res);
};

// ─────────────────────────────────────────────
// MINT TOKEN (via Express → Python)
// ─────────────────────────────────────────────
export const mintToken = async (token, tokenId, amount, adminKey) => {
  const res = await fetch(`${BASE_URL}/hedera/mint-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ token_id: tokenId, amount, admin_key: adminKey }),
  });
  return handleResponse(res);
};

// ─────────────────────────────────────────────
// TRANSFER TOKEN (via Express → Python)
// ─────────────────────────────────────────────
export const transferTokenApi = async (token, tokenId, recipientId, amount) => {
  const res = await fetch(`${BASE_URL}/hedera/transfer-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ token_id: tokenId, recipient_id: recipientId, amount }),
  });
  return handleResponse(res);
};

// ─────────────────────────────────────────────
// HEDERA BALANCE (via Python)
// ─────────────────────────────────────────────
export const getHederaBalance = async (accountId) => {
  const res = await fetch(`${HEDERA_URL}/balance?account_id=${accountId}`);
  return handleResponse(res);
};
