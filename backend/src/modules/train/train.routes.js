const express = require("express");
const authenticate = require("../../middleware/auth.middleware");

const {
  searchTrain,
  getLiveTrainStatus,
} = require("./train.controller");

const router = express.Router();

// Search Train
router.get("/search", authenticate, searchTrain);

// Live Train Running Status
router.get("/live", authenticate, getLiveTrainStatus);

module.exports = router;