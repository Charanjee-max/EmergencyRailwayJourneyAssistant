const mongoose = require("mongoose");

const pnrHistorySchema = new mongoose.Schema(
    {
        pnrId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PNR",
            required: true,
            index: true,
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        journeyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Journey",
            default: null,
            index: true,
        },

        pnr: {
            type: String,
            required: true,
            trim: true,
        },

        previousPassengers: {
            type: Array,
            default: [],
        },

        currentPassengers: {
            type: Array,
            default: [],
        },

        previousChartStatus: {
            type: String,
            default: "",
        },

        currentChartStatus: {
            type: String,
            default: "",
        },

        changedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: true,
        collection: "pnrHistory",
    }
);

module.exports = mongoose.model(
    "PNRHistory",
    pnrHistorySchema
);