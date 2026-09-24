import API from "./axios.js";

export const createJourney = (data) =>
    API.post("/journey", data);

export const getJourneys = () =>
    API.get("/journey");

export const getJourneyHistory = () =>
    API.get("/journey/history");

export const getJourneyById = (journeyId) =>
    API.get(`/journey/${journeyId}`);

export const runJourneyWorkflow = (journeyId) =>
    API.post(`/journey/${journeyId}/run-workflow`);

export const deleteJourney = (journeyId) =>
    API.delete(`/journey/${journeyId}`);

export default API;