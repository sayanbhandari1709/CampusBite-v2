const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        console.log("================================");
        console.log("Mongo URI:");
        console.log(process.env.MONGO_URI);
        console.log("================================");

        await mongoose.connect(process.env.MONGO_URI);

        console.log("✅ MongoDB Connected Successfully");

    } catch (error) {
        console.log("================================");
        console.log("FULL ERROR");
        console.log(error);
        console.log("================================");

        process.exit(1);
    }
};

module.exports = connectDB;