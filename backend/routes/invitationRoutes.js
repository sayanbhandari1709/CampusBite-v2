const express = require("express");
const router = express.Router();

const {
  sendMenuToFaculties,
  acceptInvitation,
  declineInvitation,
  getInvitationStats,
  getFacultyResponses,
} = require("../controllers/invitationController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

// ==============================
// Vendor Routes
// ==============================

// Send today's menu to all faculty
router.post(
  "/send",
  protect,
  authorize("vendor"),
  sendMenuToFaculties
);

// Dashboard statistics
router.get(
  "/stats",
  protect,
  authorize("vendor"),
  getInvitationStats
);

// Faculty responses
router.get(
  "/responses",
  protect,
  authorize("vendor"),
  getFacultyResponses
);

// ==============================
// Public Faculty Routes
// ==============================

// Faculty accepts invitation
router.get("/:token/yes", acceptInvitation);

// Faculty declines invitation
router.get("/:token/no", declineInvitation);

module.exports = router;