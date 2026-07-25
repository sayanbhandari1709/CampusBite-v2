const express = require("express");
const router = express.Router();

const {
    createOrder,
    getMyOrders,
    getVendorOrders,
    updateOrderStatus,
    getVendorDashboard,
} = require("../controllers/orderController");

const { protect, authorize } = require("../middleware/authMiddleware");

// ==========================================
// Faculty Routes
// ==========================================

// Place Order
router.post(
    "/",
    protect,
    authorize("faculty"),
    createOrder
);

// My Orders
router.get(
    "/my",
    protect,
    authorize("faculty"),
    getMyOrders
);

// ==========================================
// Vendor Routes
// ==========================================

// Dashboard
router.get(
    "/vendor/dashboard",
    protect,
    authorize("vendor"),
    getVendorDashboard
);

// View Orders
router.get(
    "/vendor",
    protect,
    authorize("vendor"),
    getVendorOrders
);

// Update Order Status
router.put(
    "/:id/status",
    protect,
    authorize("vendor"),
    updateOrderStatus
);

module.exports = router;