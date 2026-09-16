const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const BASE_URL =
    "https://enquiry.indianrail.gov.in/mntes";

const ntesParser =
    require("../../services/ntesParser");


// ============================================================
// COOKIE HELPERS
// ============================================================

function updateCookies(
    cookieJar,
    setCookieHeaders = []
) {
    for (const setCookie of setCookieHeaders) {

        if (!setCookie) {
            continue;
        }

        const firstPart =
            setCookie.split(";")[0];

        const separatorIndex =
            firstPart.indexOf("=");

        if (separatorIndex === -1) {
            continue;
        }

        const name =
            firstPart
                .slice(0, separatorIndex)
                .trim();

        const value =
            firstPart
                .slice(separatorIndex + 1)
                .trim();

        if (name) {
            cookieJar[name] = value;
        }
    }
}


function buildCookieHeader(
    cookieJar
) {
    return Object.entries(cookieJar)
        .map(
            ([name, value]) =>
                `${name}=${value}`
        )
        .join("; ");
}


// ============================================================
// COMMON HEADERS
// ============================================================

function getBrowserHeaders() {
    return {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",

        "Accept":
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",

        "Accept-Language":
            "en-US,en;q=0.9",

        "Cache-Control":
            "no-cache",

        "Pragma":
            "no-cache",
    };
}


// ============================================================
// GET NTES HOME PAGE
// ============================================================

async function getNtesSession() {

    const cookieJar = {};

    const response =
        await axios.get(
            `${BASE_URL}/`,
            {
                timeout: 30000,

                headers:
                    getBrowserHeaders(),

                validateStatus:
                    (status) =>
                        status >= 200 &&
                        status < 400,
            }
        );

    updateCookies(
        cookieJar,
        response.headers["set-cookie"] || []
    );

    return {
        html:
            String(
                response.data || ""
            ),

        cookies:
            cookieJar,
    };
}


// ============================================================
// GET CSRF TOKEN
// ============================================================

async function getCsrfToken(
    cookieJar
) {

    const timestamp =
        Date.now();

    const cookieHeader =
        buildCookieHeader(
            cookieJar
        );

    const response =
        await axios.get(
            `${BASE_URL}/GetCSRFToken?t=${timestamp}`,
            {
                timeout: 30000,

                headers: {
                    ...getBrowserHeaders(),

                    "Accept":
                        "*/*",

                    ...(cookieHeader
                        ? {
                            Cookie:
                                cookieHeader
                        }
                        : {}),
                },

                validateStatus:
                    (status) =>
                        status >= 200 &&
                        status < 400,
            }
        );

    updateCookies(
        cookieJar,
        response.headers["set-cookie"] || []
    );

    const csrfHtml =
        String(
            response.data || ""
        ).trim();

    if (!csrfHtml) {
        throw new Error(
            "NTES did not return a CSRF token."
        );
    }

    const $ =
        cheerio.load(
            `<div>${csrfHtml}</div>`
        );

    const csrfInput =
        $("input[type='hidden']")
            .first();

    if (!csrfInput.length) {
        throw new Error(
            "NTES CSRF response did not contain a hidden input."
        );
    }

    const csrfName =
        csrfInput.attr("name");

    const csrfValue =
        csrfInput.attr("value");

    if (
        !csrfName ||
        csrfValue === undefined
    ) {
        throw new Error(
            "Invalid NTES CSRF token response."
        );
    }

    console.log(
        "✅ NTES CSRF token received."
    );

    return {
        name:
            csrfName,

        value:
            csrfValue,
    };
}


// ============================================================
// SAVE DEBUG HTML
// ============================================================

function saveDebugHtml(
    html
) {
    try {

        const debugPath =
            path.join(
                process.cwd(),
                "ntes-debug-response.html"
            );

        fs.writeFileSync(
            debugPath,
            html,
            "utf8"
        );

        console.log(
            "💾 NTES response saved:"
        );

        console.log(
            debugPath
        );

        return debugPath;

    } catch (error) {

        console.warn(
            "⚠️ Could not save NTES debug HTML:",
            error.message
        );

        return null;
    }
}


// ============================================================
// FETCH TRAIN RUNNING HTML
// ============================================================

async function fetchTrainRunningHtml(
    trainNumber,
    journeyDate
) {

    const normalizedTrainNumber =
        String(trainNumber)
            .trim();

    const normalizedJourneyDate =
        String(journeyDate)
            .trim();

    if (
        !/^\d{5}$/.test(
            normalizedTrainNumber
        )
    ) {
        throw new Error(
            `Invalid NTES train number: ${normalizedTrainNumber}`
        );
    }

    if (!normalizedJourneyDate) {
        throw new Error(
            "NTES journey date is required."
        );
    }


    console.log(
        "\n========================================"
    );

    console.log(
        "🚆 NTES REQUEST"
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
        normalizedJourneyDate
    );


    // ========================================================
    // STEP 1 - CREATE SESSION
    // ========================================================

    const session =
        await getNtesSession();

    const cookieJar =
        session.cookies;

    console.log(
        "✅ NTES session initialized."
    );


    // ========================================================
    // STEP 2 - GET CSRF
    // ========================================================

    const csrf =
        await getCsrfToken(
            cookieJar
        );


    // ========================================================
    // STEP 3 - BUILD FORM
    // ========================================================

    const form =
        new URLSearchParams();

    /*
     * frmTRN contains:
     *
     * lan
     * jDate
     * trainNo
     *
     * submitForm() appends the dynamically
     * generated CSRF hidden field.
     */

    form.append(
        "lan",
        "en"
    );

    form.append(
        "jDate",
        normalizedJourneyDate
    );

    form.append(
        "trainNo",
        normalizedTrainNumber
    );

    form.append(
        csrf.name,
        csrf.value
    );


    // ========================================================
    // STEP 4 - BUILD NTES ENDPOINT
    // ========================================================

    const endpoint =
        `${BASE_URL}/tr` +
        `?opt=TrainRunning` +
        `&subOpt=FindRunningInstancePop` +
        `&trainNo=${encodeURIComponent(
            normalizedTrainNumber
        )}` +
        `&refDate=${encodeURIComponent(
            normalizedJourneyDate
        )}`;


    console.log(
        "NTES endpoint:",
        endpoint
    );

    console.log(
        "HTTP method: POST"
    );


    const cookieHeader =
        buildCookieHeader(
            cookieJar
        );


    // ========================================================
    // STEP 5 - POST TO NTES
    // ========================================================

    const response =
        await axios.post(
            endpoint,
            form.toString(),
            {
                timeout: 60000,

                maxRedirects: 5,

                headers: {
                    ...getBrowserHeaders(),

                    "Content-Type":
                        "application/x-www-form-urlencoded",

                    "Referer":
                        `${BASE_URL}/`,

                    "Origin":
                        "https://enquiry.indianrail.gov.in",

                    ...(cookieHeader
                        ? {
                            Cookie:
                                cookieHeader
                        }
                        : {}),
                },

                validateStatus:
                    (status) =>
                        status >= 200 &&
                        status < 400,
            }
        );


    // ========================================================
    // STEP 6 - RESPONSE HTML
    // ========================================================

    const html =
        String(
            response.data || ""
        );


    if (
        !html ||
        html.length < 100
    ) {
        throw new Error(
            "NTES returned an empty or invalid HTML response."
        );
    }


    console.log(
        "✅ NTES running page received."
    );

    console.log(
        "HTML size:",
        html.length,
        "characters"
    );


    // ========================================================
    // SAVE REAL RESPONSE FOR PARSER DEBUGGING
    // ========================================================

    const debugPath =
        saveDebugHtml(
            html
        );


    return {
        html,

        statusCode:
            response.status,

        cookies:
            cookieJar,

        csrf,

        debugPath,
    };
}


// ============================================================
// FETCH + PARSE
// ============================================================

async function getTrainRunningStatus(
    trainNumber,
    journeyDate
) {

    const result =
        await fetchTrainRunningHtml(
            trainNumber,
            journeyDate
        );


    const parsed =
        ntesParser.parse(
            result.html,
            {
                journeyDate,
            }
        );


    return {
        ...parsed,

        rawHtmlSize:
            result.html.length,

        httpStatus:
            result.statusCode,

        debugPath:
            result.debugPath,
    };
}


// ============================================================
// SYNC NTES STOPS TO MONGODB
// ============================================================

async function syncNtesTrainStopsService(
    trainNumber,
    journeyDate
) {

    const TrainStop =
        require("./trainStop.model");


    const result =
        await getTrainRunningStatus(
            trainNumber,
            journeyDate
        );


    if (
        !result.stops ||
        result.stops.length === 0
    ) {

        throw new Error(
            `NTES returned no stops for train ${trainNumber}. ` +
            `Debug HTML: ${result.debugPath || "not saved"}`
        );
    }


    const normalizedTrainNumber =
        String(trainNumber)
            .trim();


    console.log(
        `🚆 NTES parsed ${result.stops.length} stops for train ${normalizedTrainNumber}`
    );


    const operations =
        result.stops
            .filter(
                (stop) =>
                    stop.code
            )
            .map(
                (stop, index) => ({

                    updateOne: {

                        filter: {

                            trainNumber:
                                normalizedTrainNumber,

                            code:
                                String(
                                    stop.code
                                )
                                    .trim()
                                    .toUpperCase(),
                        },

                        update: {

                            $set: {

                                trainNumber:
                                    normalizedTrainNumber,

                                no:
                                    String(
                                        stop.routeOrder ||
                                        index + 1
                                    ),

                                code:
                                    String(
                                        stop.code
                                    )
                                        .trim()
                                        .toUpperCase(),

                                station:
                                    stop.name || "",

                                arrival:
                                    stop.scheduledArrival || "",

                                arrivalAvg:
                                    stop.actualArrival || "",

                                departure:
                                    stop.scheduledDeparture || "",

                                departureAvg:
                                    stop.actualDeparture || "",

                                halt:
                                    stop.halt || "",

                                pf:
                                    stop.platform || "",

                                day:
                                    stop.day || "",

                                km:
                                    stop.distanceKm != null
                                        ? String(
                                            stop.distanceKm
                                        )
                                        : "",

                                zone:
                                    stop.zone || "",

                                address:
                                    stop.address || "",
                            },
                        },

                        upsert:
                            true,
                    },
                })
            );


    if (
        operations.length === 0
    ) {
        throw new Error(
            "No valid NTES station codes were available for MongoDB sync."
        );
    }


    const resultWrite =
        await TrainStop.bulkWrite(
            operations
        );


    console.log(
        `✅ NTES timetable synced to MongoDB: ${operations.length} stops`
    );


    return {
        ...result,

        mongoSync: {
            matchedCount:
                resultWrite.matchedCount,

            modifiedCount:
                resultWrite.modifiedCount,

            upsertedCount:
                resultWrite.upsertedCount,
        },
    };
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {

    getNtesSession,

    getCsrfToken,

    fetchTrainRunningHtml,

    getTrainRunningStatus,

    syncNtesTrainStopsService,
};