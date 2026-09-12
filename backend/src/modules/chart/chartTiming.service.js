// =========================================================
// CHART TIMING SERVICE
// Based on Railway Board chart preparation rule
// =========================================================

const INDIA_OFFSET_MINUTES = 330;

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

const pad = (value) => String(value).padStart(2, "0");

const parseTime = (time) => {
  if (!time) return null;

  const match = String(time)
    .trim()
    .match(/^(\d{1,2}):(\d{2})$/);

  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return {
    hours,
    minutes,
    totalMinutes: hours * 60 + minutes,
  };
};

// ---------------------------------------------------------
// Create an exact India-local Date
//
// Example:
// 2026-09-15 18:40 IST
// becomes:
// 2026-09-15T13:10:00.000Z
// ---------------------------------------------------------

const createIndiaDate = (
  journeyDate,
  hours,
  minutes,
  dayOffset = 0
) => {
  if (!journeyDate) {
    throw new Error("Journey date is required.");
  }

  // Normalize Date object / ISO date into YYYY-MM-DD
  let datePart;

  if (journeyDate instanceof Date) {
    if (Number.isNaN(journeyDate.getTime())) {
      throw new Error("Invalid journey date.");
    }

    // Extract calendar date in India
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(journeyDate);

    const values = {};

    for (const part of parts) {
      if (part.type !== "literal") {
        values[part.type] = part.value;
      }
    }

    datePart = `${values.year}-${values.month}-${values.day}`;
  } else {
    const stringDate = String(journeyDate).trim();

    const match = stringDate.match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );

    if (!match) {
      throw new Error(
        `Invalid journey date: ${journeyDate}`
      );
    }

    datePart = `${match[1]}-${match[2]}-${match[3]}`;
  }

  // Create UTC representation of the requested IST time.
  //
  // IST = UTC + 5:30
  //
  // Therefore:
  // UTC = IST - 5:30

  const [year, month, day] = datePart
    .split("-")
    .map(Number);

  const utcMilliseconds = Date.UTC(
    year,
    month - 1,
    day + dayOffset,
    hours,
    minutes
  );

  return new Date(
    utcMilliseconds - INDIA_OFFSET_MINUTES * 60 * 1000
  );
};

// ---------------------------------------------------------
// First chart
// ---------------------------------------------------------

const calculateFirstChartTime = ({
  journeyDate,
  originDeparture,
}) => {
  if (!journeyDate) {
    throw new Error("Journey date is required.");
  }

  const parsed = parseTime(originDeparture);

  if (!parsed) {
    throw new Error(
      `Invalid origin departure time: ${originDeparture}`
    );
  }

  const {
    hours,
    minutes,
    totalMinutes,
  } = parsed;

  // -------------------------------------------------------
  // RULE 1
  //
  // 05:01 - 14:00
  // First chart target: previous day 20:00
  // -------------------------------------------------------

  if (
    totalMinutes >= 301 &&
    totalMinutes <= 840
  ) {
    return createIndiaDate(
      journeyDate,
      20,
      0,
      -1
    );
  }

  // -------------------------------------------------------
  // RULE 2
  //
  // 14:01 - 23:59
  // First chart target: 10 hours before departure
  // -------------------------------------------------------

  if (
    totalMinutes >= 841 &&
    totalMinutes <= 1439
  ) {
    const departure = createIndiaDate(
      journeyDate,
      hours,
      minutes
    );

    return new Date(
      departure.getTime() -
        10 * 60 * 60 * 1000
    );
  }

  // -------------------------------------------------------
  // RULE 3
  //
  // 00:00 - 05:00
  // First chart target: 10 hours before departure
  // -------------------------------------------------------

  const departure = createIndiaDate(
    journeyDate,
    hours,
    minutes
  );

  return new Date(
    departure.getTime() -
      10 * 60 * 60 * 1000
  );
};

// ---------------------------------------------------------
// Final chart
// ---------------------------------------------------------

const calculateFinalChartTime = ({
  journeyDate,
  originDeparture,
}) => {
  const parsed = parseTime(originDeparture);

  if (!parsed) {
    throw new Error(
      `Invalid origin departure time: ${originDeparture}`
    );
  }

  const departure = createIndiaDate(
    journeyDate,
    parsed.hours,
    parsed.minutes
  );

  // Final chart target: 30 minutes before departure

  return new Date(
    departure.getTime() -
      30 * 60 * 1000
  );
};

// ---------------------------------------------------------
// Complete chart timing
// ---------------------------------------------------------

const calculateChartTiming = ({
  journeyDate,
  originDeparture,
}) => {
  const firstChartTime =
    calculateFirstChartTime({
      journeyDate,
      originDeparture,
    });

  const finalChartTime =
    calculateFinalChartTime({
      journeyDate,
      originDeparture,
    });

  const now = new Date();

  return {
    firstChartTime,
    finalChartTime,

    firstChartPreparedWindowReached:
      now >= firstChartTime,

    finalChartWindowReached:
      now >= finalChartTime,

    shouldCheckChart:
      now >= firstChartTime,
  };
};

// ---------------------------------------------------------
// Exports
// ---------------------------------------------------------

module.exports = {
  calculateFirstChartTime,
  calculateFinalChartTime,
  calculateChartTiming,
  parseTime,
};