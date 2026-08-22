const Joi = require("joi");

const registerValidation = (data) => {
  const schema = Joi.object({
    fullName: Joi.string()
      .min(3)
      .max(100)
      .required()
      .messages({
        "string.empty": "Full name is required.",
        "string.min": "Full name must be at least 3 characters.",
        "string.max": "Full name cannot exceed 100 characters.",
        "any.required": "Full name is required."
      }),

    email: Joi.string()
      .email()
      .required()
      .messages({
        "string.empty": "Email is required.",
        "string.email": "Enter a valid email address.",
        "any.required": "Email is required."
      }),

    password: Joi.string()
      .min(6)
      .required()
      .messages({
        "string.empty": "Password is required.",
        "string.min": "Password must be at least 6 characters.",
        "any.required": "Password is required."
      })
  });

  return schema.validate(data, {
    abortEarly: false
  });
};

module.exports = {
  registerValidation
};