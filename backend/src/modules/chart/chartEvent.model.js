const mongoose = require("mongoose");

const chartEventSchema = new mongoose.Schema(
  {
    journey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Journey",
      required: true,
      index: true,
    },

    trainNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    journeyDate: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    sequence: {
      type: Number,
      required: true,
    },

    chartType: {
      type: String,
      enum: [
        "FIRST",
        "INTERMEDIATE",
        "FINAL",
      ],
      required: true,
    },

    stationCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    stationName: {
      type: String,
      default: "",
      trim: true,
    },

    expectedAt: {
      type: Date,
      default: null,
    },

    checkedAt: {
      type: Date,
      default: null,
    },

    preparedAt: {
      type: Date,
      default: null,
    },

    prepared: {
      type: Boolean,
      default: false,
    },

    source: {
      type: String,
      default: "IRCTC",
      trim: true,
    },

    rawStatus: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

chartEventSchema.index({
  journey: 1,
  sequence: 1,
});

chartEventSchema.index({
  trainNumber: 1,
  journeyDate: 1,
  stationCode: 1,
});

module.exports = mongoose.model(
  "ChartEvent",
  chartEventSchema
);