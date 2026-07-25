const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Menu = require("../models/Menu");
const Invitation = require("../models/Invitation");

// ======================================
// Dashboard Stats
// ======================================
exports.getDashboardStats = async (req, res) => {
    try {
        const totalFaculty = await User.countDocuments({ role: "faculty" });
        const totalVendors = await User.countDocuments({ role: "vendor" });
        const totalMenus = await Menu.countDocuments();
        const totalInvitations = await Invitation.countDocuments();

        const accepted = await Invitation.countDocuments({ status: "Accepted" });
        const declined = await Invitation.countDocuments({ status: "Declined" });
        const pending = await Invitation.countDocuments({ status: "Pending" });

        res.json({
            success: true,
            stats: {
                totalFaculty,
                totalVendors,
                totalMenus,
                totalInvitations,
                accepted,
                declined,
                pending,
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
// Get All Faculties
// ======================================
exports.getFaculties = async (req, res) => {
    try {
        const faculties = await User.find({ role: "faculty" }).select("-password");

        res.json({
            success: true,
            count: faculties.length,
            faculties,
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
// Add Faculty
// ======================================
exports.createFaculty = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required",
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const faculty = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "faculty",
        });

        res.status(201).json({
            success: true,
            message: "Faculty created successfully",
            faculty: {
                id: faculty._id,
                name: faculty.name,
                email: faculty.email,
                role: faculty.role,
                createdAt: faculty.createdAt,
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
// Get All Vendors
// ======================================
exports.getVendors = async (req, res) => {
    try {

        const vendors = await User.find({ role: "vendor" }).select("-password");

        res.json({
            success: true,
            count: vendors.length,
            vendors,
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
// Add Vendor
// ======================================
exports.createVendor = async (req, res) => {

    try {

        const { name, email, password } = req.body;

        if (!name || !email || !password) {

            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });

        }

        const existing = await User.findOne({ email });

        if (existing) {

            return res.status(400).json({
                success: false,
                message: "Email already exists",
            });

        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const vendor = await User.create({

            name,
            email,
            password: hashedPassword,
            role: "vendor",

        });

        res.status(201).json({

            success: true,
            message: "Vendor created successfully",

            vendor: {

                id: vendor._id,
                name: vendor.name,
                email: vendor.email,
                role: vendor.role,

            }

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,
            message: err.message,

        });

    }

};

// ======================================
// Delete User
// ======================================
exports.deleteUser = async (req, res) => {

    try {

        const user = await User.findById(req.params.id);

        if (!user) {

            return res.status(404).json({

                success: false,
                message: "User not found",

            });

        }

        await User.findByIdAndDelete(req.params.id);

        res.json({

            success: true,
            message: "User deleted successfully",

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,
            message: err.message,

        });

    }

};