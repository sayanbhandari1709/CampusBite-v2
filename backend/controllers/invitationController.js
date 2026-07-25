const mongoose = require("mongoose");
const Invitation = require("../models/Invitation");
const Menu = require("../models/Menu");
const User = require("../models/User");
const Order = require("../models/Order");
const { sendInvitationEmail } = require("../services/emailService");

const getNextTokenNumber = async () => {
  const lastOrder = await Order.findOne()
    .sort({ tokenNumber: -1 })
    .select("tokenNumber");

  return lastOrder && lastOrder.tokenNumber ? lastOrder.tokenNumber + 1 : 101;
};

// ======================================
// Send Today's Menu To All Faculties
// ======================================
exports.sendMenuToFaculties = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const vendor = await User.findById(vendorId).select("name email role");

    if (!vendor || vendor.role !== "vendor") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const menu = await Menu.findOne({
      vendor: vendorId,
      available: true,
    }).sort({ createdAt: -1 });

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "No menu found.",
      });
    }

    const faculties = await User.find({
      role: "faculty",
    }).select("_id name email role");

    if (!faculties.length) {
      return res.status(404).json({
        success: false,
        message: "No faculty found.",
      });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    let sentCount = 0;

    for (const faculty of faculties) {
      const alreadySent = await Invitation.findOne({
        faculty: faculty._id,
        vendor: vendorId,
        menu: menu._id,
        createdAt: {
          $gte: startOfDay,
        },
      });

      if (alreadySent) {
        continue;
      }

      await sendInvitationEmail(faculty, menu, vendor);
      sentCount++;
    }

    return res.status(200).json({
      success: true,
      message: `${sentCount} invitation(s) sent successfully.`,
      sentCount,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Failed to send invitations.",
    });
  }
};

// ======================================
// Faculty clicks YES
// ======================================
exports.acceptInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findOne({
      token: req.params.token,
    })
      .populate("menu")
      .populate("vendor", "name email")
      .populate("faculty", "name email");

    if (!invitation) {
      return res.status(404).send("<h2>Invitation not found.</h2>");
    }

    if (invitation.status !== "Pending") {
      return res.send("<h2>This invitation has already been used.</h2>");
    }

    if (new Date() > invitation.expiresAt) {
      return res.send("<h2>This invitation has expired.</h2>");
    }

    invitation.status = "Accepted";
    invitation.respondedAt = new Date();
    await invitation.save();

    const menuDoc = invitation.menu;

    const tokenNumber = await getNextTokenNumber();

    const order = await Order.create({
      faculty: invitation.faculty,
      vendor: invitation.vendor,
      menu: menuDoc._id,
      quantity: 1,
      totalPrice: menuDoc.price,
      tokenNumber,
      status: "Pending",
    });

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CampusBite</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family:Arial,sans-serif;text-align:center;padding:60px;background:#f8fafc;color:#0f172a;">
        <div style="max-width:520px;margin:0 auto;background:white;padding:32px;border-radius:18px;box-shadow:0 10px 30px rgba(0,0,0,.08);">
          <h1 style="margin-bottom:10px;">✅ Lunch Confirmed</h1>
          <p style="font-size:16px;line-height:1.6;">Your order has been placed successfully.</p>
          <h2 style="margin:24px 0;color:#ea580c;">Token: ${order.tokenNumber}</h2>
          <p style="font-size:14px;color:#475569;">Please show this token at the canteen.</p>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send("<h2>Server Error</h2>");
  }
};

// ======================================
// Faculty clicks NO
// ======================================
exports.declineInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findOne({
      token: req.params.token,
    })
      .populate("menu")
      .populate("vendor", "name email")
      .populate("faculty", "name email");

    if (!invitation) {
      return res.status(404).send("<h2>Invitation not found.</h2>");
    }

    if (invitation.status !== "Pending") {
      return res.send("<h2>This invitation has already been used.</h2>");
    }

    if (new Date() > invitation.expiresAt) {
      return res.send("<h2>This invitation has expired.</h2>");
    }

    invitation.status = "Declined";
    invitation.respondedAt = new Date();
    await invitation.save();

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CampusBite</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family:Arial,sans-serif;text-align:center;padding:60px;background:#f8fafc;color:#0f172a;">
        <div style="max-width:520px;margin:0 auto;background:white;padding:32px;border-radius:18px;box-shadow:0 10px 30px rgba(0,0,0,.08);">
          <h1 style="margin-bottom:10px;">👍 Response Recorded</h1>
          <p style="font-size:16px;line-height:1.6;">Thank you for letting us know.</p>
          <p style="font-size:14px;color:#475569;">Your lunch has not been ordered for today.</p>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send("<h2>Server Error</h2>");
  }
};

// ======================================
// Dashboard Stats
// ======================================
exports.getInvitationStats = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const totalInvitations = await Invitation.countDocuments({ vendor: vendorId });
    const acceptedCount = await Invitation.countDocuments({
      vendor: vendorId,
      status: "Accepted",
    });
    const declinedCount = await Invitation.countDocuments({
      vendor: vendorId,
      status: "Declined",
    });
    const pendingCount = await Invitation.countDocuments({
      vendor: vendorId,
      status: "Pending",
    });

    const totalOrders = await Order.countDocuments({ vendor: vendorId });
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
    const collectedOrders = await Order.countDocuments({
      vendor: vendorId,
      status: "Collected",
    });
    const cancelledOrders = await Order.countDocuments({
      vendor: vendorId,
      status: "Cancelled",
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
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]);

    res.json({
      success: true,
      stats: {
        totalInvitations,
        acceptedCount,
        declinedCount,
        pendingCount,
        totalOrders,
        pendingOrders,
        preparingOrders,
        readyOrders,
        collectedOrders,
        cancelledOrders,
        totalRevenue: revenue.length > 0 ? revenue[0].totalRevenue : 0,
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

// ======================================
// Faculty Responses
// ======================================
exports.getFacultyResponses = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const invitations = await Invitation.find({ vendor: vendorId })
      .sort({ createdAt: -1 })
      .populate("faculty", "name email")
      .populate("menu", "name price category")
      .populate("vendor", "name email");

    const responses = await Promise.all(
      invitations.map(async (invitation) => {
        const order = await Order.findOne({
          faculty: invitation.faculty?._id || invitation.faculty,
          vendor: invitation.vendor?._id || invitation.vendor,
          menu: invitation.menu?._id || invitation.menu,
          createdAt: {
            $gte: invitation.respondedAt || invitation.createdAt,
          },
        })
          .sort({ createdAt: -1 })
          .select("tokenNumber createdAt totalPrice status");

        return {
          id: invitation._id,
          facultyName: invitation.faculty?.name || "Unknown",
          facultyEmail: invitation.facultyEmail,
          menuName: invitation.menu?.name || "Menu Item",
          menuCategory: invitation.menu?.category || "",
          status: invitation.status,
          token: order ? String(order.tokenNumber) : invitation.token,
          orderTokenNumber: order ? order.tokenNumber : null,
          respondedAt: invitation.respondedAt,
          sentAt: invitation.sentAt,
          createdAt: invitation.createdAt,
        };
      })
    );

    res.json({
      success: true,
      count: responses.length,
      responses,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

