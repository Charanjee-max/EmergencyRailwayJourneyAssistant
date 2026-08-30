const express = require("express");

const router = express.Router();

const recommendationController = require("./recommendation.controller");
const authenticate = require("../../middleware/auth.middleware");

router.get(
    "/:journeyId",
    authenticate,
    recommendationController.getRecommendations
);

module.exports = router;