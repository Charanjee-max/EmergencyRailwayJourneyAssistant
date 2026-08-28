import api from "../api/axios";

export const loginUser = (email, password) => {
    return api.post("/auth/login", {
        email,
        password,
    });
};