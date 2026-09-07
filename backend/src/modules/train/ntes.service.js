const axios = require("axios");
const TrainStop = require("./trainStop.model");

const NTES_BASE_URL =
  "https://enquiry.indianrail.gov.in/mntes";

const http = axios.create({
  baseURL: NTES_BASE_URL,
  timeout: 20000,
  maxRedirects: 5,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) " +
      "Chrome/140.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  },
});

class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  absorb(setCookieHeaders = []) {
    for (const header of setCookieHeaders) {
      const firstPart = String(header).split(";")[0];
      const index = firstPart.indexOf("=");

      if (index === -1) continue;

      const name = firstPart.slice(0, index).trim();
      const value = firstPart.slice(index + 1).trim();

      if (name) {
        this.cookies.set(name, value);
      }
    }
  }

  getHeader() {
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }
}

const decodeHtml = (value = "") => {
  return String(value)
    .replace(/&nbsp;/gi, " ")
    .replace(/&#x20;/gi, " ")
    .replace(/&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCharCode(Number(code))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(parseInt(code, 16))
    );
};

const stripHtml = (html = "") => {
  return decodeHtml(
    String(html)
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, "")
  )
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
};

const extractCells = (rowHtml) => {
  return [
    ...String(rowHtml).matchAll(
      /<td\b[^>]*>([\s\S]*?)<\/td>/gi
    ),
  ].map((match) => match[1]);
};

const extractStation = (stationHtml) => {
  const text = stripHtml(stationHtml);

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const station = lines[0] || "";

  /*
   * Example:
   *
   * SECUNDERABAD JN
   * SC
   *
   * or:
   *
   * BHADRACHALAM RD
   * BDCR Train Reversal Point(1)
   */

  const remaining = lines.slice(1).join(" ");

  const codeMatch = remaining.match(
    /\b([A-Z0-9]{2,6})\b/
  );

  const code = codeMatch
    ? codeMatch[1].toUpperCase()
    : "";

  return {
    station,
    code,
  };
};

const extractTimeValues = (html) => {
  const text = stripHtml(html);

  return text
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);
};

const parseNtesSchedule = (html, trainNumber) => {
  const rows = [
    ...String(html).matchAll(
      /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi
    ),
  ];

  const stops = [];

  for (const rowMatch of rows) {
    const rowHtml = rowMatch[1];

    const cells = extractCells(rowHtml);

    // Timetable data rows contain 6 cells:
    //
    // Sr | Station | Day | Arr/Dep | Halt | Distance
    //
    if (cells.length < 6) {
      continue;
    }

    const serialText = stripHtml(cells[0]);
    const serialMatch = serialText.match(/\d+/);

    if (!serialMatch) {
      continue;
    }

    const no = serialMatch[0];

    const stationInfo = extractStation(cells[1]);

    if (!stationInfo.code || !stationInfo.station) {
      continue;
    }

    const day = stripHtml(cells[2]);

    const times = extractTimeValues(cells[3]);

    let arrival = "";
    let departure = "";

    if (times.length >= 2) {
      arrival = times[0];
      departure = times[1];
    } else if (times.length === 1) {
      departure = times[0];
    }

    /*
     * NTES uses:
     *
     * SRC  -> source departure marker
     * DSTN -> destination departure marker
     */

    if (arrival === "SRC") {
      arrival = "";
    }

    if (departure === "DSTN") {
      departure = "";
    }

    const halt = stripHtml(cells[4]);

    const distanceText = stripHtml(cells[5]);

    const distanceMatch = distanceText.match(
      /[\d.]+/
    );

    const km = distanceMatch
      ? distanceMatch[0]
      : "";

    stops.push({
      trainNumber: String(trainNumber).trim(),
      no: String(no),
      track: "",
      code: stationInfo.code,
      station: stationInfo.station,
      xo: "",
      note: "",
      arrival,
      arrivalAvg: "",
      departure,
      departureAvg: "",
      halt,
      pf: "",
      day,
      km,
      speed: "",
      elevation: "",
      zone: "",
      address: "",
    });
  }

  /*
   * Remove accidental duplicate rows.
   */
  const uniqueStops = [];
  const seen = new Set();

  for (const stop of stops) {
    const key = `${stop.trainNumber}:${stop.code}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    uniqueStops.push(stop);
  }

  uniqueStops.sort(
    (a, b) =>
      Number.parseFloat(a.no) -
      Number.parseFloat(b.no)
  );

  return uniqueStops;
};

const getNtesCsrf = async () => {
  const jar = new CookieJar();

  // ---------------------------------------------------------
  // 1. Establish NTES session
  // ---------------------------------------------------------

  const pageResponse = await http.get("/", {
    validateStatus: () => true,
  });

  jar.absorb(
    pageResponse.headers["set-cookie"] || []
  );

  if (
    pageResponse.status < 200 ||
    pageResponse.status >= 400
  ) {
    throw new Error(
      `NTES initial page failed: ${pageResponse.status}`
    );
  }

  // ---------------------------------------------------------
  // 2. Get dynamic CSRF hidden input
  // ---------------------------------------------------------

  const csrfResponse = await http.get(
    `/GetCSRFToken?t=${Date.now()}`,
    {
      headers: {
        Cookie: jar.getHeader(),
        Referer: `${NTES_BASE_URL}/`,
        "X-Requested-With": "XMLHttpRequest",
        Accept: "*/*",
      },
      validateStatus: () => true,
    }
  );

  jar.absorb(
    csrfResponse.headers["set-cookie"] || []
  );

  if (csrfResponse.status !== 200) {
    throw new Error(
      `NTES CSRF request failed: ${csrfResponse.status}`
    );
  }

  const csrfHtml = String(
    csrfResponse.data || ""
  );

  /*
   * NTES returns a hidden input such as:
   *
   * <input type="hidden"
   *        name="dynamicName"
   *        value="dynamicValue">
   */

  const inputMatch = csrfHtml.match(
    /<input\b[^>]*type\s*=\s*["']hidden["'][^>]*>/i
  );

  if (!inputMatch) {
    throw new Error(
      "NTES CSRF response did not contain a hidden input."
    );
  }

  const hiddenInput = inputMatch[0];

  const nameMatch = hiddenInput.match(
    /\bname\s*=\s*["']([^"']+)["']/i
  );

  const valueMatch = hiddenInput.match(
    /\bvalue\s*=\s*["']([^"']*)["']/i
  );

  if (!nameMatch || !valueMatch) {
    throw new Error(
      "Unable to extract NTES dynamic CSRF name/value."
    );
  }

  const csrf = {
    name: nameMatch[1],
    value: valueMatch[1],
  };

  console.log(
    `🔐 NTES CSRF field received: ${csrf.name}`
  );

  return {
    jar,
    csrf,
  };
};

const formatNtesDate = (inputDate = new Date()) => {
  const date = new Date(inputDate);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid train start date.");
  }

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${day}-${months[date.getMonth()]}-${date.getFullYear()}`;
};

const fetchNtesTrainSchedule = async (
  trainNumber,
  trainStartDate = new Date()
) => {
  const normalizedTrainNumber = String(
    trainNumber || ""
  ).trim();

  if (!normalizedTrainNumber) {
    throw new Error(
      "Train number is required."
    );
  }

  const { jar, csrf } =
    await getNtesCsrf();

  const formattedDate =
    formatNtesDate(trainStartDate);

  const form = new URLSearchParams();

  /*
   * These are the same fields NTES submits.
   */
  form.append("lan", "en");
  form.append(
    "trainNo",
    normalizedTrainNumber
  );
  form.append(
    "trainStartDate",
    formattedDate
  );

  /*
   * Dynamic CSRF field.
   */
  form.append(
    csrf.name,
    csrf.value
  );

  console.log(
    `🚆 Fetching NTES timetable for ${normalizedTrainNumber}`
  );

  const response = await http.post(
    `/q?opt=TrainServiceSchedule&subOpt=show&trainNo=${encodeURIComponent(
      normalizedTrainNumber
    )}`,
    form.toString(),
    {
      headers: {
        Cookie: jar.getHeader(),
        Referer: `${NTES_BASE_URL}/`,
        Origin:
          "https://enquiry.indianrail.gov.in",
        "Content-Type":
          "application/x-www-form-urlencoded",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      validateStatus: () => true,
    }
  );

  if (response.status !== 200) {
    throw new Error(
      `NTES timetable request failed: ${response.status}`
    );
  }

  const html = String(
    response.data || ""
  );

  if (!html.trim()) {
    throw new Error(
      `NTES returned empty timetable for train ${normalizedTrainNumber}.`
    );
  }

  const stops = parseNtesSchedule(
    html,
    normalizedTrainNumber
  );

  if (!stops.length) {
    throw new Error(
      `NTES timetable parser found no stations for train ${normalizedTrainNumber}.`
    );
  }

  console.log(
    `✅ NTES returned ${stops.length} stops for ${normalizedTrainNumber}`
  );

  return {
    trainNumber: normalizedTrainNumber,
    trainStartDate: formattedDate,
    stops,
    html,
  };
};

const syncNtesTrainStopsService = async (
  trainNumber,
  trainStartDate = new Date()
) => {
  const result =
    await fetchNtesTrainSchedule(
      trainNumber,
      trainStartDate
    );

  const {
    trainNumber: normalizedTrainNumber,
    stops,
  } = result;

  const operations = stops.map(
    (stop) => ({
      updateOne: {
        filter: {
          trainNumber:
            normalizedTrainNumber,
          code: stop.code,
        },
        update: {
          $set: stop,
        },
        upsert: true,
      },
    })
  );

  await TrainStop.bulkWrite(
    operations,
    {
      ordered: false,
    }
  );

  /*
   * Remove stations that no longer exist in
   * the latest NTES timetable.
   */
  await TrainStop.deleteMany({
    trainNumber:
      normalizedTrainNumber,
    code: {
      $nin: stops.map(
        (stop) => stop.code
      ),
    },
  });

  console.log(
    `💾 NTES timetable saved to TrainStop: ${normalizedTrainNumber}`
  );

  return stops;
};

module.exports = {
  fetchNtesTrainSchedule,
  syncNtesTrainStopsService,
  formatNtesDate,
};