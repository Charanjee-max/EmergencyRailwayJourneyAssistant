"use strict";

import axios from "axios";

// =========================================================
// API CONFIGURATION
// =========================================================

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000/api";

const API = axios.create({
    baseURL: API_BASE_URL,

    timeout: 15000,

    headers: {
        "Content-Type": "application/json",
    },
});


// =========================================================
// AUTH INTERCEPTOR
// =========================================================

API.interceptors.request.use(
    (config) => {

        const token =
            localStorage.getItem("token");

        if (token) {
            config.headers.Authorization =
                `Bearer ${token}`;
        }

        return config;
    },

    (error) =>
        Promise.reject(error)
);


// =========================================================
// RESPONSE INTERCEPTOR
// =========================================================

API.interceptors.response.use(
    (response) => response,

    (error) => {

        if (
            error?.response?.status === 401
        ) {

            localStorage.removeItem("token");
            localStorage.removeItem("user");

        }

        return Promise.reject(error);
    }
);


// =========================================================
// HELPERS
// =========================================================

const cleanString = (
    value,
    maxLength = 100
) =>
    String(value ?? "")
        .trim()
        .slice(0, maxLength);


// =========================================================
// STATION SEARCH
// =========================================================

export const searchStation = (
    search,
    options = {}
) => {

    const query =
        cleanString(search, 50);

    if (query.length < 2) {

        return Promise.resolve({
            data: {
                success: true,
                data: [],
            },
        });

    }

    return API.get(
        "/station/autocomplete",
        {
            params: {
                search: query,
            },

            signal:
                options.signal,
        }
    );
};


// =========================================================
// TRAIN SEARCH
// =========================================================

/*
 * Searches one train number.
 *
 * Backend:
 *
 * GET /api/train/search?trainNumber=12796
 *
 * The response comes from the existing
 * train search service.
 */

export const searchTrain = (
    trainNumber,
    options = {}
) => {

    const value =
        cleanString(
            trainNumber,
            5
        );

    if (
        !/^\d{4,5}$/.test(value)
    ) {

        return Promise.reject(
            new Error(
                "Invalid train number."
            )
        );

    }

    return API.get(
        "/train/search",
        {
            params: {
                trainNumber: value,
            },

            signal:
                options.signal,
        }
    );
};


// =========================================================
// TRAIN METADATA
// =========================================================

/*
 * Fetches pre-chart train metadata.
 *
 * IMPORTANT:
 *
 * This endpoint is different from
 * /chart/classes.
 *
 * /chart/classes depends on the railway chart
 * being prepared.
 *
 * /train/metadata provides train composition,
 * classes and route information before the chart
 * is prepared.
 *
 * Backend:
 *
 * GET /api/train/metadata
 *
 * Required:
 *
 * trainNumber
 * journeyDate
 */

export const getTrainMetadata = ({
    trainNumber,
    journeyDate,
    signal,
}) => {

    const cleanTrainNumber =
        cleanString(
            trainNumber,
            5
        );

    const cleanJourneyDate =
        cleanString(
            journeyDate,
            10
        );

    // ---------------------------------------------------------
    // VALIDATE TRAIN NUMBER
    // ---------------------------------------------------------

    if (
        !/^\d{4,5}$/.test(
            cleanTrainNumber
        )
    ) {

        return Promise.reject(
            new Error(
                "Invalid train number."
            )
        );

    }

    // ---------------------------------------------------------
    // VALIDATE JOURNEY DATE
    // ---------------------------------------------------------

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
            cleanJourneyDate
        )
    ) {

        return Promise.reject(
            new Error(
                "Invalid journey date."
            )
        );

    }

    // ---------------------------------------------------------
    // API REQUEST
    // ---------------------------------------------------------

    return API.get(
        "/train/metadata",
        {
            params: {

                trainNumber:
                    cleanTrainNumber,

                journeyDate:
                    cleanJourneyDate,

            },

            signal,
        }
    );
};


// =========================================================
// LEGACY / CHART TRAIN CLASSES
// =========================================================

/*
 * Fetches classes from the prepared railway chart.
 *
 * IMPORTANT:
 *
 * Keep this function because other parts of ERJA
 * may still use the chart/classes endpoint.
 *
 * Do NOT use this function from AddJourney for
 * initial class selection.
 *
 * AddJourney should use getTrainMetadata()
 * because the chart may not yet be prepared.
 *
 * Backend:
 *
 * GET /api/chart/classes
 */

export const getTrainClasses = ({
    trainNumber,
    journeyDate,
    boardingStation,
    signal,
}) => {

    const cleanTrainNumber =
        cleanString(
            trainNumber,
            5
        );

    const cleanJourneyDate =
        cleanString(
            journeyDate,
            10
        );

    const cleanBoardingStation =
        cleanString(
            boardingStation,
            10
        ).toUpperCase();


    // ---------------------------------------------------------
    // VALIDATE TRAIN NUMBER
    // ---------------------------------------------------------

    if (
        !/^\d{4,5}$/.test(
            cleanTrainNumber
        )
    ) {

        return Promise.reject(
            new Error(
                "Invalid train number."
            )
        );

    }


    // ---------------------------------------------------------
    // VALIDATE JOURNEY DATE
    // ---------------------------------------------------------

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
            cleanJourneyDate
        )
    ) {

        return Promise.reject(
            new Error(
                "Invalid journey date."
            )
        );

    }


    // ---------------------------------------------------------
    // VALIDATE BOARDING STATION
    // ---------------------------------------------------------

    if (
        !/^[A-Z0-9]{2,10}$/.test(
            cleanBoardingStation
        )
    ) {

        return Promise.reject(
            new Error(
                "Invalid boarding station."
            )
        );

    }


    // ---------------------------------------------------------
    // API REQUEST
    // ---------------------------------------------------------

    return API.get(
        "/chart/classes",
        {
            params: {

                trainNumber:
                    cleanTrainNumber,

                journeyDate:
                    cleanJourneyDate,

                boardingStation:
                    cleanBoardingStation,

            },

            signal,
        }
    );
};


// =========================================================
// DEFAULT EXPORT
// =========================================================

export default API;