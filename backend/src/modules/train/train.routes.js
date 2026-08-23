const express = require("express");
const authenticate = require("../../middleware/auth.middleware");

const {
  searchTrain,
  getLiveTrainStatus,
  getSeatAvailability,
} = require("./train.controller");

const router = express.Router();

// Search Train
router.get("/search", authenticate, searchTrain);

// Live Train Running Status
router.get("/live", authenticate, getLiveTrainStatus);

// Seat Availability Forecast
router.get("/seats", authenticate, getSeatAvailability);

module.exports = router;