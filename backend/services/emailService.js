const crypto = require("crypto");
const brevo = require("@getbrevo/brevo");

console.log("🚀 USING BREVO EMAIL SERVICE");

const Invitation = require("../models/Invitation");

const BASE_URL =
  process.env.BASE_URL || "https://campusbite-v2.onrender.com";

// ===============================
// Configure Brevo API
// ===============================
const apiInstance = new brevo.TransactionalEmailsApi();

apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

// ===============================
// Send Invitation Email
// ===============================
const sendInvitationEmail = async (faculty, menu, vendor) => {
  const token = crypto.randomBytes(32).toString("hex");

  // Save invitation
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

  const email = new brevo.SendSmtpEmail();

  email.sender = {
    name: vendor.name || "CampusBite",
    email: process.env.SENDER_EMAIL,
  };

  email.to = [
    {
      email: faculty.email,
      name: faculty.name,
    },
  ];

  email.subject = "🍽 CampusBite - Today's Menu";

  email.htmlContent = `
    <div style="font-family:Arial,sans-serif;padding:20px">

      <h2>CampusBite</h2>

      <p>Hello <b>${faculty.name}</b>,</p>

      <p>Today's available menu item:</p>

      <hr>

      <h3>${menu.name}</h3>

      <p>${menu.description}</p>

      <p><b>Category:</b> ${menu.category}</p>

      <p><b>Price:</b> ₹${menu.price}</p>

      <br>

      <a
        href="${yesLink}"
        style="
          background:#16a34a;
          color:white;
          padding:12px 24px;
          text-decoration:none;
          border-radius:8px;
          margin-right:10px;
        "
      >
        ✅ YES
      </a>

      <a
        href="${noLink}"
        style="
          background:#dc2626;
          color:white;
          padding:12px 24px;
          text-decoration:none;
          border-radius:8px;
        "
      >
        ❌ NO
      </a>

      <br><br>

      <small>
        This invitation expires in 24 hours.
      </small>

    </div>
  `;

  try {
    const response = await apiInstance.sendTransacEmail(email);
    console.log("✅ Brevo Email Sent:", response);
  } catch (error) {
    console.error("❌ Brevo Email Error:", error);
    throw error;
  }
};

module.exports = {
  sendInvitationEmail,
};