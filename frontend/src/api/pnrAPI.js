import API from "./axios.js";

export const checkPNR = (pnr) =>
    API.post("/pnr/check", { pnr });

export const getPNRs = () =>
    API.get("/pnr");

export const getPNRById = (id) =>
    API.get(`/pnr/${id}`);

export const deletePNR = (id) =>
    API.delete(`/pnr/${id}`);

export default API;