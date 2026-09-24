import API from "./axios.js";

export const getRecommendations = (journeyId) =>
    API.get(`/recommendations/${journeyId}`);