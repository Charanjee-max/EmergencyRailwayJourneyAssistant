const axios = require("axios");
const TrainStop = require("./trainStop.model");

// ============================================================
// Search Train Details
// ============================================================

const searchTrainService = async (query) => {
  const { trainNumber } = query;

  if (!trainNumber) {
    throw new Error("Train number is required.");
  }

  try {
    const response = await axios.get(
      `${process.env.RAILRADAR_BASE_URL}/trains/${trainNumber}?haltsOnly=true`,
      {
        headers: {
          Authorization: `Bearer ${process.env.RAILRADAR_API_KEY}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data?.message ||
          `RailRadar API Error (${error.response.status})`
      );
    }

    throw new Error("Unable to connect to RailRadar API.");
  }
};

// ============================================================
// Live Train Running Status
// ============================================================

const getLiveTrainStatusService = async (query) => {
  const { trainNumber } = query;

  if (!trainNumber) {
    throw new Error("Train number is required.");
  }

  try {
    const response = await axios.get(
      `${process.env.RAILRADAR_BASE_URL}/trains/${trainNumber}/live`,
      {
        headers: {
          Authorization: `Bearer ${process.env.RAILRADAR_API_KEY}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data?.message ||
          `RailRadar API Error (${error.response.status})`
      );
    }

    throw new Error("Unable to connect to RailRadar API.");
  }
};

// ============================================================
// Seat Availability Forecast
// ============================================================

const getSeatAvailabilityService = async (query) => {
  const {
    trainNumber,
    journeyDate,
    source,
    destination,
    classCode,
    quotaCode,
  } = query;

  if (
    !trainNumber ||
    !journeyDate ||
    !source ||
    !destination ||
    !classCode ||
    !quotaCode
  ) {
    throw new Error(
      "trainNumber, journeyDate, source, destination, classCode and quotaCode are required."
    );
  }

  try {
    const response = await axios.get(
      `${process.env.RAILRADAR_BASE_URL}/trains/${trainNumber}/seats`,
      {
        headers: {
          Authorization: `Bearer ${process.env.RAILRADAR_API_KEY}`,
        },
        params: {
          journeyDate,
          source,
          destination,
          classCode,
          quotaCode,
        },
      }
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data?.message ||
          `RailRadar API Error (${error.response.status})`
      );
    }

    throw new Error("Unable to connect to RailRadar API.");
  }
};

// ============================================================
// Get Complete Train Timetable
// ============================================================

const getTrainStopsService = async (query) => {
  const { trainNumber } = query;

  if (!trainNumber) {
    throw new Error("Train number is required.");
  }

  const normalizedTrainNumber = String(trainNumber).trim();

  const stops = await TrainStop.find({
    trainNumber: normalizedTrainNumber,
  })
    .sort({ no: 1 })
    .lean();

  return stops;
};

// ============================================================
// Check Whether a Train Stops at a Station
// ============================================================

const checkTrainStopService = async (query) => {
  const { trainNumber, stationCode } = query;

  if (!trainNumber || !stationCode) {
    throw new Error("trainNumber and stationCode are required.");
  }

  const normalizedTrainNumber = String(trainNumber).trim();
  const normalizedStationCode = String(stationCode)
    .trim()
    .toUpperCase();

  const stop = await TrainStop.findOne({
    trainNumber: normalizedTrainNumber,
    code: normalizedStationCode,
  }).lean();

  return {
    trainNumber: normalizedTrainNumber,
    stationCode: normalizedStationCode,
    stops: !!stop,
    station: stop || null,
  };
};

// ============================================================
// Get Stops Between Two Stations
// ============================================================

const getStopsBetweenService = async (query) => {
  const { trainNumber, from, to } = query;

  if (!trainNumber || !from || !to) {
    throw new Error("trainNumber, from and to are required.");
  }

  const normalizedTrainNumber = String(trainNumber).trim();

  const fromCode = String(from).trim().toUpperCase();

  const toCode = String(to).trim().toUpperCase();

  const stops = await TrainStop.find({
    trainNumber: normalizedTrainNumber,
  }).lean();

  if (!stops.length) {
    throw new Error(
      `No timetable found for train ${normalizedTrainNumber}.`
    );
  }

  // ----------------------------------------------------------
  // Convert timetable "no" into a numeric route order.
  //
  // Examples:
  // "1"   -> 1
  // "1.1" -> 1.1
  // "1.2" -> 1.2
  // "33"  -> 33
  // ----------------------------------------------------------

  const orderedStops = stops
    .map((stop) => ({
      ...stop,
      routeOrder: Number.parseFloat(stop.no),
    }))
    .filter((stop) => Number.isFinite(stop.routeOrder))
    .sort((a, b) => a.routeOrder - b.routeOrder);

  // ----------------------------------------------------------
  // Find departure station
  // ----------------------------------------------------------

  const fromIndex = orderedStops.findIndex(
    (stop) =>
      String(stop.code).trim().toUpperCase() === fromCode
  );

  // ----------------------------------------------------------
  // Find destination station
  // ----------------------------------------------------------

  const toIndex = orderedStops.findIndex(
    (stop) =>
      String(stop.code).trim().toUpperCase() === toCode
  );

  // ----------------------------------------------------------
  // Departure station not found
  // ----------------------------------------------------------

  if (fromIndex === -1) {
    return {
      trainNumber: normalizedTrainNumber,
      from: fromCode,
      to: toCode,
      found: false,
      message: `Departure station ${fromCode} is not on this train.`,
      count: 0,
      stops: [],
    };
  }

  // ----------------------------------------------------------
  // Destination station not found
  // ----------------------------------------------------------

  if (toIndex === -1) {
    return {
      trainNumber: normalizedTrainNumber,
      from: fromCode,
      to: toCode,
      found: false,
      message: `Destination station ${toCode} is not on this train.`,
      count: 0,
      stops: [],
    };
  }

  // ----------------------------------------------------------
  // Wrong direction
  // ----------------------------------------------------------

  if (fromIndex >= toIndex) {
    return {
      trainNumber: normalizedTrainNumber,
      from: fromCode,
      to: toCode,
      found: false,
      message: `${fromCode} does not occur before ${toCode} in the timetable.`,
      count: 0,
      stops: [],
    };
  }

  // ----------------------------------------------------------
  // Extract the complete section
  // including departure and destination stations.
  // ----------------------------------------------------------

  const betweenStops = orderedStops.slice(
    fromIndex,
    toIndex + 1
  );

  return {
    trainNumber: normalizedTrainNumber,
    from: fromCode,
    to: toCode,
    found: true,
    count: betweenStops.length,
    stops: betweenStops,
  };
};

// ============================================================
// Exports
// ============================================================

module.exports = {
  searchTrainService,
  getLiveTrainStatusService,
  getSeatAvailabilityService,
  getTrainStopsService,
  checkTrainStopService,
  getStopsBetweenService,
};