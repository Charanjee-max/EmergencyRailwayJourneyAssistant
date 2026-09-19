const axios = require("axios");

// ============================================================
// CONFIRMTKT TRAIN METADATA SERVICE
// ============================================================
//
// This service retrieves train metadata from the ConfirmTkt
// schedule endpoint.
//
// It is intended for:
// - Train name
// - Train number
// - Operating classes
// - Coach composition
// - Train route / schedule
// - Intermediate stations
//
// IMPORTANT:
// This is currently an undocumented ConfirmTkt endpoint
// discovered through the ConfirmTkt website's Network requests.
// Do not expose this request directly from the React frontend.
// ============================================================

const CONFIRMTKT_BASE_URL =
  "https://api.confirmtkt.com";

// ============================================================
// COMMON HEADERS
// ============================================================

function getConfirmTktHeaders() {
  return {
    Accept: "application/json, text/plain, */*",

    "Accept-Language":
      "en-US,en;q=0.9",

    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) " +
      "Chrome/139.0.0.0 Safari/537.36",

    "Cache-Control":
      "no-cache",

    Pragma:
      "no-cache",
  };
}


// ============================================================
// NORMALIZE TRAIN NUMBER
// ============================================================

function normalizeTrainNumber(trainNumber) {
  const value =
    String(trainNumber || "")
      .trim();

  if (!/^\d{4,5}$/.test(value)) {
    const error =
      new Error(
        "Valid train number is required."
      );

    error.statusCode = 400;

    throw error;
  }

  return value;
}


// ============================================================
// NORMALIZE JOURNEY DATE
// ============================================================
//
// Our frontend/backend uses:
// YYYY-MM-DD
//
// ConfirmTkt endpoint expects:
// DD-MM-YYYY
//
// Example:
// 2026-09-21
//      ↓
// 21-09-2026
// ============================================================

function normalizeJourneyDate(journeyDate) {
  const value =
    String(journeyDate || "")
      .trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const error =
      new Error(
        "Journey date must be in YYYY-MM-DD format."
      );

    error.statusCode = 400;

    throw error;
  }

  const [
    year,
    month,
    day,
  ] = value.split("-");

  return `${day}-${month}-${year}`;
}


// ============================================================
// PARSE COACH POSITION
// ============================================================
//
// ConfirmTkt example:
//
// ,En:,GS:,GS:,GS:A1,2A:B3,3A:B2,3A:B1,3A:
// S9,SL:S8,SL:S7,SL:S6,SL:S5,SL:S4,SL:S3,
// SL:S2,SL:S1,SL:SE1,SL:,GS:,GS:
//
// We convert it into:
//
// [
//   {
//     position: 5,
//     code: "A1",
//     classCode: "2A"
//   },
//   {
//     position: 6,
//     code: "B3",
//     classCode: "3A"
//   }
// ]
//
// Empty / engine / generic coaches are preserved with
// classCode = null when possible.
// ============================================================

function parseCoachPosition(coachPosition) {
  if (
    typeof coachPosition !== "string" ||
    !coachPosition.trim()
  ) {
    return [];
  }

  const rawEntries =
    coachPosition
      .split(",")
      .map(
        (entry) =>
          String(entry || "").trim()
      );

  const coaches = [];

  rawEntries.forEach(
    (entry, index) => {
      if (!entry) {
        return;
      }

      const parts =
        entry
          .split(":")
          .map(
            (part) =>
              String(part || "").trim()
          );

      if (!parts.length) {
        return;
      }

      let classCode = null;
      let code = null;

      // --------------------------------------------------------
      // Format:
      //
      // 2A:B3
      //
      // parts[0] = 2A
      // parts[1] = B3
      // --------------------------------------------------------

      if (parts.length >= 2) {
        const first = parts[0];
        const second = parts[1];

        const knownClassPattern =
          /^(1A|2A|3A|3E|SL|2S|CC|EC)$/i;

        if (
          knownClassPattern.test(first) &&
          second
        ) {
          classCode =
            first.toUpperCase();

          code =
            second.toUpperCase();
        } else if (
          knownClassPattern.test(second) &&
          first
        ) {
          classCode =
            second.toUpperCase();

          code =
            first.toUpperCase();
        } else {
          // Unknown format.
          // Preserve the values rather than guessing.
          code =
            second
              ? second.toUpperCase()
              : first.toUpperCase();
        }
      } else {
        // Example:
        // GS
        // En
        // etc.
        code =
          parts[0]
            .toUpperCase();
      }

      coaches.push({
        position:
          index + 1,

        code:
          code || null,

        classCode:
          classCode || null,

        raw:
          entry,
      });
    }
  );

  return coaches;
}


// ============================================================
// NORMALIZE CLASSES
// ============================================================

function normalizeClasses(classes) {
  if (!Array.isArray(classes)) {
    return [];
  }

  return [
    ...new Set(
      classes
        .map(
          (item) =>
            String(item || "")
              .trim()
              .toUpperCase()
        )
        .filter(Boolean)
    ),
  ];
}


// ============================================================
// NORMALIZE INTERMEDIATE STATIONS
// ============================================================

function normalizeIntermediateStations(
  stations
) {
  if (!Array.isArray(stations)) {
    return [];
  }

  return stations
    .map((station) => ({
      name:
        String(
          station?.StationName || ""
        ).trim(),

      code:
        String(
          station?.StationCode || ""
        )
          .trim()
          .toUpperCase(),

      arrival:
        String(
          station?.ArrivalTime || ""
        ).trim(),

      departure:
        String(
          station?.DepartureTime || ""
        ).trim(),

      halt:
        String(
          station?.HaltMinutes || ""
        ).trim(),

      distance:
        station?.Distance != null
          ? Number(station.Distance)
          : null,

      day:
        station?.Day != null
          ? Number(station.Day)
          : null,

      latitude:
        station?.Latitude != null
          ? Number(station.Latitude)
          : null,

      longitude:
        station?.Longitude != null
          ? Number(station.Longitude)
          : null,

      stopNumberDisplay:
        station?.stopNumberDisplay ?? null,
    }))
    .filter(
      (station) =>
        station.code ||
        station.name
    );
}


// ============================================================
// NORMALIZE SCHEDULE
// ============================================================

function normalizeSchedule(schedule) {
  if (!Array.isArray(schedule)) {
    return [];
  }

  return schedule.map(
    (stop) => ({
      stopNumber:
        stop?.StopNumber != null
          ? Number(stop.StopNumber)
          : null,

      code:
        String(
          stop?.StationCode || ""
        )
          .trim()
          .toUpperCase(),

      name:
        String(
          stop?.StationName || ""
        ).trim(),

      arrival:
        String(
          stop?.ArrivalTime || ""
        ).trim(),

      departure:
        String(
          stop?.DepartureTime || ""
        ).trim(),

      halt:
        String(
          stop?.HaltMinutes || ""
        ).trim(),

      distance:
        stop?.Distance != null
          ? Number(stop.Distance)
          : null,

      day:
        stop?.Day != null
          ? Number(stop.Day)
          : null,

      platform:
        String(
          stop?.ExpectedPlatformNo || ""
        ).trim(),

      latitude:
        stop?.Latitude != null
          ? Number(stop.Latitude)
          : null,

      longitude:
        stop?.Longitude != null
          ? Number(stop.Longitude)
          : null,

      intermediateStations:
        normalizeIntermediateStations(
          stop?.intermediateStations
        ),
    })
  );
}


// ============================================================
// FETCH RAW CONFIRMTKT TRAIN METADATA
// ============================================================

async function fetchConfirmTktTrainMetadata(
  trainNumber,
  journeyDate
) {
  const normalizedTrainNumber =
    normalizeTrainNumber(
      trainNumber
    );

  const confirmTktDate =
    normalizeJourneyDate(
      journeyDate
    );

  console.log(
    "\n========================================"
  );

  console.log(
    "🚆 CONFIRMTKT TRAIN METADATA REQUEST"
  );

  console.log(
    "========================================"
  );

  console.log(
    "Train:",
    normalizedTrainNumber
  );

  console.log(
    "Journey Date:",
    confirmTktDate
  );

  try {
    const response =
      await axios.get(
        `${CONFIRMTKT_BASE_URL}/api/trains/schedulewithintermediatestn`,
        {
          params: {
            date:
              confirmTktDate,

            trainNo:
              normalizedTrainNumber,

            locale:
              "en",
          },

          headers:
            getConfirmTktHeaders(),

          timeout:
            30000,

          validateStatus:
            (status) =>
              status >= 200 &&
              status < 500,
        }
      );

    console.log(
      "ConfirmTkt HTTP status:",
      response.status
    );

    if (
      response.status < 200 ||
      response.status >= 300
    ) {
      const error =
        new Error(
          `ConfirmTkt API returned HTTP ${response.status}.`
        );

      error.statusCode =
        response.status >= 400 &&
        response.status < 500
          ? 502
          : 500;

      error.responseData =
        response.data;

      throw error;
    }

    if (
      !response.data ||
      typeof response.data !== "object"
    ) {
      const error =
        new Error(
          "ConfirmTkt returned an invalid response."
        );

      error.statusCode = 502;

      throw error;
    }

    return response.data;
  } catch (error) {
    console.error(
      "❌ CONFIRMTKT METADATA ERROR:",
      error.message
    );

    if (
      error.statusCode
    ) {
      throw error;
    }

    if (
      error.response
    ) {
      const serviceError =
        new Error(
          `ConfirmTkt API Error (${error.response.status})`
        );

      serviceError.statusCode =
        502;

      throw serviceError;
    }

    if (
      error.code ===
      "ECONNABORTED"
    ) {
      const timeoutError =
        new Error(
          "ConfirmTkt request timed out."
        );

      timeoutError.statusCode =
        504;

      throw timeoutError;
    }

    const connectionError =
      new Error(
        "Unable to connect to ConfirmTkt."
      );

    connectionError.statusCode =
      502;

    throw connectionError;
  }
}


// ============================================================
// GET NORMALIZED TRAIN METADATA
// ============================================================

async function getConfirmTktTrainMetadata(
  trainNumber,
  journeyDate
) {
  const raw =
    await fetchConfirmTktTrainMetadata(
      trainNumber,
      journeyDate
    );

  // ----------------------------------------------------------
  // ConfirmTkt may wrap the actual response inside data.
  // ----------------------------------------------------------

  const data =
    raw?.data &&
    typeof raw.data === "object"
      ? raw.data
      : raw;

  if (
    !data ||
    typeof data !== "object"
  ) {
    const error =
      new Error(
        "ConfirmTkt returned no train metadata."
      );

    error.statusCode = 502;

    throw error;
  }

  const normalizedTrainNumber =
    String(
      data?.TrainNo ||
      data?.TrainNumberString ||
      trainNumber
    ).trim();

  const trainName =
    String(
      data?.TrainName || ""
    ).trim();

  const classes =
    normalizeClasses(
      data?.Classes
    );

  const coaches =
    parseCoachPosition(
      data?.CoachPosition
    );

  const schedule =
    normalizeSchedule(
      data?.Schedule
    );

  // ----------------------------------------------------------
  // Build a flattened list of actual scheduled stops.
  // These are the stations where the train has a stop.
  // ----------------------------------------------------------

  const stations =
    schedule.map(
      (stop, index) => ({
        routeOrder:
          stop.stopNumber ||
          index + 1,

        code:
          stop.code,

        name:
          stop.name,

        arrival:
          stop.arrival,

        departure:
          stop.departure,

        halt:
          stop.halt,

        distance:
          stop.distance,

        day:
          stop.day,

        platform:
          stop.platform,
      })
    );

  return {
    trainNumber:
      normalizedTrainNumber,

    trainName:
      trainName ||
      "Train name unavailable.",

    classes,

    coaches,

    coachPosition:
      data?.CoachPosition || "",

    schedule,

    stations,

    source:
      "CONFIRMTKT",

    verified:
      true,

    sourceDate:
      String(
        journeyDate
      ).trim(),

    sourceEndpoint:
      "schedulewithintermediatestn",

    sourceDetails: {
      source:
        data?.Source || "",

      sourceCode:
        data?.SourceCode || "",

      destination:
        data?.Destination || "",

      destinationCode:
        data?.DestinationCode || "",

      trainType:
        data?.TrainType || "",

      totalDuration:
        data?.TotalDuration || "",

      daysOfRun:
        data?.DaysOfRun || null,

      hasPantry:
        data?.HasPantry ?? null,
    },
  };
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  fetchConfirmTktTrainMetadata,

  getConfirmTktTrainMetadata,

  parseCoachPosition,

  normalizeClasses,

  normalizeSchedule,
};