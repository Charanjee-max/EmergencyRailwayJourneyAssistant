const express = require("express");
const authenticate = require("../../middleware/auth.middleware");
const {
  searchTrain,
} = require("./train.controller");

const router = express.Router();

// Search Train
router.get("/search", authenticate, searchTrain);

module.exports = router;