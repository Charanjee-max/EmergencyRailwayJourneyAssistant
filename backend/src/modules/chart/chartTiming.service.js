// =========================================================
// CHART TIMING SERVICE
// Based on Railway Board December 2025 chart preparation rule
// =========================================================

const INDIA_TIME_ZONE = "Asia/Kolkata";

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

const pad = (value) => String(value).padStart(2, "0");

const formatDate = (date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
};

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
// Build India-local Date without depending on server TZ
// ---------------------------------------------------------

const createIndiaDate = (
  journeyDate,
  hours,
  minutes,
  dayOffset = 0
) => {
  const base = new Date(`${journeyDate}T00:00:00+05:30`);

  if (Number.isNaN(base.getTime())) {
    throw new Error(`Invalid journey date: ${journeyDate}`);
  }

  base.setUTCDate(base.getUTCDate() + dayOffset);
  base.setUTCHours(
    hours - 5,
    minutes - 30,
    0,
    0
  );

  return base;
};

// ---------------------------------------------------------
// Calculate first chart time
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

  const { hours, minutes, totalMinutes } = parsed;

  // -------------------------------------------------------
  // RULE 1
  //
  // 05:01 - 14:00
  // First chart: previous day 20:00
  // -------------------------------------------------------

  if (totalMinutes >= 301 && totalMinutes <= 840) {
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
  // First chart: 10 hours before
  // -------------------------------------------------------

  if (totalMinutes >= 841 && totalMinutes <= 1439) {
    const departure = createIndiaDate(
      journeyDate,
      hours,
      minutes
    );

    return new Date(
      departure.getTime() - 10 * 60 * 60 * 1000
    );
  }

  // -------------------------------------------------------
  // RULE 3
  //
  // 00:00 - 05:00
  // First chart: 10 hours before
  //
  // Departure is early morning on journey date.
  // -------------------------------------------------------

  const departure = createIndiaDate(
    journeyDate,
    hours,
    minutes
  );

  return new Date(
    departure.getTime() - 10 * 60 * 60 * 1000
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

  return new Date(
    departure.getTime() - 30 * 60 * 1000
  );
};

// ---------------------------------------------------------
// Complete chart timing
// ---------------------------------------------------------

const calculateChartTiming = ({
  journeyDate,
  originDeparture,
}) => {
  const firstChartTime = calculateFirstChartTime({
    journeyDate,
    originDeparture,
  });

  const finalChartTime = calculateFinalChartTime({
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

module.exports = {
  calculateFirstChartTime,
  calculateFinalChartTime,
  calculateChartTiming,
  parseTime,
};