"use strict";

const mongoose = require("mongoose");

// =========================================================
// COMMON CONSTANTS
// =========================================================

const TRAIN_CLASSES = [
    "1A",
    "2A",
    "3A",
    "3E",
    "SL",
    "2S",
    "CC",
    "EC",
];

const JOURNEY_STRATEGIES = [
    "BEST_AVAILABLE",
    "SINGLE_TICKET",
    "FEWER_TICKET_CHANGES",
];

const JOURNEY_STATUSES = [
    "PENDING",
    "MONITORING",
    "CHART_PREPARED",
    "RECOMMENDATION_READY",
    "COMPLETED",
    "CANCELLED",
];

// =========================================================
// ALLOWED CLASS SCHEMA
// =========================================================

const allowedClassSchema =
    new mongoose.Schema(
        {
            class: {
                type: String,

                trim: true,

                uppercase: true,

                enum: {
                    values: TRAIN_CLASSES,

                    message:
                        "Invalid travel class.",
                },

                required: true,
            },

            enabled: {
                type: Boolean,

                default: false,

                required: true,
            },
        },

        {
            /*
             * No separate _id is required for
             * the small embedded class objects.
             */
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
            // =================================================
            // USER
            // =================================================

            userId: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "User",

                required: true,

                index: true,
            },

            // =================================================
            // TRAIN INFORMATION
            // =================================================

            trainNumber: {
                type: String,

                required: true,

                trim: true,

                match: [
                    /^\d{4,5}$/,

                    "Invalid train number.",
                ],

                maxlength: 5,
            },

            // =================================================
            // JOURNEY DATE
            // =================================================

            journeyDate: {
                type: Date,

                required: true,

                /*
                 * Prevent obviously invalid dates.
                 */
                validate: {
                    validator: (value) =>
                        value instanceof Date &&
                        !Number.isNaN(
                            value.getTime()
                        ),

                    message:
                        "Invalid journey date.",
                },
            },

            // =================================================
            // JOURNEY ROUTE
            // =================================================

            boardingStation: {
                type: String,

                required: true,

                uppercase: true,

                trim: true,

                maxlength: 10,

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

                maxlength: 10,

                match: [
                    /^[A-Z0-9]{2,10}$/,

                    "Invalid destination station code.",
                ],
            },

            // =================================================
            // ALLOWED CLASSES
            // =================================================

            allowedClasses: {
                type: [
                    allowedClassSchema,
                ],

                required: true,

                validate: [
                    {
                        validator:
                            function (value) {
                                return (
                                    Array.isArray(
                                        value
                                    ) &&
                                    value.length > 0
                                );
                            },

                        message:
                            "At least one travel class is required.",
                    },

                    {
                        /*
                         * Prevent duplicate classes at
                         * database level too.
                         */
                        validator:
                            function (value) {
                                if (
                                    !Array.isArray(
                                        value
                                    )
                                ) {
                                    return false;
                                }

                                const classes =
                                    value.map(
                                        (item) =>
                                            String(
                                                item.class ||
                                                    ""
                                            )
                                                .trim()
                                                .toUpperCase()
                                    );

                                return (
                                    new Set(
                                        classes
                                    ).size ===
                                    classes.length
                                );
                            },

                        message:
                            "Duplicate travel classes are not allowed.",
                    },

                    {
                        validator:
                            function (value) {
                                return (
                                    Array.isArray(
                                        value
                                    ) &&
                                    value.length <=
                                        TRAIN_CLASSES.length
                                );
                            },

                        message:
                            "Too many travel classes selected.",
                    },
                ],
            },

            // =================================================
            // MIXED CLASS
            // =================================================

            allowMixedClass: {
                type: Boolean,

                default: false,
            },

            // =================================================
            // PREFERRED STRATEGY
            // =================================================

            preferredStrategy: {
                type: String,

                enum: {
                    values:
                        JOURNEY_STRATEGIES,

                    message:
                        "Invalid journey strategy.",
                },

                default:
                    "BEST_AVAILABLE",

                trim: true,

                uppercase: true,
            },

            // =================================================
            // JOURNEY STATUS
            // =================================================

            status: {
                type: String,

                enum: {
                    values:
                        JOURNEY_STATUSES,

                    message:
                        "Invalid journey status.",
                },

                default:
                    "PENDING",

                index: true,
            },

            // =================================================
            // COMPLETION INFORMATION
            // =================================================

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

                match:
                    /^[A-Z0-9]{0,10}$/,
            },

            finalStationName: {
                type: String,

                default: "",

                trim: true,

                maxlength: 150,
            },

            // =================================================
            // MONITORING JOB
            // =================================================

            monitoringJobId: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "MonitoringJob",

                default: null,
            },

            // =================================================
            // LAST MONITORING TIME
            // =================================================

            lastCheckedAt: {
                type: Date,

                default: null,

                index: true,
            },
        },

        {
            timestamps: true,

            /*
             * Reject unknown fields.
             */
            strict: true,

            /*
             * Reject unknown query fields.
             */
            strictQuery: true,
        }
    );

// =========================================================
// DATABASE INDEXES
// =========================================================

/*
 * User journey status queries.
 */
journeySchema.index({
    userId: 1,
    status: 1,
});

/*
 * Train/date queries.
 */
journeySchema.index({
    trainNumber: 1,
    journeyDate: 1,
});

/*
 * User journey history sorted by date.
 */
journeySchema.index({
    userId: 1,
    journeyDate: -1,
});

/*
 * Monitoring worker.
 */
journeySchema.index({
    status: 1,
    lastCheckedAt: 1,
});

/*
 * User + latest updates.
 */
journeySchema.index({
    userId: 1,
    updatedAt: -1,
});

// =========================================================
// MODEL EXPORT
// =========================================================

module.exports =
    mongoose.model(
        "Journey",
        journeySchema
    );