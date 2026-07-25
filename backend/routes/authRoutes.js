const express = require("express");
const router = express.Router();

const {
  register,
  login,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

/*
==================================================
PUBLIC ROUTES
==================================================
*/

// Register a new user
// POST /api/auth/register
router.post("/register", register);

// Login existing user
// POST /api/auth/login
router.post("/login", login);

/*
==================================================
PROTECTED ROUTES
==================================================
*/

// Get logged-in user's profile
// GET /api/auth/profile
router.get("/profile", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Profile fetched successfully",
    user: req.user,
  });
});

module.exports = router;
