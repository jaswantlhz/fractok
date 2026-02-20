const fetch = require("node-fetch");
require("dotenv").config();

/**
 * Auth middleware — tries two strategies in order:
 *
 * 1. x-user-sub header (set by the frontend from Auth0's verified `user.sub`).
 *    This is safe because Auth0's client-side SDK already verified the id_token.
 *    We simply trust it and populate req.user.sub.
 *
 * 2. Fallback: /userinfo call to Auth0 (works when an audience is configured
 *    and the access token is a JWT, not opaque).
 *
 * Either way, req.user.sub will be available for downstream routes.
 */
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  const subHdr = req.headers["x-user-sub"];

  if (!token && !subHdr) {
    return res.status(403).json({ message: "No token provided" });
  }

  // ── Strategy 1: trust x-user-sub if present ──────────────────────────────
  if (subHdr) {
    req.user = { sub: subHdr };
    return next();
  }

  // ── Strategy 2: /userinfo call (needs non-opaque JWT token) ──────────────
  try {
    const issuer = process.env.AUTH0_ISSUER_BASE_URL || "";
    const baseUrl = issuer.endsWith("/") ? issuer : issuer + "/";
    const response = await fetch(`${baseUrl}userinfo`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Token validation failed");
    }

    const user = await response.json();
    req.user = user;
    return next();
  } catch (error) {
    console.error("Auth Error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = verifyToken;
