const mongoose = require("mongoose");

const allowedClassSchema = new mongoose.Schema(
  {
    class: {
      type: String,
      enum: ["1A", "2A", "3A", "3E", "SL"],
      required: true,
    },

    enabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

const journeySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    trainNumber: {
      type: String,
      required: true,
      trim: true,
    },

    journeyDate: {
      type: Date,
      required: true,
    },

    boardingStation: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    destinationStation: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    allowedClasses: {
      type: [allowedClassSchema],
      required: true,
    },

    allowMixedClass: {
      type: Boolean,
      default: false,
    },

    preferredStrategy: {
      type: String,
      enum: ["SINGLE_TICKET", "FEWER_TICKET_CHANGES"],
      default: "SINGLE_TICKET",
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "MONITORING",
        "CHART_PREPARED",
        "RECOMMENDATION_READY",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "PENDING",
    },

    monitoringJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MonitoringJob",
      default: null,
    },

    // Last monitored seat status
    lastSeatStatus: {
      type: String,
      default: null,
    },

    // Last available seats count
    lastAvailableSeats: {
      type: Number,
      default: null,
    },

    // Last monitoring time
    lastCheckedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Journey = mongoose.model("Journey", journeySchema);

module.exports = Journey;