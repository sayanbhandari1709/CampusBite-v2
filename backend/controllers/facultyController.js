// backend/controllers/facultyController.js
const Invitation = require("../models/Invitation");
const Order = require("../models/Order");
const User = require("../models/User");

const getNextTokenNumber = async () => {
    const lastOrder = await Order.findOne()
        .sort({ tokenNumber: -1 })
        .select("tokenNumber");

    return lastOrder && lastOrder.tokenNumber ? lastOrder.tokenNumber + 1 : 101;
};

const ensureFacultyAccess = (req, res) => {
    if (!req.user || req.user.role !== "faculty") {
        res.status(403).json({
            success: false,
            message: "Access denied",
        });
        return false;
    }

    return true;
};

const getId = (value) => String(value?._id || value || "");

const serializeOrder = (order) => {
    if (!order) return null;

    return {
        id: getId(order._id),
        tokenNumber: order.tokenNumber,
        status: order.status,
        quantity: order.quantity,
        totalPrice: order.totalPrice,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
    };
};

const serializeInvitation = (invitation, order) => {
    if (!invitation) return null;

    const menu = invitation.menu || null;
    const vendor = invitation.vendor || null;
    const faculty = invitation.faculty || null;

    const activeOrder = order && order.status !== "Cancelled" ? order : null;
    const tokenNumber =
        invitation.status === "Accepted" && activeOrder
            ? activeOrder.tokenNumber
            : null;

    return {
        id: getId(invitation._id),
        status: invitation.status,
        token: tokenNumber,
        tokenNumber,
        sentAt: invitation.sentAt,
        respondedAt: invitation.respondedAt,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        canEdit: new Date() < new Date(invitation.expiresAt),
        menu: menu
            ? {
                  id: getId(menu._id),
                  name: menu.name,
                  description: menu.description,
                  price: menu.price,
                  category: menu.category,
                  image: menu.image,
                  available: menu.available,
              }
            : null,
        vendor: vendor
            ? {
                  id: getId(vendor._id),
                  name: vendor.name,
                  email: vendor.email,
              }
            : null,
        faculty: faculty
            ? {
                  id: getId(faculty._id),
                  name: faculty.name,
                  email: faculty.email,
                  role: faculty.role,
              }
            : null,
        order: serializeOrder(order),
    };
};

const findLatestRelatedOrder = async (invitation) => {
    if (!invitation) return null;

    const facultyId = getId(invitation.faculty);
    const vendorId = getId(invitation.vendor);
    const menuId = getId(invitation.menu);

    return Order.findOne({
        faculty: facultyId,
        vendor: vendorId,
        menu: menuId,
    }).sort({ createdAt: -1 });
};

// ======================================
// Faculty Dashboard
// ======================================
exports.getFacultyDashboard = async (req, res) => {
    try {
        if (!ensureFacultyAccess(req, res)) return;

        const facultyId = req.user.id;

        const faculty = await User.findById(facultyId).select(
            "name email role"
        );

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        let invitation = await Invitation.findOne({
            faculty: facultyId,
            createdAt: { $gte: startOfDay },
        })
            .sort({ createdAt: -1 })
            .populate("menu", "name description price category image available vendor")
            .populate("vendor", "name email")
            .populate("faculty", "name email role");

        if (!invitation) {
            invitation = await Invitation.findOne({
                faculty: facultyId,
            })
                .sort({ createdAt: -1 })
                .populate("menu", "name description price category image available vendor")
                .populate("vendor", "name email")
                .populate("faculty", "name email role");
        }

        let order = null;

        if (invitation) {
            order = await findLatestRelatedOrder(invitation);
        } else {
            order = await Order.findOne({
                faculty: facultyId,
            }).sort({ createdAt: -1 });
        }

        return res.json({
            success: true,
            faculty: faculty
                ? {
                      id: getId(faculty._id),
                      name: faculty.name,
                      email: faculty.email,
                      role: faculty.role,
                  }
                : null,
            invitation: serializeInvitation(invitation, order),
            currentOrder: serializeOrder(order),
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// ======================================
// Faculty History
// ======================================
exports.getFacultyHistory = async (req, res) => {
    try {
        if (!ensureFacultyAccess(req, res)) return;

        const facultyId = req.user.id;

        const invitations = await Invitation.find({
            faculty: facultyId,
        })
            .sort({ createdAt: -1 })
            .populate("menu", "name description price category image available vendor")
            .populate("vendor", "name email")
            .populate("faculty", "name email role");

        const history = await Promise.all(
            invitations.map(async (invitation) => {
                const order = await findLatestRelatedOrder(invitation);
                return serializeInvitation(invitation, order);
            })
        );

        return res.json({
            success: true,
            count: history.length,
            history,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// ======================================
// Update Faculty Response
// ======================================
exports.updateFacultyResponse = async (req, res) => {
    try {
        if (!ensureFacultyAccess(req, res)) return;

        const { invitationId } = req.params;
        const nextStatus = String(req.body.status || "").trim();

        if (!["Accepted", "Declined"].includes(nextStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status",
            });
        }

        const invitation = await Invitation.findById(invitationId)
            .populate("menu", "name description price category image available vendor")
            .populate("vendor", "name email")
            .populate("faculty", "name email role");

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: "Invitation not found",
            });
        }

        if (getId(invitation.faculty) !== String(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (new Date() > new Date(invitation.expiresAt)) {
            return res.status(400).json({
                success: false,
                message: "Invitation has expired",
            });
        }

        const now = new Date();
        let order = await findLatestRelatedOrder(invitation);

        if (nextStatus === "Accepted") {
            invitation.status = "Accepted";
            invitation.respondedAt = now;
            await invitation.save();

            if (!order || order.status === "Cancelled") {
                order = await Order.create({
                    faculty: invitation.faculty._id || invitation.faculty,
                    vendor: invitation.vendor._id || invitation.vendor,
                    menu: invitation.menu._id || invitation.menu,
                    quantity: 1,
                    totalPrice: invitation.menu.price,
                    tokenNumber: await getNextTokenNumber(),
                    status: "Pending",
                });
            }
        }

        if (nextStatus === "Declined") {
            invitation.status = "Declined";
            invitation.respondedAt = now;
            await invitation.save();

            if (order && order.status !== "Cancelled") {
                order.status = "Cancelled";
                await order.save();
            }
        }

        return res.json({
            success: true,
            message: "Response updated successfully.",
            invitation: serializeInvitation(invitation, order),
            order: serializeOrder(order),
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};