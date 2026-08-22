const express = require("express");
const cors = require("cors");

const authRoutes = require("./modules/auth/auth.routes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health Check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    project: "Emergency Railway Journey Assistant",
    version: "1.0.0",
    message: "ERJA Backend is running successfully 🚆",
  });
});

// Authentication Routes
app.use("/api/auth", authRoutes);

module.exports = app;