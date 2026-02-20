const fetch = require("node-fetch");
require("dotenv").config();

// Verify Auth0 Token via /userinfo endpoint
// This works even if the token is opaque (no audience)
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  try {
    const issuer = process.env.AUTH0_ISSUER_BASE_URL;
    // Ensure trailing slash logic
    const baseUrl = issuer.endsWith("/") ? issuer : issuer + "/";
    const userinfoUrl = `${baseUrl}userinfo`;

    const response = await fetch(userinfoUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Token validation failed");
    }

    const user = await response.json();
    req.user = user; // Attach user profile to request
    next();
  } catch (error) {
    console.error("Auth Error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = verifyToken;
