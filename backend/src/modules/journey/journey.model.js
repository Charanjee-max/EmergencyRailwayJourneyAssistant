const mongoose = require("mongoose");

// ==========================================
// Allowed Class Schema
// ==========================================

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

// ==========================================
// Journey Schema
// ==========================================

const journeySchema = new mongoose.Schema(
  {
    // ========================================
    // User
    // ========================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ========================================
    // Train Information
    // ========================================

    trainNumber: {
      type: String,
      required: true,
      trim: true,
    },

    journeyDate: {
      type: Date,
      required: true,
    },

    // ========================================
    // Journey Route
    // ========================================

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

    // ========================================
    // Allowed Classes
    // ========================================

    allowedClasses: {
      type: [allowedClassSchema],
      required: true,
    },

    // ========================================
    // Mixed Class
    // ========================================

    allowMixedClass: {
      type: Boolean,
      default: false,
    },

    // ========================================
    // Preferred Strategy
    // ========================================

    preferredStrategy: {
      type: String,

      enum: [
        "SINGLE_TICKET",
        "FEWER_TICKET_CHANGES",
      ],

      default: "SINGLE_TICKET",
    },

    // ========================================
    // Journey Status
    // ========================================

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
      index: true,
    },

    // ========================================
    // Completion Information
    // ========================================

    completedAt: {
      type: Date,
      default: null,
    },

    completedReason: {
      type: String,
      default: "",
      trim: true,
    },

    finalStationCode: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
    },

    finalStationName: {
      type: String,
      default: "",
      trim: true,
    },

    // ========================================
    // Monitoring Job
    // ========================================

    monitoringJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MonitoringJob",
      default: null,
    },

    // ========================================
    // Last Seat Status
    // ========================================

    lastSeatStatus: {
      type: String,
      default: null,
    },

    // ========================================
    // Last Available Seats
    // ========================================

    lastAvailableSeats: {
      type: Number,
      default: null,
    },

    // ========================================
    // Last Monitoring Time
    // ========================================

    lastCheckedAt: {
      type: Date,
      default: null,
    },
  },

  // ========================================
  // Schema Options
  // ========================================

  {
    timestamps: true,
  }
);

// ==========================================
// Indexes
// ==========================================

journeySchema.index({
  userId: 1,
  status: 1,
});

journeySchema.index({
  trainNumber: 1,
  journeyDate: 1,
});

module.exports = mongoose.model(
  "Journey",
  journeySchema
);