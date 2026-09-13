const mongoose = require("mongoose");

// =========================================================
// MONGODB DATABASE CONNECTION
// =========================================================

const connectDB = async () => {
  try {
    // -------------------------------------------------------
    // Validate MongoDB URI
    // -------------------------------------------------------

    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI is not configured.");
      process.exit(1);
    }

    // -------------------------------------------------------
    // Connect to MongoDB
    // -------------------------------------------------------

    const connection = await mongoose.connect(
      process.env.MONGODB_URI,
      {
        // ---------------------------------------------------
        // Connection Pool
        // ---------------------------------------------------

        maxPoolSize: 10,
        minPoolSize: 2,

        // ---------------------------------------------------
        // Connection Timeouts
        // ---------------------------------------------------

        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,

        // ---------------------------------------------------
        // Keep connections healthy
        // ---------------------------------------------------

        heartbeatFrequencyMS: 10000,

        // ---------------------------------------------------
        // Prevent buffering requests while DB is unavailable
        // ---------------------------------------------------

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

    process.exit(1);
  }
};


// =========================================================
// MONGOOSE CONNECTION EVENTS
// =========================================================

mongoose.connection.on("error", (error) => {
  console.error(
    "❌ MongoDB Runtime Error:",
    error.message
  );
});

mongoose.connection.on("disconnected", () => {
  console.warn(
    "⚠️ MongoDB disconnected."
  );
});

mongoose.connection.on("reconnected", () => {
  console.log(
    "✅ MongoDB reconnected."
  );
});


// =========================================================
// EXPORT
// =========================================================

module.exports = connectDB;