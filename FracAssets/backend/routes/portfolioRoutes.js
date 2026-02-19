const express = require("express");
const { portfolio, assets } = require("../data/fakeData");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/portfolio", verifyToken, (req, res) => {
  res.json(portfolio);
});

router.post("/invest", verifyToken, (req, res) => {
  const { assetId, amount } = req.body;

  const asset = assets.find((a) => a.id === assetId);

  if (!asset) {
    return res.status(404).json({ message: "Asset not found" });
  }

  const investment = {
    assetId,
    amount,
    price: asset.price,
    status: "confirmed",
  };

  portfolio.push(investment);

  res.json({ message: "Investment successful", investment });
});

module.exports = router;
