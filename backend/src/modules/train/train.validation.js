const Joi = require("joi");

// ============================================================
// COMMON TRAIN NUMBER
// ============================================================

const trainNumberSchema = Joi.string()
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
    });


// ============================================================
// STATION CODE
// ============================================================

const stationCodeSchema = Joi.string()
    .trim()
    .uppercase()
    .pattern(/^[A-Z0-9]{2,10}$/)
    .required()
    .messages({
        "string.empty":
            "Station code is required.",

        "string.pattern.base":
            "Invalid station code.",

        "any.required":
            "Station code is required.",
    });


// ============================================================
// SEARCH TRAIN
// ============================================================

const searchTrainValidation = (data) => {

    const schema = Joi.object({

        trainNumber:
            trainNumberSchema,

    }).unknown(false);

    return schema.validate(data, {
        abortEarly: false,
        allowUnknown: false,
    });
};


// ============================================================
// LIVE TRAIN
// ============================================================

const liveTrainValidation = (data) => {

    const schema = Joi.object({

        trainNumber:
            trainNumberSchema,

    }).unknown(false);

    return schema.validate(data, {
        abortEarly: false,
        allowUnknown: false,
    });
};


// ============================================================
// TRAIN STOPS
// ============================================================

const trainStopsValidation = (data) => {

    const schema = Joi.object({

        trainNumber:
            trainNumberSchema,

    }).unknown(false);

    return schema.validate(data, {
        abortEarly: false,
        allowUnknown: false,
    });
};


// ============================================================
// CHECK TRAIN STOP
// ============================================================

const checkTrainStopValidation = (data) => {

    const schema = Joi.object({

        trainNumber:
            trainNumberSchema,

        stationCode:
            stationCodeSchema,

    }).unknown(false);

    return schema.validate(data, {
        abortEarly: false,
        allowUnknown: false,
    });
};


// ============================================================
// STOPS BETWEEN
// ============================================================

const stopsBetweenValidation = (data) => {

    const schema = Joi.object({

        trainNumber:
            trainNumberSchema,

        from:
            stationCodeSchema.messages({
                "string.empty":
                    "Departure station code is required.",

                "string.pattern.base":
                    "Invalid departure station code.",

                "any.required":
                    "Departure station code is required.",
            }),

        to:
            stationCodeSchema.messages({
                "string.empty":
                    "Destination station code is required.",

                "string.pattern.base":
                    "Invalid destination station code.",

                "any.required":
                    "Destination station code is required.",
            }),

    }).unknown(false);

    return schema.validate(data, {
        abortEarly: false,
        allowUnknown: false,
    });
};


// ============================================================
// SEAT AVAILABILITY
// ============================================================

const seatAvailabilityValidation = (data) => {

    const schema = Joi.object({

        trainNumber:
            trainNumberSchema,

        journeyDate:
            Joi.string()
                .trim()
                .pattern(/^\d{4}-\d{2}-\d{2}$/)
                .required()
                .messages({
                    "string.empty":
                        "Journey date is required.",

                    "string.pattern.base":
                        "Journey date must be in YYYY-MM-DD format.",

                    "any.required":
                        "Journey date is required.",
                }),

        source:
            stationCodeSchema,

        destination:
            stationCodeSchema,

        classCode:
            Joi.string()
                .trim()
                .uppercase()
                .valid(
                    "1A",
                    "2A",
                    "3A",
                    "3E",
                    "SL",
                    "2S",
                    "CC",
                    "EC"
                )
                .required()
                .messages({
                    "any.only":
                        "Invalid class code.",

                    "any.required":
                        "Class code is required.",
                }),

        quotaCode:
            Joi.string()
                .trim()
                .uppercase()
                .pattern(/^[A-Z0-9]{1,10}$/)
                .required()
                .messages({
                    "string.empty":
                        "Quota code is required.",

                    "string.pattern.base":
                        "Invalid quota code.",

                    "any.required":
                        "Quota code is required.",
                }),

    }).unknown(false);

    return schema.validate(data, {
        abortEarly: false,
        allowUnknown: false,
    });
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {

    searchTrainValidation,

    liveTrainValidation,

    trainStopsValidation,

    checkTrainStopValidation,

    stopsBetweenValidation,

    seatAvailabilityValidation,

};