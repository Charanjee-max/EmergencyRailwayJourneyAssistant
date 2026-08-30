import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000/api",
});

API.interceptors.request.use((config) => {

    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;

});

export const createJourney = (data) =>
    API.post("/journey", data);

export const getJourneys = () =>
    API.get("/journey");
export const getJourneyById = (journeyId) =>
    API.get(`/journey/${journeyId}`);