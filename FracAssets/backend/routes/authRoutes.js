const express = require("express");
const jwt = require("jsonwebtoken");
const { users } = require("../data/fakeData");

const router = express.Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id }, "secretkey", {
    expiresIn: "1h",
  });

  res.json({
    token,
    user: { id: user.id, email: user.email },
  });
});

module.exports = router;
