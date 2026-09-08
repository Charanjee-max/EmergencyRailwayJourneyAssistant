const Joi = require("joi");

const checkPNRValidation = Joi.object({
    pnr: Joi.string()
        .pattern(/^\d{10}$/)
        .required()
        .messages({
            "string.pattern.base": "PNR must contain exactly 10 digits.",
            "any.required": "PNR is required.",
        }),

    journeyId: Joi.string()
        .hex()
        .length(24)
        .allow(null, "")
        .optional(),
});

module.exports = {
    checkPNRValidation,
};