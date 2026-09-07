const mongoose = require("mongoose");

// =========================================================
// TICKET SCHEMA
// =========================================================

const ticketSchema = new mongoose.Schema(
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
// RECOMMENDATION SCHEMA
// =========================================================

const recommendationSchema = new mongoose.Schema(
  {
    // =====================================================
    // JOURNEY REFERENCE
    // =====================================================

    journey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Journey",
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
    },


    // =====================================================
    // SCORE
    // =====================================================

    score: {
      type: Number,
      required: true,
    },


    // =====================================================
    // REASON
    // =====================================================

    reason: {
      type: String,
      default: "",
      trim: true,
    },


    // =====================================================
    // RECOMMENDED TICKETS
    // =====================================================

    tickets: {
      type: [ticketSchema],
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
      default: "ACTIVE",
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
//
// Useful when fetching active recommendations for a journey.
//
// =========================================================

recommendationSchema.index({
  journey: 1,
  status: 1,
});


// =========================================================
// MODEL
// =========================================================

module.exports =
  mongoose.model(
    "Recommendation",
    recommendationSchema
  );