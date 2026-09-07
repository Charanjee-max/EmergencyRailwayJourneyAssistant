const mongoose =
    require("mongoose");

// =========================================================
// TICKET SCHEMA
// =========================================================

const ticketSchema =
    new mongoose.Schema(

        {

            from: {

                type: String,

                required: true,

                trim: true,

                uppercase: true,
            },

            to: {

                type: String,

                required: true,

                trim: true,

                uppercase: true,
            },

            class: {

                type: String,

                required: true,

                trim: true,

                uppercase: true,
            },

            coach: {

                type: String,

                default: null,

                trim: true,
            },

            berth: {

                type: String,

                default: null,

                trim: true,
            },
        },

        {
            _id: false,
        }
    );

// =========================================================
// VACANCY SUMMARY SCHEMA
// =========================================================

const vacancySummarySchema =
    new mongoose.Schema(

        {

            class: {

                type: String,

                required: true,

                trim: true,

                uppercase: true,
            },

            count: {

                type: Number,

                required: true,

                min: 0,
            },

            status: {

                type: String,

                enum: [
                    "AVAILABLE",
                    "ERROR",
                ],

                default:
                    "AVAILABLE",
            },

            error: {

                type: String,

                default: "",
            },
        },

        {
            _id: false,
        }
    );

// =========================================================
// RECOMMENDATION SCHEMA
// =========================================================

const recommendationSchema =
    new mongoose.Schema(

        {

            journey: {

                type:
                    mongoose.Schema
                        .Types
                        .ObjectId,

                ref:
                    "Journey",

                required: true,

                index: true,
            },

            strategy: {

                type: String,

                required: true,

                trim: true,
            },

            score: {

                type: Number,

                required: true,
            },

            reason: {

                type: String,

                default: "",

                trim: true,
            },

            tickets: {

                type:
                    [ticketSchema],

                default: [],
            },

            // =================================================
            // VACANCIES BY CLASS
            // =================================================

            vacancySummary: {

                type:
                    [vacancySummarySchema],

                default: [],
            },

            status: {

                type: String,

                enum: [
                    "ACTIVE",
                    "EXPIRED",
                ],

                default:
                    "ACTIVE",

                index: true,
            },
        },

        {
            timestamps: true,
        }
    );

// =========================================================
// INDEXES
// =========================================================

recommendationSchema.index({

    journey: 1,

    status: 1,
});

// =========================================================
// EXPORT
// =========================================================

module.exports =
    mongoose.model(
        "Recommendation",
        recommendationSchema
    );