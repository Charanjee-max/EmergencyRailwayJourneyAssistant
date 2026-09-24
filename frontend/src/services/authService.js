import API from "../api/axios.js";

export const loginUser = (email, password) =>
    API.post("/auth/login", {
        email,
        password,
    });

export const registerUser = (userData) =>
    API.post("/auth/register", userData);

export const logoutUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};

export const getToken = () =>
    localStorage.getItem("token");

export const getCurrentUser = () => {
    const user = localStorage.getItem("user");

    if (!user) {
        return null;
    }

    try {
        return JSON.parse(user);
    } catch (error) {
        console.error("Unable to parse saved user:", error);
        return null;
    }
};

export const isAuthenticated = () =>
    Boolean(localStorage.getItem("token"));

export default API;