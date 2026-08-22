const Joi = require("joi");

const createJourneyValidation = (data) => {
  const schema = Joi.object({
    trainNumber: Joi.string()
      .trim()
      .required()
      .messages({
        "string.empty": "Train number is required.",
        "any.required": "Train number is required."
      }),

    journeyDate: Joi.date()
      .greater("now")
      .required()
      .messages({
        "date.base": "Journey date must be a valid date.",
        "date.greater": "Journey date must be a future date.",
        "any.required": "Journey date is required."
      }),

    boardingStation: Joi.string()
      .trim()
      .uppercase()
      .required()
      .messages({
        "string.empty": "Boarding station is required.",
        "any.required": "Boarding station is required."
      }),

    destinationStation: Joi.string()
      .trim()
      .uppercase()
      .required()
      .invalid(Joi.ref("boardingStation"))
      .messages({
        "string.empty": "Destination station is required.",
        "any.required": "Destination station is required.",
        "any.invalid": "Boarding and destination stations cannot be the same."
      }),

    allowedClasses: Joi.array()
      .items(
        Joi.object({
          class: Joi.string()
            .valid("1A", "2A", "3A", "3E", "SL")
            .required(),

          enabled: Joi.boolean().required()
        })
      )
      .min(1)
      .required()
      .messages({
        "array.min": "Select at least one class.",
        "any.required": "Allowed classes are required."
      }),

    allowMixedClass: Joi.boolean().default(false),

    preferredStrategy: Joi.string()
      .valid("SINGLE_TICKET", "FEWER_TICKET_CHANGES")
      .default("SINGLE_TICKET")
  });

  return schema.validate(data, {
    abortEarly: false
  });
};

module.exports = {
  createJourneyValidation
};