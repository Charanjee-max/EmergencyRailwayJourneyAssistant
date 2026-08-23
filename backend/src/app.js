const express = require("express");
const cors = require("cors");

const authRoutes = require("./modules/auth/auth.routes");
const journeyRoutes = require("./modules/journey/journey.routes");
const trainRoutes = require("./modules/train/train.routes");

const app = express();

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

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/journey", journeyRoutes);
app.use("/api/train", trainRoutes);

module.exports = app;