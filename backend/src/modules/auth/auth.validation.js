const Joi = require("joi");


// =========================================================
// REGISTER VALIDATION
// =========================================================

const registerSchema =
  Joi.object({

    // -------------------------------------------------------
    // Full Name
    // -------------------------------------------------------

    fullName:
      Joi.string()
        .trim()
        .min(3)
        .max(100)
        .required()
        .messages({

          "string.empty":
            "Full name is required.",

          "string.min":
            "Full name must be at least 3 characters.",

          "string.max":
            "Full name cannot exceed 100 characters.",

          "any.required":
            "Full name is required.",

        }),


    // -------------------------------------------------------
    // Email
    // -------------------------------------------------------

    email:
      Joi.string()
        .trim()
        .lowercase()
        .email({
          tlds: {
            allow: false,
          },
        })
        .max(254)
        .required()
        .messages({

          "string.empty":
            "Email is required.",

          "string.email":
            "Enter a valid email address.",

          "string.max":
            "Email is too long.",

          "any.required":
            "Email is required.",

        }),


    // -------------------------------------------------------
    // Password
    // -------------------------------------------------------

    password:
      Joi.string()
        .min(6)
        .max(128)
        .required()
        .messages({

          "string.empty":
            "Password is required.",

          "string.min":
            "Password must be at least 6 characters.",

          "string.max":
            "Password cannot exceed 128 characters.",

          "any.required":
            "Password is required.",

        }),

  })
    .unknown(false);


// =========================================================
// LOGIN VALIDATION
// =========================================================

const loginSchema =
  Joi.object({

    // -------------------------------------------------------
    // Email
    // -------------------------------------------------------

    email:
      Joi.string()
        .trim()
        .lowercase()
        .email({
          tlds: {
            allow: false,
          },
        })
        .max(254)
        .required()
        .messages({

          "string.empty":
            "Email is required.",

          "string.email":
            "Enter a valid email address.",

          "string.max":
            "Email is too long.",

          "any.required":
            "Email is required.",

        }),


    // -------------------------------------------------------
    // Password
    // -------------------------------------------------------

    password:
      Joi.string()
        .max(128)
        .required()
        .messages({

          "string.empty":
            "Password is required.",

          "string.max":
            "Password cannot exceed 128 characters.",

          "any.required":
            "Password is required.",

        }),

  })
    .unknown(false);


// =========================================================
// REGISTER VALIDATION FUNCTION
// =========================================================

const registerValidation =
  (data) => {

    return registerSchema.validate(
      data,
      {
        abortEarly: false,

        allowUnknown: false,

        stripUnknown: false,
      }
    );

  };


// =========================================================
// LOGIN VALIDATION FUNCTION
// =========================================================

const loginValidation =
  (data) => {

    return loginSchema.validate(
      data,
      {
        abortEarly: false,

        allowUnknown: false,

        stripUnknown: false,
      }
    );

  };


// =========================================================
// EXPORT
// =========================================================

module.exports = {

  registerValidation,

  loginValidation,

};