const express = require("express");

const authenticate =
    require("../../middleware/auth.middleware");

const {
    searchStation,
} = require("./station.controller");

const router =
    express.Router();

router.get(
    "/autocomplete",
    authenticate,
    searchStation
);

module.exports = router;