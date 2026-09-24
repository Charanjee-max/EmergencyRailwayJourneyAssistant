import API from "./axios.js";

export const getProfile = () =>
    API.get("/profile");

export const updateProfile = (data) =>
    API.patch("/profile", data);