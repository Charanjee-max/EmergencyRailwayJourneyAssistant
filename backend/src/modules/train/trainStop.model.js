const mongoose = require("mongoose");

const trainStopSchema = new mongoose.Schema(
  {
    trainNumber: {
      type: String,
      required: true,
      trim: true,
    },

    no: {
      type: String,
      default: "",
    },

    track: {
      type: String,
      default: "",
    },

    code: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    station: {
      type: String,
      required: true,
      trim: true,
    },

    xo: {
      type: String,
      default: "",
    },

    note: {
      type: String,
      default: "",
    },

    arrival: {
      type: String,
      default: "",
    },

    arrivalAvg: {
      type: String,
      default: "",
    },

    departure: {
      type: String,
      default: "",
    },

    departureAvg: {
      type: String,
      default: "",
    },

    halt: {
      type: String,
      default: "",
    },

    pf: {
      type: String,
      default: "",
    },

    day: {
      type: String,
      default: "",
    },

    km: {
      type: String,
      default: "",
    },

    speed: {
      type: String,
      default: "",
    },

    elevation: {
      type: String,
      default: "",
    },

    zone: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "trainStops",
  }
);

// ============================================================
// INDEXES
// ============================================================

// Fast lookup by train + station
trainStopSchema.index({
  trainNumber: 1,
  code: 1,
});

module.exports = mongoose.model("TrainStop", trainStopSchema);