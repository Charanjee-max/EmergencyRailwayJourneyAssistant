import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000/api",
});

// =========================================================
// AUTHENTICATION
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
// CREATE JOURNEY
// =========================================================

export const createJourney = (data) =>
    API.post(
        "/journey",
        data
    );

// =========================================================
// GET ACTIVE JOURNEYS
// =========================================================

export const getJourneys = () =>
    API.get(
        "/journey"
    );

// =========================================================
// GET JOURNEY HISTORY
// =========================================================

export const getJourneyHistory = () =>
    API.get(
        "/journey/history"
    );

// =========================================================
// GET SINGLE JOURNEY
// =========================================================

export const getJourneyById = (
    journeyId
) =>
    API.get(
        `/journey/${journeyId}`
    );

// =========================================================
// RUN WORKFLOW MANUALLY
// =========================================================

export const runJourneyWorkflow = (
    journeyId
) =>
    API.post(
        `/journey/${journeyId}/run-workflow`
    );

// =========================================================
// DELETE JOURNEY
// =========================================================

export const deleteJourney = (
    journeyId
) =>
    API.delete(
        `/journey/${journeyId}`
    );

export default API;