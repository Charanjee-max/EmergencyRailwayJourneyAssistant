const express = require("express");

const router = express.Router();

const recommendationController =
    require("./recommendation.controller");

const authenticate =
    require("../../middleware/auth.middleware");

const {
    journeyIdValidation,
} = require("../journey/journey.validation");


// =========================================================
// JOURNEY ID VALIDATION
// =========================================================

const validateJourneyId =
    (req, res, next) => {

        const result =
            journeyIdValidation(
                req.params.journeyId
            );

        if (result.error) {

            return res
                .status(400)
                .json({
                    success: false,
                    message: "Invalid journey ID.",
                });

        }

        next();
    };


// =========================================================
// GET RECOMMENDATIONS
// =========================================================

router.get(
    "/:journeyId",
    authenticate,
    validateJourneyId,
    recommendationController.getRecommendations
);


module.exports = router;