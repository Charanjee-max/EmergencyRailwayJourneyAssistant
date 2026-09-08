const express =
  require("express");

const authenticate =
  require("../../middleware/auth.middleware");

const {
  create,
  getAll,
  getHistory,
  getById,
  runWorkflow,
  remove,
} =
  require("./journey.controller");

const router =
  express.Router();

// =========================================================
// CREATE JOURNEY
// =========================================================

router.post(
  "/",
  authenticate,
  create
);

// =========================================================
// GET ACTIVE JOURNEYS
// =========================================================

router.get(
  "/",
  authenticate,
  getAll
);

// =========================================================
// GET JOURNEY HISTORY
// IMPORTANT: MUST COME BEFORE /:id
// =========================================================

router.get(
  "/history",
  authenticate,
  getHistory
);

// =========================================================
// MANUAL WORKFLOW
// =========================================================

router.post(
  "/:id/run-workflow",
  authenticate,
  runWorkflow
);

// =========================================================
// DELETE JOURNEY
// =========================================================

router.delete(
  "/:id",
  authenticate,
  remove
);

// =========================================================
// GET JOURNEY BY ID
// =========================================================

router.get(
  "/:id",
  authenticate,
  getById
);

module.exports =
  router;