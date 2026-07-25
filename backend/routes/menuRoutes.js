const express = require("express");
const router = express.Router();

const {
  getMenus,
  createMenu,
  updateMenu,
  deleteMenu,
} = require("../controllers/menuController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

// =========================
// PUBLIC ROUTES
// =========================

// Get all menus
router.get("/", getMenus);

// =========================
// VENDOR ROUTES
// =========================

// Create menu
router.post(
  "/",
  protect,
  authorize("vendor"),
  createMenu
);

// Update menu
router.put(
  "/:id",
  protect,
  authorize("vendor"),
  updateMenu
);

// Delete menu
router.delete(
  "/:id",
  protect,
  authorize("vendor"),
  deleteMenu
);

module.exports = router;