const Joi = require("joi");

// ============================================================
// Common Train Number Validation
// ============================================================

const trainNumberSchema = Joi.string()
  .trim()
  .required()
  .messages({
    "string.empty": "Train number is required.",
    "any.required": "Train number is required.",
  });

// ============================================================
// Search Train Validation
// ============================================================

const searchTrainValidation = (data) => {
  const schema = Joi.object({
    trainNumber: trainNumberSchema,
  });

  return schema.validate(data);
};

// ============================================================
// Train Stops Validation
// ============================================================

const trainStopsValidation = (data) => {
  const schema = Joi.object({
    trainNumber: trainNumberSchema,
  });

  return schema.validate(data);
};

// ============================================================
// Check Train Stop Validation
// ============================================================

const checkTrainStopValidation = (data) => {
  const schema = Joi.object({
    trainNumber: trainNumberSchema,

    stationCode: Joi.string()
      .trim()
      .uppercase()
      .required()
      .messages({
        "string.empty": "Station code is required.",
        "any.required": "Station code is required.",
      }),
  });

  return schema.validate(data);
};

// ============================================================
// Stops Between Validation
// ============================================================

const stopsBetweenValidation = (data) => {
  const schema = Joi.object({
    trainNumber: trainNumberSchema,

    from: Joi.string()
      .trim()
      .uppercase()
      .required()
      .messages({
        "string.empty": "Departure station code is required.",
        "any.required": "Departure station code is required.",
      }),

    to: Joi.string()
      .trim()
      .uppercase()
      .required()
      .messages({
        "string.empty": "Destination station code is required.",
        "any.required": "Destination station code is required.",
      }),
  });

  return schema.validate(data);
};

module.exports = {
  searchTrainValidation,
  trainStopsValidation,
  checkTrainStopValidation,
  stopsBetweenValidation,
};