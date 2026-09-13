const mongoose = require("mongoose");


// =========================================================
// STATION SCHEMA
// =========================================================

const stationSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            default: "",
            trim: true,
            uppercase: true,
            maxlength: 10,
        },

        name: {
            type: String,
            default: "",
            trim: true,
            maxlength: 150,
        },
    },
    {
        _id: false,
        strict: true,
    }
);


// =========================================================
// PASSENGER STATUS SCHEMA
// =========================================================

const passengerStatusSchema = new mongoose.Schema(
    {
        status: {
            type: String,
            default: "",
            trim: true,
            maxlength: 100,
        },

        coach: {
            type: String,
            default: "",
            trim: true,
            uppercase: true,
            maxlength: 20,
        },

        berthNo: {
            type: Number,
            default: null,
            min: 0,
            max: 999,
        },

        berthCode: {
            type: String,
            default: "",
            trim: true,
            uppercase: true,
            maxlength: 10,
        },

        details: {
            type: String,
            default: "",
            trim: true,
            maxlength: 500,
        },
    },
    {
        _id: false,
        strict: true,
    }
);


// =========================================================
// PASSENGER SCHEMA
// =========================================================

const passengerSchema = new mongoose.Schema(
    {
        serialNumber: {
            type: String,
            default: "",
            trim: true,
            maxlength: 20,
        },

        coachPosition: {
            type: Number,
            default: null,
            min: 0,
            max: 999,
        },

        booking: {
            type: passengerStatusSchema,
            default: {},
        },

        current: {
            type: passengerStatusSchema,
            default: {},
        },
    },
    {
        _id: false,
        strict: true,
    }
);


// =========================================================
// PNR SCHEMA
// =========================================================

const pnrSchema = new mongoose.Schema(
    {
        // =====================================================
        // USER OWNERSHIP
        // =====================================================

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },


        // =====================================================
        // OPTIONAL ERJA JOURNEY LINK
        // =====================================================

        journeyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Journey",
            default: null,
            index: true,
        },


        // =====================================================
        // PNR
        // =====================================================

        pnr: {
            type: String,
            required: true,
            trim: true,
            maxlength: 10,
            minlength: 10,
            match: [
                /^\d{10}$/,
                "Invalid PNR number.",
            ],
        },


        // =====================================================
        // TRAIN
        // =====================================================

        train: {
            number: {
                type: String,
                default: "",
                trim: true,
                maxlength: 10,
            },

            name: {
                type: String,
                default: "",
                trim: true,
                maxlength: 150,
            },
        },


        // =====================================================
        // JOURNEY INFORMATION
        // =====================================================

        journey: {
            dateOfJourney: {
                type: String,
                default: "",
                trim: true,
                maxlength: 30,
            },

            class: {
                type: String,
                default: "",
                trim: true,
                uppercase: true,
                maxlength: 10,
            },

            quota: {
                type: String,
                default: "",
                trim: true,
                uppercase: true,
                maxlength: 20,
            },


            // -------------------------------------------------
            // SOURCE
            // -------------------------------------------------

            source: {
                type: stationSchema,
                default: {},
            },


            // -------------------------------------------------
            // DESTINATION
            // -------------------------------------------------

            destination: {
                type: stationSchema,
                default: {},
            },


            // -------------------------------------------------
            // BOARDING POINT
            // -------------------------------------------------

            boardingPoint: {
                type: stationSchema,
                default: {},
            },


            // -------------------------------------------------
            // DISTANCE
            // -------------------------------------------------

            distance: {
                type: Number,
                default: null,
                min: 0,
                max: 100000,
            },


            // -------------------------------------------------
            // ARRIVAL DATE
            // -------------------------------------------------

            arrivalDate: {
                type: String,
                default: "",
                trim: true,
                maxlength: 30,
            },
        },


        // =====================================================
        // CHART
        // =====================================================

        chart: {
            status: {
                type: String,
                default: "",
                trim: true,
                maxlength: 100,
            },
        },


        // =====================================================
        // BOOKING
        // =====================================================

        booking: {
            fare: {
                type: Number,
                default: null,
                min: 0,
                max: 1000000,
            },

            ticketFare: {
                type: Number,
                default: null,
                min: 0,
                max: 1000000,
            },

            bookingDate: {
                type: String,
                default: "",
                trim: true,
                maxlength: 50,
            },
        },


        // =====================================================
        // PASSENGERS
        // =====================================================

        passengers: {
            type: [passengerSchema],
            default: [],
            validate: {
                validator: (value) =>
                    Array.isArray(value) &&
                    value.length <= 50,

                message:
                    "A PNR cannot contain more than 50 passengers.",
            },
        },


        // =====================================================
        // LAST CHECKED
        // =====================================================

        lastCheckedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },


    // =========================================================
    // SCHEMA OPTIONS
    // =========================================================

    {
        timestamps: true,

        collection: "pnrs",

        strict: true,

        strictQuery: true,
    }
);


// =========================================================
// INDEXES
// =========================================================

// Same user cannot save the same PNR twice.
pnrSchema.index(
    {
        userId: 1,
        pnr: 1,
    },
    {
        unique: true,
    }
);


// Faster lookup of PNRs belonging to a user.
pnrSchema.index({
    userId: 1,
    updatedAt: -1,
});


// Faster lookup of PNRs linked to journeys.
pnrSchema.index({
    journeyId: 1,
    updatedAt: -1,
});


// =========================================================
// EXPORT
// =========================================================

module.exports =
    mongoose.model(
        "PNR",
        pnrSchema
    );