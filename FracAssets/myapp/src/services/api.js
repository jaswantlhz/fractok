const BASE_URL = "http://localhost:5000/api";
const HEDERA_URL = "http://localhost:8000";   // testnet_test.py — token ops
const ONBOARDING_URL = "http://localhost:8002"; // user_onboarding.py — signups

// ─────────────────────────────────────────────
// Helper: Build auth headers (token + user sub)
// x-user-sub lets the backend skip the /userinfo round-trip.
// The sub is populated from Auth0's verified user object in AuthContext.
// ─────────────────────────────────────────────
const authHeaders = (token, extra = {}) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
  "x-user-sub": localStorage.getItem("auth0_sub") || "",
  ...extra,
});

// ─────────────────────────────────────────────
// Helper: Handle Response
// ─────────────────────────────────────────────
const handleResponse = async (res) => {
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    // FastAPI 422 returns detail as an array of validation error objects
    let detail = error.detail;
    if (Array.isArray(detail)) {
      detail = detail.map((d) => `${d.loc?.join(".")}: ${d.msg}`).join(", ");
    }
    throw new Error(error.message || detail || "Something went wrong");
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
// USER SYNC (Auth0 + MetaMask → Python onboarding API)
// ─────────────────────────────────────────────
export const syncUser = async (token, userData) => {
  const res = await fetch(`${ONBOARDING_URL}/sync-user`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(userData),
  });
  return handleResponse(res);
};

// ─────────────────────────────────────────────
// ASSETS
// ─────────────────────────────────────────────
export const getAssets = async (token) => {
  const res = await fetch(`${BASE_URL}/assets`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
};

// ─────────────────────────────────────────────
// PORTFOLIO
// ─────────────────────────────────────────────
export const getPortfolio = async (token) => {
  const res = await fetch(`${BASE_URL}/portfolio`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
};

// ─────────────────────────────────────────────
// INVEST
// ─────────────────────────────────────────────
export const investInAsset = async (token, assetData) => {
  const res = await fetch(`${BASE_URL}/invest`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(assetData),
  });
  return handleResponse(res);
};

// ─────────────────────────────────────────────
// TOKENIZE ASSET (via Express → Python)
// ─────────────────────────────────────────────
export const tokenizeAsset = async (token, assetData) => {
  const res = await fetch(`${BASE_URL}/hedera/create-token`, {
    method: "POST",
    headers: authHeaders(token),
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
    headers: authHeaders(token),
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
    headers: authHeaders(token),
    body: JSON.stringify({ token_id: tokenId, recipient_id: recipientId, amount }),
  });
  return handleResponse(res);
};

// ─────────────────────────────────────────────
// HEDERA BALANCE (via Python, no auth needed)
// ─────────────────────────────────────────────
export const getHederaBalance = async (accountId) => {
  const res = await fetch(`${HEDERA_URL}/balance?account_id=${accountId}`);
  return handleResponse(res);
};
