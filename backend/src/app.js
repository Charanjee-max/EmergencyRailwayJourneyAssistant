const express = require("express");
const cors = require("cors");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health Check Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    project: "Emergency Railway Journey Assistant",
    version: "1.0.0",
    message: "ERJA Backend is running successfully 🚆"
  });
});

module.exports = app;