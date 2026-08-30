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


// =========================================
// GET NOTIFICATIONS
// =========================================

export const getNotifications = (limit = 50) =>
    API.get("/notifications", {
        params: { limit },
    });


// =========================================
// MARK ONE AS READ
// =========================================

export const markNotificationAsRead = (id) =>
    API.patch(`/notifications/${id}/read`);


// =========================================
// MARK ALL AS READ
// =========================================

export const markAllNotificationsAsRead = () =>
    API.patch("/notifications/read-all");


// =========================================
// DELETE ONE
// =========================================

export const deleteNotification = (id) =>
    API.delete(`/notifications/${id}`);


// =========================================
// DELETE ALL
// =========================================

export const deleteAllNotifications = () =>
    API.delete("/notifications");