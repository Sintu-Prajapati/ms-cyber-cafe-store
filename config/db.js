const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        // Recommended options for the MongoDB driver
        const uri = process.env.MONGODB_URI;

        // silence strictQuery deprecation in Mongoose 7+ when users pass filters as objects
        if (typeof mongoose.set === "function") {
            mongoose.set("strictQuery", false);
        }

        await mongoose.connect(uri, {
            // serverSelectionTimeoutMS controls how long the driver will try to
            // select a server for an operation before failing.
            serverSelectionTimeoutMS: 30000
        });

        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:");
        console.error(error);

        // exit so the process manager (or developer) notices the failure
        process.exit(1);
    }
};

module.exports = connectDB;