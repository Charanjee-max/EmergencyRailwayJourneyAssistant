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

const {
    journeyIdValidation,
} =
    require("./journey.validation");


const router =
    express.Router();


// =========================================================
// JOURNEY ID VALIDATION MIDDLEWARE
// =========================================================

const validateJourneyId =
    (req, res, next) => {

        const result =
            journeyIdValidation(
                req.params.id
            );


        if (result.error) {

            return res
                .status(400)
                .json({

                    success: false,

                    message:
                        result.error.message,

                });

        }


        next();

    };


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
// IMPORTANT: BEFORE /:id
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
    validateJourneyId,
    runWorkflow
);


// =========================================================
// DELETE JOURNEY
// =========================================================

router.delete(
    "/:id",
    authenticate,
    validateJourneyId,
    remove
);


// =========================================================
// GET JOURNEY BY ID
// =========================================================

router.get(
    "/:id",
    authenticate,
    validateJourneyId,
    getById
);


// =========================================================
// EXPORT
// =========================================================

module.exports =
    router;