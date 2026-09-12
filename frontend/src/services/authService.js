import axios from "axios";


// =========================================================
// API INSTANCE
// =========================================================

const API = axios.create({

    baseURL:
        import.meta.env.VITE_API_BASE_URL ||
        "http://localhost:5000/api",

    headers: {
        "Content-Type": "application/json",
    },

});


// =========================================================
// LOGIN
// =========================================================

export const loginUser = (
    email,
    password
) => {

    return API.post(
        "/auth/login",
        {
            email,
            password,
        }
    );

};


// =========================================================
// REGISTER
// =========================================================

export const registerUser = (
    userData
) => {

    return API.post(
        "/auth/register",
        userData
    );

};


// =========================================================
// LOGOUT
// =========================================================

export const logoutUser = () => {

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "user"
    );

};


// =========================================================
// GET SAVED TOKEN
// =========================================================

export const getToken = () => {

    return localStorage.getItem(
        "token"
    );

};


// =========================================================
// GET SAVED USER
// =========================================================

export const getCurrentUser = () => {

    const user =
        localStorage.getItem(
            "user"
        );

    if (!user) {
        return null;
    }

    try {

        return JSON.parse(user);

    } catch (error) {

        console.error(
            "Unable to parse saved user:",
            error
        );

        return null;

    }

};


// =========================================================
// CHECK AUTHENTICATION
// =========================================================

export const isAuthenticated = () => {

    return Boolean(
        localStorage.getItem(
            "token"
        )
    );

};


// =========================================================
// DEFAULT EXPORT
// =========================================================

export default API;