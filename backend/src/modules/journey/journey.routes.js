const express = require("express");

const authenticate = require("../../middleware/auth.middleware");

const {
  create,
  getAll,
  getById,
} = require("./journey.controller");

const router = express.Router();

// Create Journey Request
router.post("/", authenticate, create);

// Get All Journey Requests
router.get("/", authenticate, getAll);

// Get Journey By ID
router.get("/:id", authenticate, getById);

module.exports = router;