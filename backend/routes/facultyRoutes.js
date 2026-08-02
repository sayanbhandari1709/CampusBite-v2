// backend/routes/facultyRoutes.js
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
    getFacultyDashboard,
    getFacultyHistory,
    updateFacultyResponse,
} = require("../controllers/facultyController");

router.get("/dashboard", protect, getFacultyDashboard);
router.get("/history", protect, getFacultyHistory);
router.put("/response/:invitationId", protect, updateFacultyResponse);

module.exports = router;