const express = require("express");
const { assets } = require("../data/fakeData");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/assets", verifyToken, (req, res) => {
  res.json(assets);
});

module.exports = router;
