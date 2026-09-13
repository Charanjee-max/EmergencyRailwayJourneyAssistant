"use strict";

const express = require("express");

const authenticate = require("../../middleware/auth.middleware");

const {
    getTrainClasses,
} = require("./chartClass.controller");

// ---------------------------------------------------------
// Router
// ---------------------------------------------------------

const router = express.Router();

// ---------------------------------------------------------
// GET TRAIN CLASSES
//
// GET /api/chart/classes
//
// Query:
// trainNumber
// journeyDate
// boardingStation
//
// Authentication required.
// ---------------------------------------------------------

router.get(
    "/classes",
    authenticate,
    getTrainClasses
);

module.exports = router;