"use strict";

const Joi = require("joi");
const mongoose = require("mongoose");

// =========================================================
// CONSTANTS
// =========================================================

const TRAIN_CLASSES = [
    "1A",
    "2A",
    "3A",
    "3E",
    "SL",
    "2S",
    "CC",
    "EC",
];

const STRATEGIES = [
    "BEST_AVAILABLE",
    "SINGLE_TICKET",
    "FEWER_TICKET_CHANGES",
];

const TRAIN_NUMBER_PATTERN =
    /^\d{4,5}$/;

const STATION_CODE_PATTERN =
    /^[A-Z0-9]{2,10}$/;

// =========================================================
// TRAIN NUMBER
// =========================================================

const trainNumberSchema =
    Joi.string()
        .trim()
        .pattern(TRAIN_NUMBER_PATTERN)
        .required()
        .messages({
            "string.empty":
                "Train number is required.",

            "string.pattern.base":
                "Train number must contain 4 or 5 digits.",

            "any.required":
                "Train number is required.",
        });

// =========================================================
// STATION CODE
// =========================================================

const stationCodeSchema =
    Joi.string()
        .trim()
        .uppercase()
        .pattern(STATION_CODE_PATTERN)
        .required()
        .messages({
            "string.empty":
                "Station code is required.",

            "string.pattern.base":
                "Invalid station code.",

            "any.required":
                "Station code is required.",
        });

// =========================================================
// ALLOWED CLASS
// =========================================================

const allowedClassSchema =
    Joi.object({
        class: Joi.string()
            .trim()
            .uppercase()
            .valid(...TRAIN_CLASSES)
            .required()
            .messages({
                "any.only":
                    "Invalid train class.",

                "any.required":
                    "Train class is required.",
            }),

        enabled: Joi.boolean()
            .required()
            .messages({
                "boolean.base":
                    "Class enabled status must be true or false.",

                "any.required":
                    "Class enabled status is required.",
            }),
    })
        .unknown(false);

// =========================================================
// CREATE JOURNEY SCHEMA
// =========================================================

const createJourneySchema =
    Joi.object({

        // =====================================================
        // TRAIN NUMBER
        // =====================================================

        trainNumber:
            trainNumberSchema,

        // =====================================================
        // JOURNEY DATE
        // =====================================================

        /*
         * Only validate that the supplied value is a valid
         * date here.
         *
         * Do NOT use .greater("now").
         *
         * A train operating later today must still be allowed.
         * Actual departure/business rules belong in journey.service.js.
         */

        journeyDate:
            Joi.date()
                .iso()
                .required()
                .messages({
                    "date.base":
                        "Journey date must be a valid date.",

                    "date.format":
                        "Journey date must be a valid date.",

                    "any.required":
                        "Journey date is required.",
                }),

        // =====================================================
        // BOARDING STATION
        // =====================================================

        boardingStation:
            stationCodeSchema.messages({
                "string.empty":
                    "Boarding station is required.",

                "string.pattern.base":
                    "Invalid boarding station code.",

                "any.required":
                    "Boarding station is required.",
            }),

        // =====================================================
        // DESTINATION STATION
        // =====================================================

        destinationStation:
            stationCodeSchema.messages({
                "string.empty":
                    "Destination station is required.",

                "string.pattern.base":
                    "Invalid destination station code.",

                "any.required":
                    "Destination station is required.",
            }),

        // =====================================================
        // ALLOWED CLASSES
        // =====================================================

        allowedClasses:
            Joi.array()
                .items(
                    allowedClassSchema
                )
                .min(1)
                .max(TRAIN_CLASSES.length)
                .unique(
                    (a, b) =>
                        a.class === b.class
                )
                .required()
                .messages({
                    "array.base":
                        "Allowed classes must be an array.",

                    "array.min":
                        "Select at least one class.",

                    "array.max":
                        "Too many classes selected.",

                    "array.unique":
                        "The same train class cannot be selected more than once.",

                    "any.required":
                        "Allowed classes are required.",
                }),

        // =====================================================
        // MIXED CLASS
        // =====================================================

        allowMixedClass:
            Joi.boolean()
                .default(false)
                .messages({
                    "boolean.base":
                        "Mixed class option must be true or false.",
                }),

        // =====================================================
        // PREFERRED STRATEGY
        // =====================================================

        preferredStrategy:
            Joi.string()
                .trim()
                .uppercase()
                .valid(...STRATEGIES)
                .default(
                    "BEST_AVAILABLE"
                )
                .messages({
                    "any.only":
                        "Invalid journey strategy.",
                }),

    })
        /*
         * SECURITY:
         *
         * Reject anything that is not explicitly defined above.
         *
         * This prevents clients from injecting fields such as:
         *
         * userId
         * role
         * status
         * completedAt
         * monitoringJobId
         * admin
         */
        .unknown(false);

// =========================================================
// CREATE JOURNEY VALIDATION
// =========================================================

const createJourneyValidation = (
    data
) => {

    return createJourneySchema.validate(
        data,
        {
            /*
             * Return all validation errors at once.
             */
            abortEarly: false,

            /*
             * Reject unexpected fields.
             */
            allowUnknown: false,

            /*
             * Do not silently remove attacker-supplied
             * fields.
             */
            stripUnknown: false,

            /*
             * Allow Joi to normalize things such as
             * uppercase station codes.
             */
            convert: true,
        }
    );
};

// =========================================================
// OBJECT ID VALIDATION
// =========================================================

const isValidObjectId = (
    id
) => {

    return mongoose.isValidObjectId(
        id
    );
};

// =========================================================
// JOURNEY ID VALIDATION
// =========================================================

const journeyIdValidation = (
    id
) => {

    if (
        !id ||
        !isValidObjectId(id)
    ) {
        return {
            error: {
                message:
                    "Invalid journey ID.",
            },
        };
    }

    return {
        value: id,
    };
};

// =========================================================
// EXPORT
// =========================================================

module.exports = {
    TRAIN_CLASSES,
    STRATEGIES,

    createJourneyValidation,
    journeyIdValidation,
};