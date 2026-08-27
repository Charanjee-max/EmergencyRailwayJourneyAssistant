const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    from: {
      type: String,
      required: true,
    },

    to: {
      type: String,
      required: true,
    },

    class: {
      type: String,
      required: true,
    },

    coach: {
      type: String,
      default: null,
    },

    berth: {
      type: String,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const recommendationSchema = new mongoose.Schema(
  {
    journey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Journey",
      required: true,
    },

    strategy: {
      type: String,
      required: true,
    },

    score: {
      type: Number,
      required: true,
    },

    reason: {
      type: String,
      default: "",
    },

    tickets: [ticketSchema],

    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Recommendation",
  recommendationSchema
);