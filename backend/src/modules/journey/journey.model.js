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
            },

            destinationStation: {
                type: String,

                required: true,

                uppercase: true,

                trim: true,
            },

            // =====================================================
            // ALLOWED CLASSES
            // =====================================================

            allowedClasses: {
                type: [
                    allowedClassSchema,
                ],

                required: true,
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

                default: "PENDING",

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
        }
    );

// =========================================================
// INDEXES
// =========================================================

journeySchema.index({
    userId: 1,
    status: 1,
});

journeySchema.index({
    trainNumber: 1,
    journeyDate: 1,
});

// =========================================================
// EXPORT
// =========================================================

module.exports =
    mongoose.model(
        "Journey",
        journeySchema
    );