const Menu = require("../models/Menu");

// =============================
// CREATE MENU ITEM
// =============================
const createMenu = async (req, res) => {
    try {
        const menu = await Menu.create({
            ...req.body,
            vendor: req.user.id,
        });

        res.status(201).json({
            success: true,
            message: "Menu item created",
            menu,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// =============================
// GET ALL MENU ITEMS
// =============================
const getMenus = async (req, res) => {
    try {
        const menus = await Menu.find().populate("vendor", "name email");

        res.json({
            success: true,
            count: menus.length,
            menus,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// =============================
// UPDATE MENU
// =============================
const updateMenu = async (req, res) => {
    try {

        const menu = await Menu.findById(req.params.id);

        if (!menu) {
            return res.status(404).json({
                success: false,
                message: "Menu not found",
            });
        }

        if (menu.vendor.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const updated = await Menu.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json({
            success: true,
            message: "Menu updated",
            menu: updated,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// =============================
// DELETE MENU
// =============================
const deleteMenu = async (req, res) => {

    try {

        const menu = await Menu.findById(req.params.id);

        if (!menu) {
            return res.status(404).json({
                success: false,
                message: "Menu not found",
            });
        }

        if (menu.vendor.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        await menu.deleteOne();

        res.json({
            success: true,
            message: "Menu deleted successfully",
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }

};

module.exports = {
    createMenu,
    getMenus,
    updateMenu,
    deleteMenu,
};