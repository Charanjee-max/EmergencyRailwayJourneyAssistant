const mongoose = require("mongoose");


// =========================================================
// NOTIFICATION SCHEMA
// =========================================================

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },


        type: {
            type: String,

            enum: [
                "SEAT_AVAILABLE",
                "JOURNEY_UPDATE",
                "CHART_UPDATE",
                "SYSTEM",
            ],

            default: "SYSTEM",

            maxlength: 50,
        },


        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 200,
        },


        message: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 1000,
        },


        journeyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Journey",
            default: null,
            index: true,
        },


        isRead: {
            type: Boolean,
            default: false,
            index: true,
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

// Fast user notification listing.
notificationSchema.index({
    userId: 1,
    createdAt: -1,
});


// Fast unread notification lookup.
notificationSchema.index({
    userId: 1,
    isRead: 1,
    createdAt: -1,
});


// Fast journey-specific notifications.
notificationSchema.index({
    journeyId: 1,
    createdAt: -1,
});


module.exports = mongoose.model(
    "Notification",
    notificationSchema
);