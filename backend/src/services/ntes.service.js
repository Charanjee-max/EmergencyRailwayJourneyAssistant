const axios = require("axios");
const cheerio = require("cheerio");

const BASE_URL =
  "https://enquiry.indianrail.gov.in/mntes";

const createClient = () =>
  axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    maxRedirects: 5,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152.0.0.0 Safari/537.36",
    },
  });

const storeCookies = (cookieJar, setCookieHeaders) => {
  if (!setCookieHeaders) {
    return;
  }

  const headers = Array.isArray(setCookieHeaders)
    ? setCookieHeaders
    : [setCookieHeaders];

  headers.forEach((header) => {
    const firstPart = header.split(";")[0];
    const separatorIndex = firstPart.indexOf("=");

    if (separatorIndex === -1) {
      return;
    }

    const name = firstPart
      .slice(0, separatorIndex)
      .trim();

    const value = firstPart
      .slice(separatorIndex + 1)
      .trim();

    cookieJar[name] = value;
  });
};

const getCookieHeader = (cookieJar) =>
  Object.entries(cookieJar)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");

const parseCsrfToken = (html) => {
  const $ = cheerio.load(
    `<div>${html}</div>`
  );

  const input = $("input[type='hidden']").first();

  if (!input.length) {
    throw new Error(
      "NTES CSRF token was not returned."
    );
  }

  const name = input.attr("name");
  const value = input.attr("value");

  if (!name || !value) {
    throw new Error(
      "NTES CSRF token is incomplete."
    );
  }

  return {
    name,
    value,
  };
};

const parseSchedule = (html, trainNumber) => {
  const $ = cheerio.load(html);

  const stops = [];

  $("table tr").each((index, row) => {
    const cells = $(row).find("td");

    if (cells.length < 6) {
      return;
    }

    const serialNumber = $(cells[0])
      .text()
      .replace(/\s+/g, " ")
      .trim();

    if (!/^\d+$/.test(serialNumber)) {
      return;
    }

    const stationCell = $(cells[1]);

    const stationName = stationCell
      .find("font")
      .eq(0)
      .text()
      .replace(/\s+/g, " ")
      .trim();

    const stationCode = stationCell
      .find("font")
      .eq(1)
      .text()
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();

    const day = $(cells[2])
      .text()
      .replace(/\s+/g, " ")
      .trim();

    const timeFonts = $(cells[3]).find("font");

    let arrival = "";
    let departure = "";

    if (timeFonts.length >= 2) {
      arrival = timeFonts
        .eq(0)
        .text()
        .trim();

      departure = timeFonts
        .eq(1)
        .text()
        .trim();
    } else {
      const timeText = $(cells[3])
        .text()
        .replace(/\s+/g, " ")
        .trim();

      departure = timeText;
    }

    const halt = $(cells[4])
      .text()
      .replace(/\s+/g, " ")
      .trim();

    const distance = $(cells[5])
      .text()
      .replace(/\s+/g, " ")
      .trim();

    if (!stationCode) {
      return;
    }

    stops.push({
      no: Number(serialNumber),
      code: stationCode,
      station: stationName,
      day: Number(day) || null,
      arrival,
      departure,
      halt,
      distance: Number(distance) || 0,
    });
  });

  if (!stops.length) {
    throw new Error(
      `NTES returned no timetable stops for train ${trainNumber}.`
    );
  }

  return stops;
};

const getTrainScheduleService = async (
  trainNumber,
  trainStartDate
) => {
  const normalizedTrainNumber = String(
    trainNumber || ""
  ).trim();

  if (!normalizedTrainNumber) {
    throw new Error(
      "Train number is required."
    );
  }

  if (!trainStartDate) {
    throw new Error(
      "Train start date is required."
    );
  }

  const client = createClient();

  const cookieJar = {};

  // ========================================================
  // 1. OPEN NTES
  // ========================================================

  const homeResponse = await client.get("/");

  storeCookies(
    cookieJar,
    homeResponse.headers["set-cookie"]
  );

  // ========================================================
  // 2. GET CSRF TOKEN
  // ========================================================

  const csrfResponse = await client.get(
    `/GetCSRFToken?t=${Date.now()}`,
    {
      headers: {
        Accept: "*/*",
        "X-Requested-With": "XMLHttpRequest",
        Referer:
          "https://enquiry.indianrail.gov.in/mntes/",
        Cookie: getCookieHeader(cookieJar),
      },
    }
  );

  storeCookies(
    cookieJar,
    csrfResponse.headers["set-cookie"]
  );

  const csrf = parseCsrfToken(
    csrfResponse.data
  );

  // ========================================================
  // 3. REQUEST TRAIN SCHEDULE
  // ========================================================

  const params = new URLSearchParams();

  params.append("lan", "en");
  params.append(
    "trainNo",
    normalizedTrainNumber
  );
  params.append(
    "trainStartDate",
    trainStartDate
  );

  params.append(
    csrf.name,
    csrf.value
  );

  const scheduleResponse = await client.post(
    `/q?opt=TrainServiceSchedule&subOpt=show&trainNo=${encodeURIComponent(
      normalizedTrainNumber
    )}`,
    params.toString(),
    {
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "X-Requested-With": "XMLHttpRequest",
        Referer:
          "https://enquiry.indianrail.gov.in/mntes/",
        Cookie: getCookieHeader(cookieJar),
      },
    }
  );

  if (
    !scheduleResponse.data ||
    typeof scheduleResponse.data !== "string"
  ) {
    throw new Error(
      `NTES returned an empty timetable for train ${normalizedTrainNumber}.`
    );
  }

  // ========================================================
  // 4. PARSE TIMETABLE
  // ========================================================

  const stops = parseSchedule(
    scheduleResponse.data,
    normalizedTrainNumber
  );

  return {
    trainNumber: normalizedTrainNumber,
    trainStartDate,
    stops,
  };
};

module.exports = {
  getTrainScheduleService,
};