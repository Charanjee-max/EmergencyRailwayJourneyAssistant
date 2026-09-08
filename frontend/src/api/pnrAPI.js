import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000/api",
});

API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Check PNR and save/update it
export const checkPNR = (pnr) => {
    return API.post("/pnr/check", {
        pnr,
    });
};

// Get all saved PNRs
export const getPNRs = () => {
    return API.get("/pnr");
};

// Get one PNR
export const getPNRById = (id) => {
    return API.get(`/pnr/${id}`);
};

// Delete PNR
export const deletePNR = (id) => {
    return API.delete(`/pnr/${id}`);
};

export default API;