const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI);

    console.log("========================================");
    console.log("✅ MongoDB Connected Successfully");
    console.log(`Database Host: ${connection.connection.host}`);
    console.log("========================================");
  } catch (error) {
    console.error("========================================");
    console.error("❌ MongoDB Connection Failed");
    console.error(error.message);
    console.error("========================================");

    process.exit(1);
  }
};

module.exports = connectDB;