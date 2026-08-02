const dns = require("node:dns");

// Force Google DNS
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/database");

// =========================
// Routes
// =========================
const authRoutes = require("./routes/authRoutes");
const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");
const invitationRoutes = require("./routes/invitationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const facultyRoutes = require("./routes/facultyRoutes"); // NEW

// =========================
// Connect MongoDB
// =========================
connectDB();

const app = express();

// =========================
// Middlewares
// =========================
app.use(cors());
app.use(express.json());

// =========================
// Home Route
// =========================
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to CampusBite API 🚀"
    });
});

// =========================
// API Routes
// =========================
app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/faculty", facultyRoutes); // NEW

// =========================
// 404 Route
// =========================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// =========================
// Start Server
// =========================
const PORT = process.env.PORT || 5000;

// Listen on all network interfaces
app.listen(PORT, "0.0.0.0", () => {

    console.log("================================");
    console.log(`🚀 CampusBite Server running`);
    console.log(`Local:   http://localhost:${PORT}`);
    console.log(`Network: http://0.0.0.0:${PORT}`);
    console.log("================================");

});