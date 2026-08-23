const Joi = require("joi");

// Search Train Validation
const searchTrainValidation = (data) => {
  const schema = Joi.object({
    trainNumber: Joi.string()
      .trim()
      .required()
      .messages({
        "string.empty": "Train number is required.",
        "any.required": "Train number is required.",
      }),
  });

  return schema.validate(data);
};

module.exports = {
  searchTrainValidation,
};