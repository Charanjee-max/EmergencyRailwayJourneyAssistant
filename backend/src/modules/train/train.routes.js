const express = require("express");
const authenticate = require("../../middleware/auth.middleware");

const {
  searchTrain,
  getLiveTrainStatus,
  getSeatAvailability,
  getTrainStops,
  checkTrainStop,
  getStopsBetween,
} = require("./train.controller");

const router = express.Router();

// ============================================================
// Search Train
// ============================================================

router.get(
  "/search",
  authenticate,
  searchTrain
);

// ============================================================
// Live Train Running Status
// ============================================================

router.get(
  "/live",
  authenticate,
  getLiveTrainStatus
);

// ============================================================
// Seat Availability Forecast
// ============================================================

router.get(
  "/seats",
  authenticate,
  getSeatAvailability
);

// ============================================================
// Complete Train Timetable
// ============================================================

router.get(
  "/stops",
  authenticate,
  getTrainStops
);

// ============================================================
// Check Whether Train Stops at Station
// ============================================================

router.get(
  "/check-stop",
  authenticate,
  checkTrainStop
);

// ============================================================
// Get Stops Between Two Stations
// ============================================================

router.get(
  "/stops-between",
  authenticate,
  getStopsBetween
);

module.exports = router;