const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");

const {
    getDashboardStats,
    getFaculties,
    createFaculty,
    getVendors,
    createVendor,
    deleteUser,
} = require("../controllers/adminController");

// ======================================
// Dashboard
// ======================================
router.get(
    "/dashboard",
    protect,
    authorize("admin"),
    getDashboardStats
);

// ======================================
// Faculty Management
// ======================================
router.get(
    "/faculties",
    protect,
    authorize("admin"),
    getFaculties
);

router.post(
    "/faculties",
    protect,
    authorize("admin"),
    createFaculty
);

// ======================================
// Vendor Management
// ======================================

router.get(
    "/vendors",
    protect,
    authorize("admin"),
    getVendors
);

router.post(
    "/vendors",
    protect,
    authorize("admin"),
    createVendor
);

// ======================================
// Delete User (Faculty or Vendor)
// ======================================

router.delete(
    "/users/:id",
    protect,
    authorize("admin"),
    deleteUser
);

module.exports = router;