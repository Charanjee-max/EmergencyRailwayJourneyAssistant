const express = require("express");

const authenticate = require("../../middleware/auth.middleware");

const {
  create,
  getAll,
  getById,
  runWorkflow,
} = require("./journey.controller");

const router = express.Router();


// Create Journey
router.post(
  "/",
  authenticate,
  create
);


// Get All Journeys
router.get(
  "/",
  authenticate,
  getAll
);


// =========================================================
// MANUAL WORKFLOW TEST
// =========================================================

router.post(
  "/:id/run-workflow",
  authenticate,
  runWorkflow
);


// Get Journey By ID
router.get(
  "/:id",
  authenticate,
  getById
);


module.exports = router;