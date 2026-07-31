const nodemailer = require("nodemailer");
const dns = require("dns");

// Prefer IPv4 over IPv6
dns.setDefaultResultOrder("ipv4first");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 587,
  secure: false, // STARTTLS

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  tls: {
    rejectUnauthorized: false,
    minVersion: "TLSv1.2",
  },

  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
});

transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP Verify Error:", error);
  } else {
    console.log("✅ SMTP Server Ready");
  }
});

module.exports = transporter;