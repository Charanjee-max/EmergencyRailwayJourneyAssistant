const Joi = require("joi");
const mongoose = require("mongoose");

// =========================================================
// COMMON CONSTANTS
// =========================================================

const TRAIN_CLASSES = [
    "1A",
    "2A",
    "3A",
    "3E",
    "SL",
    "2S",
];

const STRATEGIES = [
    "SINGLE_TICKET",
    "FEWER_TICKET_CHANGES",
];


// =========================================================
// CREATE JOURNEY SCHEMA
// =========================================================

const createJourneySchema = Joi.object({

    // =====================================================
    // TRAIN NUMBER
    // =====================================================

    trainNumber: Joi.string()
        .trim()
        .pattern(/^\d{4,5}$/)
        .required()
        .messages({

            "string.empty":
                "Train number is required.",

            "string.pattern.base":
                "Train number must contain 4 or 5 digits.",

            "any.required":
                "Train number is required.",

        }),


    // =====================================================
    // JOURNEY DATE
    // =====================================================

    journeyDate: Joi.date()
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

    boardingStation: Joi.string()
        .trim()
        .uppercase()
        .pattern(/^[A-Z0-9]{2,10}$/)
        .required()
        .messages({

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

    destinationStation: Joi.string()
        .trim()
        .uppercase()
        .pattern(/^[A-Z0-9]{2,10}$/)
        .required()
        .messages({

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

    allowedClasses: Joi.array()
        .items(

            Joi.object({

                class: Joi.string()
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
                .unknown(false)

        )
        .min(1)
        .max(TRAIN_CLASSES.length)
        .required()
        .messages({

            "array.base":
                "Allowed classes must be an array.",

            "array.min":
                "Select at least one class.",

            "array.max":
                "Too many classes selected.",

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
            .valid(...STRATEGIES)
            .default("SINGLE_TICKET")
            .messages({

                "any.only":
                    "Invalid journey strategy.",

            }),

})
    // IMPORTANT:
    // Reject fields such as:
    // role, userId, status, admin, etc.
    .unknown(false);


// =========================================================
// CREATE JOURNEY VALIDATION
// =========================================================

const createJourneyValidation = (data) => {

    return createJourneySchema.validate(
        data,
        {
            abortEarly: false,
            allowUnknown: false,
            stripUnknown: false,
        }
    );

};


// =========================================================
// MONGODB OBJECT ID VALIDATION
// =========================================================

const isValidObjectId = (id) => {

    return mongoose.isValidObjectId(id);

};


// =========================================================
// JOURNEY ID VALIDATION
// =========================================================

const journeyIdValidation = (id) => {

    if (!id || !isValidObjectId(id)) {

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
    createJourneyValidation,
    journeyIdValidation,
};