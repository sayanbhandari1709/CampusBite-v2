const crypto = require("crypto");
const { BrevoClient } = require("@getbrevo/brevo");

const Invitation = require("../models/Invitation");

const BASE_URL =
  process.env.BASE_URL || "https://campusbite-v2.onrender.com";

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
  timeoutInSeconds: 30,
  maxRetries: 2,
});

const sendInvitationEmail = async (faculty, menu, vendor) => {
  const token = crypto.randomBytes(32).toString("hex");

  await Invitation.create({
    faculty: faculty._id,
    facultyEmail: faculty.email,
    vendor: vendor._id,
    menu: menu._id,
    token,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  const yesLink = `${BASE_URL}/api/invitations/${token}/yes`;
  const noLink = `${BASE_URL}/api/invitations/${token}/no`;

  const senderEmail = process.env.SENDER_EMAIL || process.env.EMAIL_USER;

  const payload = {
    sender: {
      name: vendor.name || "CampusBite",
      email: senderEmail,
    },
    to: [
      {
        email: faculty.email,
        name: faculty.name,
      },
    ],
    subject: "🍽 CampusBite - Today's Menu",
    htmlContent: `
      <div style="font-family:Arial,sans-serif;padding:20px">
        <h2>CampusBite</h2>

        <p>Hello <b>${faculty.name}</b>,</p>

        <p>Today's available menu item:</p>

        <hr>

        <h3>${menu.name}</h3>

        <p>${menu.description || ""}</p>

        <p><b>Category:</b> ${menu.category}</p>

        <p><b>Price:</b> ₹${menu.price}</p>

        <br>

        <a href="${yesLink}"
           style="background:#16a34a;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;margin-right:10px;">
          ✅ YES
        </a>

        <a href="${noLink}"
           style="background:#dc2626;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;">
          ❌ NO
        </a>

        <br><br>

        <small>This invitation expires in 24 hours.</small>
      </div>
    `,
  };

  try {
    const result = await brevo.transactionalEmails.sendTransacEmail(payload);
    console.log("✅ Brevo Email Sent:", result);
    return result;
  } catch (error) {
    console.error("❌ Brevo Email Error:", error);
    throw error;
  }
};

module.exports = {
  sendInvitationEmail,
};