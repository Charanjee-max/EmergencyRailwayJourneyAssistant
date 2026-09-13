const mongoose =
  require("mongoose");


// ============================================================
// TRAIN STOP SCHEMA
// ============================================================

const trainStopSchema =
  new mongoose.Schema(
    {
      // ======================================================
      // TRAIN NUMBER
      // ======================================================

      trainNumber: {
        type: String,

        required: true,

        trim: true,

        match: [
          /^\d{4,5}$/,
          "Invalid train number.",
        ],
      },


      // ======================================================
      // ROUTE ORDER
      // ======================================================

      no: {
        type: String,

        default: "",

        trim: true,

        maxlength: 20,
      },


      // ======================================================
      // TRACK
      // ======================================================

      track: {
        type: String,

        default: "",

        trim: true,

        maxlength: 50,
      },


      // ======================================================
      // STATION CODE
      // ======================================================

      code: {
        type: String,

        required: true,

        trim: true,

        uppercase: true,

        maxlength: 10,

        match: [
          /^[A-Z0-9]{2,10}$/,
          "Invalid station code.",
        ],

        index: true,
      },


      // ======================================================
      // STATION NAME
      // ======================================================

      station: {
        type: String,

        required: true,

        trim: true,

        maxlength: 150,
      },


      // ======================================================
      // XO
      // ======================================================

      xo: {
        type: String,

        default: "",

        trim: true,

        maxlength: 20,
      },


      // ======================================================
      // NOTE
      // ======================================================

      note: {
        type: String,

        default: "",

        trim: true,

        maxlength: 500,
      },


      // ======================================================
      // ARRIVAL
      // ======================================================

      arrival: {
        type: String,

        default: "",

        trim: true,

        maxlength: 10,
      },


      // ======================================================
      // ARRIVAL AVERAGE
      // ======================================================

      arrivalAvg: {
        type: String,

        default: "",

        trim: true,

        maxlength: 10,
      },


      // ======================================================
      // DEPARTURE
      // ======================================================

      departure: {
        type: String,

        default: "",

        trim: true,

        maxlength: 10,
      },


      // ======================================================
      // DEPARTURE AVERAGE
      // ======================================================

      departureAvg: {
        type: String,

        default: "",

        trim: true,

        maxlength: 10,
      },


      // ======================================================
      // HALT
      // ======================================================

      halt: {
        type: String,

        default: "",

        trim: true,

        maxlength: 20,
      },


      // ======================================================
      // PLATFORM
      // ======================================================

      pf: {
        type: String,

        default: "",

        trim: true,

        maxlength: 20,
      },


      // ======================================================
      // DAY
      // ======================================================

      day: {
        type: String,

        default: "",

        trim: true,

        maxlength: 10,
      },


      // ======================================================
      // DISTANCE
      // ======================================================

      km: {
        type: String,

        default: "",

        trim: true,

        maxlength: 20,
      },


      // ======================================================
      // SPEED
      // ======================================================

      speed: {
        type: String,

        default: "",

        trim: true,

        maxlength: 20,
      },


      // ======================================================
      // ELEVATION
      // ======================================================

      elevation: {
        type: String,

        default: "",

        trim: true,

        maxlength: 20,
      },


      // ======================================================
      // ZONE
      // ======================================================

      zone: {
        type: String,

        default: "",

        trim: true,

        maxlength: 20,
      },


      // ======================================================
      // ADDRESS
      // ======================================================

      address: {
        type: String,

        default: "",

        trim: true,

        maxlength: 300,
      },
    },

    {
      timestamps: true,

      collection:
        "trainStops",

      strict: true,

      strictQuery: true,
    }
  );


// ============================================================
// INDEXES
// ============================================================

// Fast train timetable lookup
trainStopSchema.index({
  trainNumber: 1,
  no: 1,
});


// Fast train + station lookup
trainStopSchema.index({
  trainNumber: 1,
  code: 1,
});


// ============================================================
// EXPORT
// ============================================================

module.exports =
  mongoose.model(
    "TrainStop",
    trainStopSchema
  );