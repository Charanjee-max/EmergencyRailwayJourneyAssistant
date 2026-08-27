const express = require("express");

const router = express.Router();

const recommendationController = require("./recommendation.controller");

router.get(
    "/:journeyId",
    recommendationController.getRecommendations
);

module.exports = router;