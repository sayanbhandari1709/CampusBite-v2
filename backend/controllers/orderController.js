const mongoose = require("mongoose");
const Order = require("../models/Order");
const Menu = require("../models/Menu");

// =====================================
// CREATE ORDER
// =====================================
const createOrder = async (req, res) => {
    try {
        console.log("\n========== ORDER DEBUG ==========");

        console.log("BODY:", req.body);
        console.log("USER:", req.user);

        const { menuId, quantity } = req.body;

        console.log("Requested Menu ID:", menuId);
        console.log("Type:", typeof menuId);
        console.log("Length:", menuId ? menuId.length : "undefined");

        // Show all menu items
        const allMenus = await Menu.find();

        console.log("\nALL MENUS:");
        console.log(allMenus);

        if (allMenus.length > 0) {
            console.log("\nFirst Menu ID:", allMenus[0]._id.toString());
            console.log("IDs Equal?:", allMenus[0]._id.toString() === menuId);
        }

        // Search using findById
        const menu = await Menu.findById(menuId);

        console.log("\nFOUND USING findById:");
        console.log(menu);

        // Search using findOne
        const menu2 = await Menu.findOne({ _id: menuId });

        console.log("\nFOUND USING findOne:");
        console.log(menu2);

        console.log("=================================\n");

        if (!menu) {
            return res.status(404).json({
                success: false,
                message: "Menu item not found",
            });
        }

        // Generate token number
        const lastOrder = await Order.findOne().sort({
            tokenNumber: -1,
        });

        let tokenNumber = 101;

        if (lastOrder) {
            tokenNumber = lastOrder.tokenNumber + 1;
        }

        // Create order
        const order = await Order.create({
            faculty: req.user.id,
            vendor: menu.vendor,
            menu: menu._id,
            quantity: quantity || 1,
            totalPrice: menu.price * (quantity || 1),
            tokenNumber,
        });

        console.log("ORDER CREATED:");
        console.log(order);

        res.status(201).json({
            success: true,
            message: "Order placed successfully",
            order,
        });
    } catch (error) {
        console.log("\n========== ERROR ==========");
        console.error(error);
        console.log("===========================\n");

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// =====================================
// GET MY ORDERS
// =====================================
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            faculty: req.user.id,
        })
            .populate("menu")
            .populate("vendor", "name");

        res.json({
            success: true,
            count: orders.length,
            orders,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// =====================================
// GET VENDOR ORDERS
// =====================================
const getVendorOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            vendor: req.user.id,
        })
            .populate("faculty", "name email")
            .populate("menu");

        res.json({
            success: true,
            count: orders.length,
            orders,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// =====================================
// UPDATE ORDER STATUS
// =====================================
const updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        order.status = req.body.status;

        await order.save();

        res.json({
            success: true,
            message: "Order updated",
            order,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// =====================================
// VENDOR DASHBOARD
// =====================================
const getVendorDashboard = async (req, res) => {
    try {
        const vendorId = req.user.id;

        const totalOrders = await Order.countDocuments({
            vendor: vendorId,
        });

        const pendingOrders = await Order.countDocuments({
            vendor: vendorId,
            status: "Pending",
        });

        const preparingOrders = await Order.countDocuments({
            vendor: vendorId,
            status: "Preparing",
        });

        const readyOrders = await Order.countDocuments({
            vendor: vendorId,
            status: "Ready",
        });

        const completedOrders = await Order.countDocuments({
            vendor: vendorId,
            status: "Completed",
        });

        const revenue = await Order.aggregate([
            {
                $match: {
                    vendor: new mongoose.Types.ObjectId(vendorId),
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: {
                        $sum: "$totalPrice",
                    },
                },
            },
        ]);

        const menuItems = await Menu.countDocuments({
            vendor: vendorId,
        });

        res.json({
            success: true,
            dashboard: {
                totalOrders,
                pendingOrders,
                preparingOrders,
                readyOrders,
                completedOrders,
                totalRevenue: revenue.length > 0 ? revenue[0].totalRevenue : 0,
                menuItems,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getVendorOrders,
    updateOrderStatus,
    getVendorDashboard,
};