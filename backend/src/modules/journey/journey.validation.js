const Joi = require("joi");

// =========================================================
// CREATE JOURNEY VALIDATION
// =========================================================
//
// IMPORTANT:
//
// Do NOT use:
//
// journeyDate: Joi.date().greater("now")
//
// because that rejects today's calendar date.
//
// Example:
//
// Today = 2026-09-07
//
// 2026-09-07 23:45 train
//
// should be allowed at 16:00.
//
// The actual "has the train already departed today?"
// check is handled in journey.service.js.
//
// =========================================================

const createJourneyValidation = (data) => {
  const schema = Joi.object({

    // =====================================================
    // TRAIN NUMBER
    // =====================================================

    trainNumber: Joi.string()
      .trim()
      .required()
      .messages({
        "string.empty":
          "Train number is required.",

        "any.required":
          "Train number is required.",
      }),


    // =====================================================
    // JOURNEY DATE
    // =====================================================
    //
    // Only validate that it is a valid date here.
    //
    // Past/today/future business rules are handled by
    // journey.service.js.
    //
    // =====================================================

    journeyDate: Joi.date()
      .required()
      .messages({

        "date.base":
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
      .required()
      .messages({

        "string.empty":
          "Boarding station is required.",

        "any.required":
          "Boarding station is required.",
      }),


    // =====================================================
    // DESTINATION STATION
    // =====================================================

    destinationStation: Joi.string()
      .trim()
      .uppercase()
      .required()
      .messages({

        "string.empty":
          "Destination station is required.",

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
            .valid(
              "1A",
              "2A",
              "3A",
              "3E",
              "SL",
              "2S"
            )
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

              "any.required":
                "Class enabled status is required.",
            }),

        })

      )
      .min(1)
      .required()
      .messages({

        "array.min":
          "Select at least one class.",

        "any.required":
          "Allowed classes are required.",
      }),


    // =====================================================
    // MIXED CLASS
    // =====================================================

    allowMixedClass:
      Joi.boolean()
        .default(false),


    // =====================================================
    // STRATEGY
    // =====================================================

    preferredStrategy:
      Joi.string()
        .valid(
          "SINGLE_TICKET",
          "FEWER_TICKET_CHANGES"
        )
        .default("SINGLE_TICKET"),

  });


  return schema.validate(
    data,
    {
      abortEarly: false,
    }
  );
};


// =========================================================
// EXPORT
// =========================================================

module.exports = {
  createJourneyValidation,
};