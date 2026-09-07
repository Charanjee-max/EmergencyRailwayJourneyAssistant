const express =
  require("express");


const authenticate =
  require("../../middleware/auth.middleware");


const {
  create,
  getAll,
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
// GET ALL JOURNEYS
// =========================================================

router.get(
  "/",
  authenticate,
  getAll
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


// =========================================================
// EXPORT
// =========================================================

module.exports =
  router;