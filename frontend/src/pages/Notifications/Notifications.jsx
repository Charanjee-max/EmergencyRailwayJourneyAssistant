import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    deleteAllNotifications,
} from "../../api/notificationAPI";

import "./Notifications.css";


export default function Notifications() {

    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] =
        useState(null);


    // =========================================
    // LOAD NOTIFICATIONS
    // =========================================

    const loadNotifications = useCallback(
        async (isRefresh = false) => {

            try {

                if (isRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError("");

                const response =
                    await getNotifications();

                setNotifications(
                    response?.data?.data || []
                );

                setUnreadCount(
                    response?.data?.unreadCount || 0
                );

            } catch (err) {

                console.error(
                    "Failed to load notifications:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                    "Unable to load notifications."
                );

            } finally {

                setLoading(false);
                setRefreshing(false);

            }
        },
        []
    );


    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);


    // =========================================
    // MARK ONE READ
    // =========================================

    const handleMarkRead = async (id) => {

        try {

            setActionLoading(id);

            await markNotificationAsRead(id);

            setNotifications((previous) =>
                previous.map((notification) =>
                    notification._id === id
                        ? {
                            ...notification,
                            isRead: true,
                        }
                        : notification
                )
            );

            setUnreadCount((previous) =>
                Math.max(previous - 1, 0)
            );

        } catch (err) {

            console.error(
                "Failed to mark notification as read:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to update notification."
            );

        } finally {

            setActionLoading(null);

        }
    };


    // =========================================
    // MARK ALL READ
    // =========================================

    const handleMarkAllRead = async () => {

        if (unreadCount === 0) {
            return;
        }

        try {

            setActionLoading("all");

            await markAllNotificationsAsRead();

            setNotifications((previous) =>
                previous.map((notification) => ({
                    ...notification,
                    isRead: true,
                }))
            );

            setUnreadCount(0);

        } catch (err) {

            console.error(
                "Failed to mark all notifications:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to update notifications."
            );

        } finally {

            setActionLoading(null);

        }
    };


    // =========================================
    // DELETE ONE
    // =========================================

    const handleDelete = async (
        id,
        wasUnread
    ) => {

        try {

            setActionLoading(`delete-${id}`);

            await deleteNotification(id);

            setNotifications((previous) =>
                previous.filter(
                    (notification) =>
                        notification._id !== id
                )
            );

            if (wasUnread) {
                setUnreadCount((previous) =>
                    Math.max(previous - 1, 0)
                );
            }

        } catch (err) {

            console.error(
                "Failed to delete notification:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to delete notification."
            );

        } finally {

            setActionLoading(null);

        }
    };


    // =========================================
    // DELETE ALL
    // =========================================

    const handleDeleteAll = async () => {

        if (notifications.length === 0) {
            return;
        }

        const confirmed =
            window.confirm(
                "Delete all notifications?"
            );

        if (!confirmed) {
            return;
        }

        try {

            setActionLoading("delete-all");

            await deleteAllNotifications();

            setNotifications([]);
            setUnreadCount(0);

        } catch (err) {

            console.error(
                "Failed to delete notifications:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to delete notifications."
            );

        } finally {

            setActionLoading(null);

        }
    };


    // =========================================
    // FORMAT DATE
    // =========================================

    const formatDate = (date) => {

        if (!date) {
            return "Unknown time";
        }

        const parsedDate =
            new Date(date);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "Unknown time";
        }

        return parsedDate.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };


    // =========================================
    // NOTIFICATION ICON
    // =========================================

    const getNotificationIcon = (type) => {

        switch (type) {

            case "SEAT_AVAILABLE":
                return "🎟️";

            case "JOURNEY_UPDATE":
                return "🚆";

            case "RECOMMENDATION":
                return "✨";

            case "CHART_PREPARED":
                return "📋";

            case "ALERT":
                return "⚠️";

            case "SUCCESS":
                return "✓";

            default:
                return "🔔";
        }
    };


    const getNotificationType =
        (type) => {

            switch (type) {

                case "SEAT_AVAILABLE":
                    return "Seat Availability";

                case "JOURNEY_UPDATE":
                    return "Journey Update";

                case "RECOMMENDATION":
                    return "Recommendation";

                case "CHART_PREPARED":
                    return "Chart Update";

                case "ALERT":
                    return "Important Alert";

                case "SUCCESS":
                    return "Success";

                default:
                    return "System Notification";
            }
        };


    // =========================================
    // LOADING
    // =========================================

    if (loading) {

        return (
            <div className="notifications-page">

                <div className="notifications-state-card">

                    <div className="notifications-state-icon">
                        🔔
                    </div>

                    <span className="notifications-eyebrow">
                        ERJA NOTIFICATION CENTER
                    </span>

                    <h2>
                        Loading Notifications
                    </h2>

                    <p>
                        Checking your latest journey
                        updates and alerts...
                    </p>

                    <div className="notifications-loading-bar">
                        <div />
                    </div>

                </div>

            </div>
        );
    }


    // =========================================
    // MAIN
    // =========================================

    return (
        <div className="notifications-page">

            {/* =================================
                HEADER
            ================================== */}

            <header className="notifications-header">

                <button
                    className="notifications-back-btn"
                    onClick={() =>
                        navigate("/dashboard")
                    }
                >
                    ← Back to Dashboard
                </button>

                <span className="notifications-eyebrow">
                    ERJA NOTIFICATION CENTER
                </span>

                <div className="notifications-title-row">

                    <div>

                        <h1>
                            Notifications
                        </h1>

                        <p>
                            Stay updated with your
                            journey monitoring activity.
                        </p>

                    </div>


                    {unreadCount > 0 && (

                        <div className="unread-counter">

                            <strong>
                                {unreadCount}
                            </strong>

                            <span>
                                Unread
                            </span>

                        </div>

                    )}

                </div>

            </header>


            <main className="notifications-content">


                {/* =================================
                    ERROR
                ================================== */}

                {error && (

                    <div className="notification-alert">

                        <span>
                            ⚠️
                        </span>

                        <p>
                            {error}
                        </p>

                        <button
                            onClick={() =>
                                setError("")
                            }
                        >
                            ×
                        </button>

                    </div>

                )}


                {/* =================================
                    TOOLBAR
                ================================== */}

                <section className="notifications-toolbar">

                    <div className="toolbar-left">

                        <div className="toolbar-icon">
                            🔔
                        </div>

                        <div>

                            <span>
                                ACTIVITY
                            </span>

                            <strong>
                                {notifications.length}{" "}
                                notification
                                {notifications.length !==
                                1
                                    ? "s"
                                    : ""}
                            </strong>

                        </div>

                    </div>


                    <div className="toolbar-actions">

                        <button
                            className="toolbar-btn"
                            onClick={() =>
                                loadNotifications(true)
                            }
                            disabled={refreshing}
                        >
                            {refreshing
                                ? "Refreshing..."
                                : "↻ Refresh"}
                        </button>


                        <button
                            className="toolbar-btn"
                            onClick={
                                handleMarkAllRead
                            }
                            disabled={
                                unreadCount === 0 ||
                                actionLoading === "all"
                            }
                        >
                            ✓ Mark All Read
                        </button>


                        <button
                            className="toolbar-delete-btn"
                            onClick={
                                handleDeleteAll
                            }
                            disabled={
                                notifications.length === 0 ||
                                actionLoading ===
                                    "delete-all"
                            }
                        >
                            🗑 Delete All
                        </button>

                    </div>

                </section>


                {/* =================================
                    EMPTY
                ================================== */}

                {notifications.length === 0 && (

                    <div className="notifications-empty">

                        <div className="empty-bell">
                            🔔
                        </div>

                        <span className="notifications-eyebrow">
                            ALL CLEAR
                        </span>

                        <h2>
                            No Notifications
                        </h2>

                        <p>
                            You're all caught up.
                            ERJA will notify you when
                            there is an important journey
                            update or availability event.
                        </p>

                        <button
                            className="empty-dashboard-btn"
                            onClick={() =>
                                navigate("/dashboard")
                            }
                        >
                            ← Back to Dashboard
                        </button>

                    </div>

                )}


                {/* =================================
                    NOTIFICATION LIST
                ================================== */}

                {notifications.length > 0 && (

                    <section className="notification-list">

                        {notifications.map(
                            (notification) => (

                                <article
                                    key={
                                        notification._id
                                    }
                                    className={`notification-card ${
                                        notification.isRead
                                            ? "read"
                                            : "unread"
                                    }`}
                                >

                                    {/* Unread indicator */}

                                    {!notification.isRead && (
                                        <div className="unread-indicator" />
                                    )}


                                    {/* Icon */}

                                    <div
                                        className={`notification-icon ${
                                            notification.type
                                                ?.toLowerCase()
                                        }`}
                                    >
                                        {getNotificationIcon(
                                            notification.type
                                        )}
                                    </div>


                                    {/* Content */}

                                    <div className="notification-body">

                                        <div className="notification-meta">

                                            <span className="notification-type">
                                                {getNotificationType(
                                                    notification.type
                                                )}
                                            </span>

                                            {!notification.isRead && (
                                                <span className="new-badge">
                                                    NEW
                                                </span>
                                            )}

                                        </div>


                                        <h2>
                                            {notification.title}
                                        </h2>

                                        <p>
                                            {notification.message}
                                        </p>


                                        <div className="notification-footer">

                                            <span>
                                                🕐{" "}
                                                {formatDate(
                                                    notification.createdAt
                                                )}
                                            </span>


                                            {notification.journeyId && (

                                                <button
                                                    className="journey-link"
                                                    onClick={() =>
                                                        navigate(
                                                            `/journey/${notification.journeyId}`
                                                        )
                                                    }
                                                >
                                                    View Journey →
                                                </button>

                                            )}

                                        </div>

                                    </div>


                                    {/* Actions */}

                                    <div className="notification-actions">

                                        {!notification.isRead && (

                                            <button
                                                className="read-btn"
                                                onClick={() =>
                                                    handleMarkRead(
                                                        notification._id
                                                    )
                                                }
                                                disabled={
                                                    actionLoading ===
                                                    notification._id
                                                }
                                            >
                                                {actionLoading ===
                                                notification._id
                                                    ? "..."
                                                    : "✓ Read"}
                                            </button>

                                        )}


                                        <button
                                            className="delete-btn"
                                            onClick={() =>
                                                handleDelete(
                                                    notification._id,
                                                    !notification.isRead
                                                )
                                            }
                                            disabled={
                                                actionLoading ===
                                                `delete-${notification._id}`
                                            }
                                        >
                                            🗑
                                        </button>

                                    </div>

                                </article>

                            )
                        )}

                    </section>

                )}

            </main>

        </div>
    );
}