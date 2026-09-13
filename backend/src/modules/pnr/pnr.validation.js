const Joi = require("joi");
const mongoose = require("mongoose");

const checkPNRValidation = Joi.object({
    pnr: Joi.string()
        .trim()
        .pattern(/^\d{10}$/)
        .required()
        .messages({
            "string.empty": "PNR is required.",
            "string.pattern.base":
                "PNR must contain exactly 10 digits.",
            "any.required": "PNR is required.",
        }),

    journeyId: Joi.string()
        .trim()
        .custom((value, helpers) => {
            if (!mongoose.isValidObjectId(value)) {
                return helpers.error("any.invalid");
            }

            return value;
        })
        .allow(null, "")
        .optional()
        .messages({
            "any.invalid": "Invalid journey ID.",
        }),
}).unknown(false);

const pnrIdValidation = (id) => {
    if (!id || !mongoose.isValidObjectId(id)) {
        return {
            error: {
                message: "Invalid PNR ID.",
            },
        };
    }

    return {
        value: id,
    };
};

module.exports = {
    checkPNRValidation,
    pnrIdValidation,
};