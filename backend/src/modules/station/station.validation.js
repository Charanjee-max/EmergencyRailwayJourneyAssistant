const Joi = require("joi");

// ============================================================
// STATION AUTOCOMPLETE VALIDATION
// ============================================================

const searchStationValidation = (data) => {
    const schema = Joi.object({
        search: Joi.string()
            .trim()
            .min(2)
            .max(50)
            .required()
            .messages({
                "string.empty":
                    "Station search is required.",

                "string.min":
                    "Station search must contain at least 2 characters.",

                "string.max":
                    "Station search is too long.",

                "any.required":
                    "Station search is required.",
            }),
    }).unknown(false);

    return schema.validate(data, {
        abortEarly: false,
        allowUnknown: false,
    });
};

module.exports = {
    searchStationValidation,
};