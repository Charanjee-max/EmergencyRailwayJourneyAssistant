const mongoose = require("mongoose");

const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not configured.");
    }

    try {
        const connection = await mongoose.connect(
            process.env.MONGODB_URI,
            {
                maxPoolSize: 10,
                minPoolSize: 2,
                serverSelectionTimeoutMS: 10000,
                connectTimeoutMS: 10000,
                socketTimeoutMS: 45000,
                heartbeatFrequencyMS: 10000,
                bufferCommands: false,
            }
        );

        console.log("========================================");
        console.log("✅ MongoDB Connected Successfully");
        console.log(
            `Database Host: ${connection.connection.host}`
        );
        console.log("========================================");
    } catch (error) {
        console.error("========================================");
        console.error("❌ MongoDB Connection Failed");
        console.error(error.message);
        console.error("========================================");

        throw error;
    }
};

mongoose.connection.on("error", (error) => {
    console.error(
        "❌ MongoDB Runtime Error:",
        error.message
    );
});

mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected.");
});

mongoose.connection.on("reconnected", () => {
    console.log("✅ MongoDB reconnected.");
});

module.exports = connectDB;