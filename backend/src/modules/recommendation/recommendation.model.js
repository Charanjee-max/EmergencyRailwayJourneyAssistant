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

        maxlength: 10,
      },


      to: {
        type: String,

        required: true,

        trim: true,

        uppercase: true,

        maxlength: 10,
      },


      class: {
        type: String,

        required: true,

        trim: true,

        uppercase: true,

        enum: [
          "1A",
          "2A",
          "3A",
          "3E",
          "SL",
          "2S",
        ],
      },


      coach: {
        type: String,

        default: null,

        trim: true,

        maxlength: 20,
      },


      berth: {
        type: String,

        default: null,

        trim: true,

        maxlength: 30,
      },
    },

    {
      _id: false,

      strict: true,
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

        enum: [
          "1A",
          "2A",
          "3A",
          "3E",
          "SL",
          "2S",
        ],
      },


      count: {
        type: Number,

        required: true,

        min: 0,

        max: 100000,
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

        trim: true,

        maxlength: 500,
      },
    },

    {
      _id: false,

      strict: true,
    }
  );


// =========================================================
// RECOMMENDATION SCHEMA
// =========================================================

const recommendationSchema =
  new mongoose.Schema(
    {
      // =====================================================
      // JOURNEY
      // =====================================================

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


      // =====================================================
      // STRATEGY
      // =====================================================

      strategy: {
        type: String,

        required: true,

        trim: true,

        maxlength: 100,
      },


      // =====================================================
      // SCORE
      // =====================================================

      score: {
        type: Number,

        required: true,

        min: 0,

        max: 100,
      },


      // =====================================================
      // REASON
      // =====================================================

      reason: {
        type: String,

        default: "",

        trim: true,

        maxlength: 2000,
      },


      // =====================================================
      // TICKETS
      // =====================================================

      tickets: {
        type:
          [ticketSchema],

        default: [],
      },


      // =====================================================
      // VACANCIES BY CLASS
      // =====================================================

      vacancySummary: {
        type:
          [vacancySummarySchema],

        default: [],
      },


      // =====================================================
      // STATUS
      // =====================================================

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

      strict: true,

      strictQuery: true,
    }
  );


// =========================================================
// INDEXES
// =========================================================

recommendationSchema.index({
  journey: 1,
  status: 1,
});


// Newest recommendations first
recommendationSchema.index({
  journey: 1,
  createdAt: -1,
});


// =========================================================
// EXPORT
// =========================================================

module.exports =
  mongoose.model(
    "Recommendation",
    recommendationSchema
  );