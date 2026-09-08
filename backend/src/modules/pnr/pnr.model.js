const mongoose = require("mongoose");

const stationSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      default: "",
      trim: true,
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const passengerStatusSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      default: "",
      trim: true,
    },
    coach: {
      type: String,
      default: "",
      trim: true,
    },
    berthNo: {
      type: Number,
      default: null,
    },
    berthCode: {
      type: String,
      default: "",
      trim: true,
    },
    details: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const passengerSchema = new mongoose.Schema(
  {
    serialNumber: {
      type: String,
      default: "",
    },
    coachPosition: {
      type: Number,
      default: null,
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
  { _id: false }
);

const pnrSchema = new mongoose.Schema(
  {
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

    train: {
      number: {
        type: String,
        default: "",
      },
      name: {
        type: String,
        default: "",
      },
    },

    journey: {
      dateOfJourney: {
        type: String,
        default: "",
      },

      class: {
        type: String,
        default: "",
      },

      quota: {
        type: String,
        default: "",
      },

      source: {
        type: stationSchema,
        default: {},
      },

      destination: {
        type: stationSchema,
        default: {},
      },

      boardingPoint: {
        type: stationSchema,
        default: {},
      },

      distance: {
        type: Number,
        default: null,
      },

      arrivalDate: {
        type: String,
        default: "",
      },
    },

    chart: {
      status: {
        type: String,
        default: "",
      },
    },

    booking: {
      fare: {
        type: Number,
        default: null,
      },

      ticketFare: {
        type: Number,
        default: null,
      },

      bookingDate: {
        type: String,
        default: "",
      },
    },

    passengers: {
      type: [passengerSchema],
      default: [],
    },

    lastCheckedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "pnrs",
  }
);

// Same user should not save the same PNR multiple times.
pnrSchema.index(
  { userId: 1, pnr: 1 },
  { unique: true }
);

module.exports = mongoose.model("PNR", pnrSchema);