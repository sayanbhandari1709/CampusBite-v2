const dns = require("node:dns");

// Force Google DNS
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");
require("dotenv").config();

async function test() {
    try {
        console.log("================================");
        console.log("Node Version:", process.version);
        console.log("Mongo URI:");
        console.log(process.env.MONGO_URI);
        console.log("================================");

        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 30000,
        });

        console.log("✅ MongoDB Connected!");

        const result = await mongoose.connection.db.admin().command({
            ping: 1,
        });

        console.log(result);

        await mongoose.disconnect();

    } catch (err) {

        console.log("================================");
        console.log("FULL ERROR:");
        console.dir(err, { depth: null });
        console.log("================================");

    }
}

test();