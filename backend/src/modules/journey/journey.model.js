const mongoose = require("mongoose");


// =========================================================
// ALLOWED CLASS SCHEMA
// =========================================================

const allowedClassSchema =
  new mongoose.Schema(
    {
      class: {
        type: String,

        enum: [
          "1A",
          "2A",
          "3A",
          "3E",
          "SL",
          "2S",
        ],

        required: true,
      },

      enabled: {
        type: Boolean,
        default: false,
      },
    },

    {
      _id: false,
      strict: true,
    }
  );


// =========================================================
// JOURNEY SCHEMA
// =========================================================

const journeySchema =
  new mongoose.Schema(
    {
      // =====================================================
      // USER
      // =====================================================

      userId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,

        index: true,
      },


      // =====================================================
      // TRAIN INFORMATION
      // =====================================================

      trainNumber: {
        type: String,

        required: true,

        trim: true,

        match: [
          /^\d{4,5}$/,
          "Invalid train number.",
        ],
      },


      journeyDate: {
        type: Date,

        required: true,
      },


      // =====================================================
      // JOURNEY ROUTE
      // =====================================================

      boardingStation: {
        type: String,

        required: true,

        uppercase: true,

        trim: true,

        match: [
          /^[A-Z0-9]{2,10}$/,
          "Invalid boarding station code.",
        ],
      },


      destinationStation: {
        type: String,

        required: true,

        uppercase: true,

        trim: true,

        match: [
          /^[A-Z0-9]{2,10}$/,
          "Invalid destination station code.",
        ],
      },


      // =====================================================
      // ALLOWED CLASSES
      // =====================================================

      allowedClasses: {
        type: [
          allowedClassSchema,
        ],

        required: true,

        validate: {
          validator: function (value) {
            return (
              Array.isArray(value) &&
              value.length > 0
            );
          },

          message:
            "At least one travel class is required.",
        },
      },


      // =====================================================
      // MIXED CLASS
      // =====================================================

      allowMixedClass: {
        type: Boolean,

        default: false,
      },


      // =====================================================
      // PREFERRED STRATEGY
      // =====================================================

      preferredStrategy: {
        type: String,

        enum: [
          "SINGLE_TICKET",
          "FEWER_TICKET_CHANGES",
        ],

        default:
          "SINGLE_TICKET",
      },


      // =====================================================
      // JOURNEY STATUS
      // =====================================================

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

        default:
          "PENDING",

        index: true,
      },


      // =====================================================
      // COMPLETION INFORMATION
      // =====================================================

      completedAt: {
        type: Date,

        default: null,
      },


      completedReason: {
        type: String,

        default: "",

        trim: true,

        maxlength: 500,
      },


      finalStationCode: {
        type: String,

        default: "",

        uppercase: true,

        trim: true,

        maxlength: 10,
      },


      finalStationName: {
        type: String,

        default: "",

        trim: true,

        maxlength: 150,
      },


      // =====================================================
      // MONITORING JOB
      // =====================================================

      monitoringJobId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "MonitoringJob",

        default: null,
      },


      // =====================================================
      // LAST MONITORING TIME
      // =====================================================

      lastCheckedAt: {
        type: Date,

        default: null,
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

// User journey queries
journeySchema.index({
  userId: 1,
  status: 1,
});


// Train/date queries
journeySchema.index({
  trainNumber: 1,
  journeyDate: 1,
});


// User + date
journeySchema.index({
  userId: 1,
  journeyDate: -1,
});


// Monitoring queries
journeySchema.index({
  status: 1,
  lastCheckedAt: 1,
});


// =========================================================
// EXPORT
// =========================================================

module.exports =
  mongoose.model(
    "Journey",
    journeySchema
  );