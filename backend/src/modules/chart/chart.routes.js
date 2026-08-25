const express = require("express");

const router = express.Router();

const chartController = require("./chart.controller");

/**
 * ==========================================
 * Train Composition
 * ==========================================
 */
router.post("/test", chartController.testChart);

/**
 * ==========================================
 * Vacant Berth
 * ==========================================
 */
router.post("/vacant-berth", chartController.fetchVacantBerth);

module.exports = router;