const axios = require("axios");
const cheerio = require("cheerio");

const BASE_URL = "https://enquiry.indianrail.gov.in/mntes";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  maxRedirects: 5,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152.0.0.0 Safari/537.36",
  },
});

// ============================================================
// SIMPLE COOKIE JAR
// ============================================================

let cookies = {};

function storeCookies(setCookieHeaders) {
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

    cookies[name] = value;
  });
}

function getCookieHeader() {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

function printCookies() {
  console.log(
    "Session cookies:",
    Object.keys(cookies)
  );
}

// ============================================================
// MAIN TEST
// ============================================================

async function testNTES() {
  try {
    // --------------------------------------------------------
    // 1. OPEN NTES
    // --------------------------------------------------------

    console.log("\n1️⃣ Opening NTES...");

    const homeResponse = await client.get("/");

    console.log(
      "NTES status:",
      homeResponse.status
    );

    console.log(
      "Home HTML length:",
      homeResponse.data.length
    );

    storeCookies(
      homeResponse.headers["set-cookie"]
    );

    printCookies();

    // --------------------------------------------------------
    // 2. GET CSRF TOKEN
    // --------------------------------------------------------

    console.log("\n2️⃣ Getting CSRF token...");

    const csrfResponse = await client.get(
      `/GetCSRFToken?t=${Date.now()}`,
      {
        headers: {
          Accept: "*/*",
          "X-Requested-With": "XMLHttpRequest",
          Referer:
            "https://enquiry.indianrail.gov.in/mntes/",
          Cookie: getCookieHeader(),
        },
      }
    );

    console.log(
      "CSRF status:",
      csrfResponse.status
    );

    console.log(
      "CSRF response:",
      csrfResponse.data
    );

    storeCookies(
      csrfResponse.headers["set-cookie"]
    );

    printCookies();

    // --------------------------------------------------------
    // Parse CSRF input
    // --------------------------------------------------------

    const $csrf = cheerio.load(
      `<div>${csrfResponse.data}</div>`
    );

    const csrfInput = $csrf(
      "input[type='hidden']"
    ).first();

    if (!csrfInput.length) {
      throw new Error(
        "CSRF response did not contain a hidden input."
      );
    }

    const csrfName = csrfInput.attr("name");
    const csrfValue = csrfInput.attr("value");

    console.log("\nCSRF field detected:");
    console.log("Name:", csrfName);
    console.log("Value:", csrfValue);

    // --------------------------------------------------------
    // 3. POST TRAIN SCHEDULE
    // --------------------------------------------------------

    console.log(
      "\n3️⃣ Requesting train timetable..."
    );

    const params = new URLSearchParams();

    params.append("lan", "en");
    params.append("trainNo", "12745");
    params.append(
      "trainStartDate",
      "06-Sep-2026"
    );

    params.append(
      csrfName,
      csrfValue
    );

    console.log(
      "\nPOST body:",
      params.toString()
    );

    const scheduleResponse = await client.post(
      "/q?opt=TrainServiceSchedule&subOpt=show&trainNo=12745",
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
          Cookie: getCookieHeader(),
        },
      }
    );

    console.log(
      "Schedule status:",
      scheduleResponse.status
    );

    console.log(
      "Schedule HTML length:",
      scheduleResponse.data.length
    );

    // --------------------------------------------------------
    // 4. SHOW RESPONSE
    // --------------------------------------------------------

    if (!scheduleResponse.data) {
      console.log(
        "\n⚠️ NTES returned an empty response."
      );

      console.log(
        "Response headers:",
        scheduleResponse.headers
      );

      return;
    }

    console.log(
      "\nFirst 500 characters of response:"
    );

    console.log(
      scheduleResponse.data.slice(0, 500)
    );

    // --------------------------------------------------------
    // 5. PARSE TIMETABLE
    // --------------------------------------------------------

    const $ = cheerio.load(
      scheduleResponse.data
    );

    const rows = [];

    $("table tr").each(
      (index, row) => {
        const cells = $(row)
          .find("td")
          .map((i, cell) =>
            $(cell)
              .text()
              .replace(/\s+/g, " ")
              .trim()
          )
          .get();

        if (
          cells.length >= 6 &&
          /^\d+$/.test(cells[0])
        ) {
          rows.push(cells);
        }
      }
    );

    console.log(
      "\n4️⃣ Parsed station rows:",
      rows.length
    );

    console.log("\nFirst 5 rows:");

    rows
      .slice(0, 5)
      .forEach((row) => {
        console.log(row);
      });

    console.log("\nLast 3 rows:");

    rows
      .slice(-3)
      .forEach((row) => {
        console.log(row);
      });

    console.log(
      "\n✅ NTES TEST COMPLETE"
    );
  } catch (error) {
    console.error(
      "\n❌ NTES TEST FAILED"
    );

    if (error.response) {
      console.error(
        "HTTP status:",
        error.response.status
      );

      console.error(
        "Response length:",
        typeof error.response.data === "string"
          ? error.response.data.length
          : "non-string"
      );

      console.error(
        "Response:",
        typeof error.response.data === "string"
          ? error.response.data.slice(0, 1000)
          : error.response.data
      );
    } else {
      console.error(
        error.message
      );
    }
  }
}

testNTES();