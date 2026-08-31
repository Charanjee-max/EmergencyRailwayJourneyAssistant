import axios from "axios";


const API = axios.create({
    baseURL: "http://localhost:5000/api",
});


// =========================================================
// AUTH TOKEN
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
// STATION AUTOCOMPLETE
// =========================================================

export const searchStation = (
    search
) => {

    return API.get(
        "/station/autocomplete",
        {
            params: {
                search,
            },
        }
    );

};


// =========================================================
// TRAIN SEARCH
// =========================================================
// We are keeping this here for the next upgrade.
//
// Later this will be used for:
//
// 11019
// ↓
// 11019 — Konark Express
// CSMT → BBSN
//
// IMPORTANT:
// SC → BZA will remain the user's
// boarding/deboarding journey.
// =========================================================

export const searchTrain = (
    trainNumber
) => {

    return API.get(
        "/train/search",
        {
            params: {
                trainNumber,
            },
        }
    );

};


export default API;