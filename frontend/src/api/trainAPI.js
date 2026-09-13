"use strict";

import axios from "axios";

// =========================================================
// API CONFIGURATION
// =========================================================

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000/api";

// =========================================================
// AXIOS INSTANCE
// =========================================================

const API = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,

    headers: {
        "Content-Type": "application/json",
    },
});

// =========================================================
// REQUEST INTERCEPTOR
// =========================================================
//
// Adds JWT automatically.
//
// Never manually pass JWT from every component.
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

    (error) => {
        return Promise.reject(error);
    }
);

// =========================================================
// RESPONSE INTERCEPTOR
// =========================================================
//
// If JWT expires / becomes invalid,
// remove it and allow the application
// routing layer to handle authentication.
// =========================================================

API.interceptors.response.use(
    (response) => response,

    (error) => {
        if (
            error?.response?.status === 401
        ) {
            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "user"
            );
        }

        return Promise.reject(error);
    }
);

// =========================================================
// HELPER
// =========================================================

const cleanString = (
    value,
    maxLength = 100
) => {
    return String(value ?? "")
        .trim()
        .slice(0, maxLength);
};

// =========================================================
// SEARCH STATION
// =========================================================
//
// Used by AddJourney autocomplete.
//
// Supports AbortController signal so old
// requests can be cancelled.
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
// SEARCH TRAIN
// =========================================================

export const searchTrain = (
    trainNumber,
    options = {}
) => {
    const value =
        cleanString(
            trainNumber,
            6
        );

    if (!/^\d{4,6}$/.test(value)) {
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
// GET TRAIN CLASSES
// =========================================================
//
// Fetches actual coach composition from
// backend → IRCTC.
//
// Required:
// trainNumber
// journeyDate
// boardingStation
// =========================================================

export const getTrainClasses = ({
    trainNumber,
    journeyDate,
    boardingStation,
    signal,
}) => {
    const cleanTrainNumber =
        cleanString(
            trainNumber,
            6
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

    // -----------------------------------------------------
    // Client-side validation
    // -----------------------------------------------------

    if (
        !/^\d{4,6}$/.test(
            cleanTrainNumber
        )
    ) {
        return Promise.reject(
            new Error(
                "Invalid train number."
            )
        );
    }

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