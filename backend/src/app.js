const express = require("express");
const cors = require("cors");

const authRoutes = require("./modules/auth/auth.routes");
const journeyRoutes = require("./modules/journey/journey.routes");
const trainRoutes = require("./modules/train/train.routes");
const chartRoutes = require("./modules/chart/chart.routes");
const recommendationRoutes = require("./modules/recommendation/recommendation.routes");

const profileRoutes = require("./modules/profile/profile.routes");
const settingsRoutes = require("./modules/settings/settings.routes");
const notificationRoutes = require("./modules/notification/notification.routes");

// Station
const stationRoutes = require("./modules/station/station.routes");

const app = express();


// ==========================================
// Middleware
// ==========================================

app.use(cors());

app.use(express.json());


// ==========================================
// Health Check
// ==========================================

app.get("/", (req, res) => {

  res.status(200).json({

    success: true,

    project:
      "Emergency Railway Journey Assistant",

    version: "1.0.0",

    message:
      "ERJA Backend is running successfully 🚆",

  });

});


// ==========================================
// API Routes
// ==========================================

// Authentication
app.use(
  "/api/auth",
  authRoutes
);


// Journey
app.use(
  "/api/journey",
  journeyRoutes
);


// Train
app.use(
  "/api/train",
  trainRoutes
);


// Station
app.use(
  "/api/station",
  stationRoutes
);


// Chart
app.use(
  "/api/chart",
  chartRoutes
);


// Recommendations
app.use(
  "/api/recommendations",
  recommendationRoutes
);


// Profile
app.use(
  "/api/profile",
  profileRoutes
);


// Settings
app.use(
  "/api/settings",
  settingsRoutes
);


// Notifications
app.use(
  "/api/notifications",
  notificationRoutes
);


// ==========================================
// Export App
// ==========================================

module.exports = app;