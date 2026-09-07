const Journey = require("./journey.model");
const Chart = require("../chart/chart.model");
const Recommendation = require("../recommendation/recommendation.model");

const {
  getStopsBetweenService,
} = require("../train/train.service");


// =========================================================
// INDIA TIMEZONE
// =========================================================

const INDIA_TIME_ZONE = "Asia/Kolkata";


// =========================================================
// GET CURRENT INDIA DATE + TIME
// =========================================================

const getIndiaDateTime = () => {

  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          INDIA_TIME_ZONE,

        year: "numeric",
        month: "2-digit",
        day: "2-digit",

        hour: "2-digit",
        minute: "2-digit",

        hourCycle: "h23",
      }
    ).formatToParts(
      new Date()
    );


  const values = {};


  for (
    const part of parts
  ) {

    if (
      part.type !==
      "literal"
    ) {

      values[part.type] =
        part.value;
    }
  }


  return {

    date:
      `${values.year}-${values.month}-${values.day}`,

    minutes:
      Number(values.hour) * 60 +
      Number(values.minute),

  };
};


// =========================================================
// NORMALIZE DATE TO YYYY-MM-DD
// =========================================================

const normalizeJourneyDate = (
  journeyDate
) => {

  if (
    typeof journeyDate ===
    "string"
  ) {

    return journeyDate
      .slice(0, 10);
  }


  const date =
    new Date(journeyDate);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return null;
  }


  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        INDIA_TIME_ZONE,

      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(date);
};


// =========================================================
// PARSE HH:mm
// =========================================================

const parseTimeToMinutes = (
  time
) => {

  const value =
    String(time || "")
      .trim();


  const match =
    value.match(
      /^(\d{1,2}):(\d{2})$/
    );


  if (!match) {

    return null;
  }


  const hours =
    Number(match[1]);

  const minutes =
    Number(match[2]);


  if (
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {

    return null;
  }


  return (
    hours * 60 +
    minutes
  );
};


// =========================================================
// VALIDATE JOURNEY DATE
// =========================================================
//
// Rules:
//
// 1. Past date -> reject
//
// 2. Future date -> allow
//
// 3. Today:
//      check train departure from boarding station
//
//      departure still ahead -> allow
//
//      departure already passed -> reject
//
// =========================================================

const validateJourneyDate = (
  journeyDate,
  routeStops
) => {

  const selectedDate =
    normalizeJourneyDate(
      journeyDate
    );


  if (!selectedDate) {

    const error =
      new Error(
        "Journey date must be a valid date."
      );

    error.statusCode = 400;

    throw error;
  }


  const indiaNow =
    getIndiaDateTime();


  console.log(
    "\n========================================"
  );

  console.log(
    "📅 JOURNEY DATE VALIDATION"
  );

  console.log(
    "========================================"
  );

  console.log(
    "Selected Date:",
    selectedDate
  );

  console.log(
    "India Today:",
    indiaNow.date
  );


  // =======================================================
  // PAST DATE
  // =======================================================

  if (
    selectedDate <
    indiaNow.date
  ) {

    const error =
      new Error(
        "Journey date cannot be in the past."
      );

    error.statusCode = 400;

    throw error;
  }


  // =======================================================
  // FUTURE DATE
  // =======================================================

  if (
    selectedDate >
    indiaNow.date
  ) {

    console.log(
      "✅ Future journey date."
    );

    console.log(
      "========================================\n"
    );

    return;
  }


  // =======================================================
  // TODAY
  // =======================================================

  console.log(
    "📍 Selected journey date is TODAY."
  );


  if (
    !Array.isArray(routeStops) ||
    routeStops.length === 0
  ) {

    const error =
      new Error(
        "Unable to determine the train timetable for today's journey."
      );

    error.statusCode = 400;

    throw error;
  }


  // =======================================================
  // routeStops comes from getStopsBetweenService()
  //
  // It begins with the selected boarding station.
  // =======================================================

  const boardingStop =
    routeStops[0];


  if (!boardingStop) {

    const error =
      new Error(
        "Unable to determine the boarding station timetable."
      );

    error.statusCode = 400;

    throw error;
  }


  const boardingStation =
    String(
      boardingStop.code || ""
    )
      .trim()
      .toUpperCase();


  const departure =
    String(
      boardingStop.departure || ""
    )
      .trim();


  console.log(
    "Boarding Station:",
    boardingStation
  );

  console.log(
    "Train Departure:",
    departure
  );


  // =======================================================
  // TERMINAL / INVALID DEPARTURE
  // =======================================================

  if (
    !departure ||
    departure === "DSTN" ||
    departure === "DSTN."
  ) {

    const error =
      new Error(
        `Unable to determine today's departure time from ${boardingStation}.`
      );

    error.statusCode = 400;

    throw error;
  }


  // =======================================================
  // CONVERT DEPARTURE TO MINUTES
  // =======================================================

  const departureMinutes =
    parseTimeToMinutes(
      departure
    );


  if (
    departureMinutes === null
  ) {

    const error =
      new Error(
        `Unable to determine today's departure time from ${boardingStation}.`
      );

    error.statusCode = 400;

    throw error;
  }


  console.log(
    "Current India Time:",
    `${String(
      Math.floor(
        indiaNow.minutes / 60
      )
    ).padStart(2, "0")}:${String(
      indiaNow.minutes % 60
    ).padStart(2, "0")}`
  );


  // =======================================================
  // TRAIN ALREADY DEPARTED
  // =======================================================

  if (
    departureMinutes <=
    indiaNow.minutes
  ) {

    console.log(
      "❌ TRAIN HAS ALREADY DEPARTED TODAY."
    );

    console.log(
      "========================================\n"
    );


    const error =
      new Error(
        `Train ${boardingStation} has already departed today at ${departure}. Please select a future journey date.`
      );


    error.statusCode = 400;


    throw error;
  }


  // =======================================================
  // TRAIN STILL IN FUTURE
  // =======================================================

  console.log(
    "✅ TRAIN HAS NOT DEPARTED YET."
  );

  console.log(
    "✅ TODAY JOURNEY IS ALLOWED."
  );

  console.log(
    "========================================\n"
  );
};


// =========================================================
// CREATE JOURNEY
// =========================================================

const createJourney = async (
  journeyData,
  userId
) => {

  // =======================================================
  // NORMALIZE INPUT
  // =======================================================

  const trainNumber =
    String(
      journeyData.trainNumber ||
      ""
    ).trim();


  const boardingStation =
    String(
      journeyData.boardingStation ||
      ""
    )
      .trim()
      .toUpperCase();


  const destinationStation =
    String(
      journeyData.destinationStation ||
      ""
    )
      .trim()
      .toUpperCase();


  // =======================================================
  // BASIC CHECK
  // =======================================================

  if (
    !trainNumber ||
    !boardingStation ||
    !destinationStation
  ) {

    const error =
      new Error(
        "Train number, source station and destination station are required."
      );

    error.statusCode = 400;

    throw error;
  }


  // =======================================================
  // SAME STATION
  // =======================================================

  if (
    boardingStation ===
    destinationStation
  ) {

    const error =
      new Error(
        "Boarding and destination stations cannot be the same."
      );

    error.statusCode = 400;

    throw error;
  }


  // =======================================================
  // VALIDATE TRAIN ROUTE
  // =======================================================
  //
  // This checks:
  //
  // 1. Timetable exists
  // 2. Boarding station exists
  // 3. Destination exists
  // 4. Boarding station occurs before destination
  //
  // =======================================================

  console.log(
    "\n========================================"
  );

  console.log(
    "🚆 VALIDATING JOURNEY ROUTE"
  );

  console.log(
    "========================================"
  );

  console.log(
    "Train:",
    trainNumber
  );

  console.log(
    "Source:",
    boardingStation
  );

  console.log(
    "Destination:",
    destinationStation
  );


  let routeValidation;


  try {

    routeValidation =
      await getStopsBetweenService({
        trainNumber,

        from:
          boardingStation,

        to:
          destinationStation,
      });

  } catch (error) {

    console.error(
      "❌ TRAIN ROUTE VALIDATION ERROR:",
      error.message
    );


    const routeError =
      new Error(
        error.message ||
        `Unable to validate route for train ${trainNumber}.`
      );


    routeError.statusCode =
      400;


    throw routeError;
  }


  // =======================================================
  // INVALID ROUTE
  // =======================================================

  if (
    !routeValidation ||
    routeValidation.found !== true
  ) {

    console.log(
      "❌ JOURNEY ROUTE INVALID"
    );


    console.log(
      routeValidation?.message ||
      "Selected source and destination are not valid for this train."
    );


    console.log(
      "========================================\n"
    );


    const error =
      new Error(
        routeValidation?.message ||
        `Train ${trainNumber} does not operate from ${boardingStation} to ${destinationStation}.`
      );


    error.statusCode =
      400;


    throw error;
  }


  // =======================================================
  // VALID ROUTE
  // =======================================================

  console.log(
    "✅ JOURNEY ROUTE VALIDATED"
  );

  console.log(
    `Train: ${trainNumber}`
  );

  console.log(
    `Source: ${boardingStation}`
  );

  console.log(
    `Destination: ${destinationStation}`
  );

  console.log(
    `Stops in journey: ${routeValidation.count}`
  );

  console.log(
    "========================================\n"
  );


  // =======================================================
  // VALIDATE JOURNEY DATE
  // =======================================================

  validateJourneyDate(
    journeyData.journeyDate,
    routeValidation.stops
  );


  // =======================================================
  // CREATE JOURNEY
  // =======================================================

  const journey =
    await Journey.create({

      userId,

      trainNumber,

      journeyDate:
        journeyData.journeyDate,

      boardingStation,

      destinationStation,

      allowedClasses:
        journeyData.allowedClasses,

      allowMixedClass:
        journeyData.allowMixedClass,

      preferredStrategy:
        journeyData.preferredStrategy,

    });


  console.log(
    "✅ JOURNEY CREATED:",
    journey._id
  );


  return journey;
};


// =========================================================
// GET ALL JOURNEYS OF LOGGED-IN USER
// =========================================================

const getUserJourneys =
  async (userId) => {

    const journeys =
      await Journey.find({
        userId,
      })
        .sort({
          createdAt: -1,
        })
        .lean();


    // =====================================================
    // ATTACH LATEST IRCTC CHART INFORMATION
    // =====================================================

    const journeysWithChart =
      await Promise.all(

        journeys.map(
          async (journey) => {

            const chart =
              await Chart.findOne({

                trainNumber:
                  journey.trainNumber,

                journeyDate:
                  new Date(
                    journey.journeyDate
                  )
                    .toISOString()
                    .split("T")[0],

                boardingStation:
                  journey.boardingStation,

              })
                .sort({
                  fetchedAt: -1,
                })
                .lean();


            return {

              ...journey,

              chart:
                chart
                  ? {

                      prepared:
                        chart.chartPrepared ===
                        true,

                      chartPrepared:
                        chart.chartPrepared ===
                        true,

                      chartOneDate:
                        chart.chartOneDate ||
                        null,

                      chartTwoDate:
                        chart.chartTwoDate ||
                        null,

                      fetchedAt:
                        chart.fetchedAt ||
                        null,

                    }

                  : {

                      prepared: false,

                      chartPrepared:
                        false,

                      chartOneDate:
                        null,

                      chartTwoDate:
                        null,

                      fetchedAt:
                        null,

                    },

            };
          }
        )

      );


    return journeysWithChart;
  };


// =========================================================
// GET SINGLE JOURNEY BY ID
// =========================================================

const getJourneyById =
  async (
    journeyId,
    userId
  ) => {

    const journey =
      await Journey.findOne({

        _id:
          journeyId,

        userId,

      });


    if (!journey) {

      const error =
        new Error(
          "Journey request not found."
        );

      error.statusCode =
        404;

      throw error;
    }


    return journey;
  };


// =========================================================
// DELETE JOURNEY
// =========================================================
//
// Ownership is enforced here:
//
// _id + userId
//
// Therefore a user cannot delete another user's journey.
//
// =========================================================

const deleteJourney =
  async (
    journeyId,
    userId
  ) => {

    console.log(
      "\n========================================"
    );

    console.log(
      "🗑️ DELETING JOURNEY"
    );

    console.log(
      "========================================"
    );

    console.log(
      "Journey ID:",
      journeyId
    );

    console.log(
      "User ID:",
      userId
    );


    // =====================================================
    // FIND JOURNEY OWNED BY USER
    // =====================================================

    const journey =
      await Journey.findOne({
        _id:
          journeyId,

        userId,
      });


    if (!journey) {

      const error =
        new Error(
          "Journey request not found or access denied."
        );

      error.statusCode =
        404;

      throw error;
    }


    // =====================================================
    // DELETE RECOMMENDATIONS
    // =====================================================

    const recommendationResult =
      await Recommendation.deleteMany({
        journey:
          journeyId,
      });


    console.log(
      "Recommendations deleted:",
      recommendationResult.deletedCount
    );


    // =====================================================
    // DELETE JOURNEY
    // =====================================================

    await Journey.deleteOne({
      _id:
        journeyId,

      userId,
    });


    console.log(
      "✅ Journey deleted successfully."
    );

    console.log(
      "========================================\n"
    );


    return journey;
  };


// =========================================================
// EXPORT
// =========================================================

module.exports = {

  createJourney,

  getUserJourneys,

  getJourneyById,

  deleteJourney,

};