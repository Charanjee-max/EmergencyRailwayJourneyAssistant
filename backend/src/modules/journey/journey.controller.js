"use strict";

const {
    createJourney,
    getUserJourneys,
    getJourneyHistory,
    getJourneyById,
    deleteJourney,
} = require("./journey.service");

const {
    createJourneyValidation,
    journeyIdValidation,
} = require("./journey.validation");

const workflowManager =
    require("../../workflows/workflowManager");

// =========================================================
// CREATE JOURNEY
// =========================================================

const create = async (req, res) => {
    try {
        // -------------------------------------------------
        // Validate request
        // -------------------------------------------------

        const validation =
            createJourneyValidation(req.body);

        if (validation.error) {
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors:
                    validation.error.details.map(
                        (err) => ({
                            field:
                                err.path.join("."),
                            message:
                                err.message,
                        })
                    ),
            });
        }

        // IMPORTANT:
        // Use Joi-validated data, NOT req.body.
        const journey =
            await createJourney(
                validation.value,
                req.user.id
            );

        return res.status(201).json({
            success: true,
            message:
                "Journey request created successfully.",
            data: journey,
        });

    } catch (err) {
        console.error(
            "\n❌ CREATE JOURNEY ERROR:",
            err.message
        );

        return res.status(
            err.statusCode || 500
        ).json({
            success: false,
            message:
                err.message ||
                "Unable to create journey.",
        });
    }
};

// =========================================================
// GET ACTIVE JOURNEYS
// =========================================================

const getAll = async (req, res) => {
    try {
        const journeys =
            await getUserJourneys(
                req.user.id
            );

        return res.status(200).json({
            success: true,
            message:
                "Active journeys fetched successfully.",
            data: journeys,
        });

    } catch (err) {
        console.error(
            "❌ GET JOURNEYS ERROR:",
            err.message
        );

        return res.status(
            err.statusCode || 500
        ).json({
            success: false,
            message:
                err.message ||
                "Unable to fetch journeys.",
        });
    }
};

// =========================================================
// GET JOURNEY HISTORY
// =========================================================

const getHistory = async (req, res) => {
    try {
        const journeys =
            await getJourneyHistory(
                req.user.id
            );

        return res.status(200).json({
            success: true,
            message:
                "Journey history fetched successfully.",
            data: journeys,
        });

    } catch (err) {
        console.error(
            "❌ GET JOURNEY HISTORY ERROR:",
            err.message
        );

        return res.status(
            err.statusCode || 500
        ).json({
            success: false,
            message:
                err.message ||
                "Unable to fetch journey history.",
        });
    }
};

// =========================================================
// GET JOURNEY BY ID
// =========================================================

const getById = async (req, res) => {
    try {
        const validation =
            journeyIdValidation(
                req.params.id
            );

        if (validation.error) {
            return res.status(400).json({
                success: false,
                message:
                    validation.error.message,
            });
        }

        const journey =
            await getJourneyById(
                validation.value,
                req.user.id
            );

        return res.status(200).json({
            success: true,
            message:
                "Journey request fetched successfully.",
            data: journey,
        });

    } catch (err) {
        console.error(
            "❌ GET JOURNEY ERROR:",
            err.message
        );

        return res.status(
            err.statusCode || 404
        ).json({
            success: false,
            message:
                err.message ||
                "Journey request not found.",
        });
    }
};

// =========================================================
// DELETE JOURNEY
// =========================================================

const remove = async (req, res) => {
    try {
        const validation =
            journeyIdValidation(
                req.params.id
            );

        if (validation.error) {
            return res.status(400).json({
                success: false,
                message:
                    validation.error.message,
            });
        }

        const journey =
            await deleteJourney(
                validation.value,
                req.user.id
            );

        return res.status(200).json({
            success: true,
            message:
                "Journey deleted successfully.",
            data: journey,
        });

    } catch (err) {
        console.error(
            "❌ DELETE JOURNEY ERROR:",
            err.message
        );

        return res.status(
            err.statusCode || 404
        ).json({
            success: false,
            message:
                err.message ||
                "Unable to delete journey.",
        });
    }
};

// =========================================================
// RUN WORKFLOW
// =========================================================

const runWorkflow = async (req, res) => {
    try {
        const validation =
            journeyIdValidation(
                req.params.id
            );

        if (validation.error) {
            return res.status(400).json({
                success: false,
                message:
                    validation.error.message,
            });
        }

        const result =
            await workflowManager.processJourneyById(
                validation.value,
                req.user.id
            );

        return res.status(200).json({
            success: true,
            message:
                "Journey workflow processed successfully.",
            data: result,
        });

    } catch (err) {
        console.error(
            "❌ WORKFLOW ERROR:",
            err.message
        );

        return res.status(
            err.statusCode || 500
        ).json({
            success: false,
            message:
                err.message ||
                "Unable to process journey workflow.",
        });
    }
};

// =========================================================
// EXPORT
// =========================================================

module.exports = {
    create,
    getAll,
    getHistory,
    getById,
    remove,
    runWorkflow,
};