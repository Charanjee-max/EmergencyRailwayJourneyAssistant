const mongoose = require("mongoose");

const chartSchema = new mongoose.Schema(
{
    trainNumber: {
        type: String,
        required: true
    },

    journeyDate: {
        type: String,
        required: true
    },

    boardingStation: {
        type: String,
        required: true
    },

    chartOneDate: String,

    chartTwoDate: String,

    chartPrepared: {
        type: Boolean,
        default: false
    },

    trainName: String,

    from: String,

    to: String,

    cdd: {
        type: Array,
        default: []
    },

    vbd: {
        type: Array,
        default: []
    },

    rawResponse: Object,

    fetchedAt: {
        type: Date,
        default: Date.now
    }

},
{
    timestamps: true
});

module.exports = mongoose.model("Chart", chartSchema);