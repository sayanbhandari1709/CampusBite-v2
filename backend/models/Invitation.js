const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema(
  {
    // Faculty who received the invitation
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Store email as well (useful if faculty email changes later)
    facultyEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    // Vendor who sent today's menu
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Menu item being invited for
    menu: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Menu",
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Accepted", "Declined"],
      default: "Pending",
    },

    token: {
      type: String,
      required: true,
      unique: true,
    },

    sentAt: {
      type: Date,
      default: Date.now,
    },

    respondedAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Faster lookups
invitationSchema.index({ token: 1 });
invitationSchema.index({ faculty: 1, status: 1 });
invitationSchema.index({ vendor: 1 });

module.exports = mongoose.model("Invitation", invitationSchema);