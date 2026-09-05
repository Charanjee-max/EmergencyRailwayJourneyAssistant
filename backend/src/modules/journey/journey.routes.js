const express = require("express");

const authenticate = require("../../middleware/auth.middleware");

const {
  create,
  getAll,
  getById,
  runWorkflow,
} = require("./journey.controller");

const router = express.Router();

// =========================================================
// CREATE JOURNEY
// =========================================================

router.post(
  "/",
  authenticate,
  create
);

// =========================================================
// GET ALL JOURNEYS
// =========================================================

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

// =========================================================
// GET JOURNEY BY ID
// =========================================================

router.get(
  "/:id",
  authenticate,
  getById
);

// =========================================================
// EXPORT ROUTER
// =========================================================

module.exports = router;