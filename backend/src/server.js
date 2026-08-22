require("dotenv").config();
console.log("🚆 SERVER FILE LOADED");
const app = require("./app");
const connectDB = require("./config/database");

// Connect Database
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
========================================
🚆 Emergency Railway Journey Assistant
========================================
Server running on:
http://localhost:${PORT}

Environment: ${process.env.NODE_ENV || "development"}
========================================
`);
});