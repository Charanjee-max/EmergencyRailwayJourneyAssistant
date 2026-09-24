import API from "./axios.js";

export const getNotifications = (limit = 50) =>
    API.get("/notifications", {
        params: { limit },
    });

export const markNotificationAsRead = (id) =>
    API.patch(`/notifications/${id}/read`);

export const markAllNotificationsAsRead = () =>
    API.patch("/notifications/read-all");

export const deleteNotification = (id) =>
    API.delete(`/notifications/${id}`);

export const deleteAllNotifications = () =>
    API.delete("/notifications");