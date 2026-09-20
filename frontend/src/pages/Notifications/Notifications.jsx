import {
    useCallback,
    useEffect,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";

import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    deleteAllNotifications,
} from "../../api/notificationAPI";

import "./Notifications.css";


function Notifications() {

    const navigate = useNavigate();


    // =========================================================
    // STATE
    // =========================================================

    const [notifications, setNotifications] =
        useState([]);

    const [unreadCount, setUnreadCount] =
        useState(0);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [actionLoading, setActionLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [filter, setFilter] =
        useState("ALL");


    // =========================================================
    // LOAD NOTIFICATIONS
    // =========================================================

    const loadNotifications = useCallback(
        async (
            showLoader = true
        ) => {

            try {

                if (showLoader) {
                    setLoading(true);
                } else {
                    setRefreshing(true);
                }

                setError("");


                const response =
                    await getNotifications(50);


                const data =
                    response?.data?.data || [];


                const count =
                    response?.data?.unreadCount || 0;


                setNotifications(
                    Array.isArray(data)
                        ? data
                        : []
                );


                setUnreadCount(
                    Number(count) || 0
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


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {

        loadNotifications();

    }, [loadNotifications]);


    // =========================================================
    // AUTO REFRESH
    // =========================================================

    useEffect(() => {

        const interval =
            setInterval(
                () => {
                    loadNotifications(false);
                },
                30000
            );


        return () => {
            clearInterval(interval);
        };

    }, [loadNotifications]);


    // =========================================================
    // MARK ONE AS READ
    // =========================================================

    const handleMarkAsRead = async (
        notification
    ) => {

        if (
            notification.isRead
        ) {
            return;
        }


        try {

            await markNotificationAsRead(
                notification._id
            );


            setNotifications(
                (current) =>
                    current.map(
                        (item) =>
                            item._id ===
                            notification._id
                                ? {
                                      ...item,
                                      isRead: true,
                                  }
                                : item
                    )
            );


            setUnreadCount(
                (current) =>
                    Math.max(
                        0,
                        current - 1
                    )
            );

        } catch (err) {

            console.error(
                "Failed to mark notification as read:",
                err
            );

        }

    };


    // =========================================================
    // MARK ALL AS READ
    // =========================================================

    const handleMarkAllAsRead =
        async () => {

            if (
                unreadCount === 0
            ) {
                return;
            }


            try {

                setActionLoading(true);


                await markAllNotificationsAsRead();


                setNotifications(
                    (current) =>
                        current.map(
                            (notification) => ({
                                ...notification,
                                isRead: true,
                            })
                        )
                );


                setUnreadCount(0);

            } catch (err) {

                console.error(
                    "Failed to mark all notifications as read:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                    "Unable to mark notifications as read."
                );

            } finally {

                setActionLoading(false);

            }

        };


    // =========================================================
    // DELETE ONE
    // =========================================================

    const handleDelete = async (
        notificationId
    ) => {

        try {

            setActionLoading(true);


            const target =
                notifications.find(
                    (notification) =>
                        notification._id ===
                        notificationId
                );


            await deleteNotification(
                notificationId
            );


            setNotifications(
                (current) =>
                    current.filter(
                        (notification) =>
                            notification._id !==
                            notificationId
                    )
            );


            if (
                target &&
                !target.isRead
            ) {

                setUnreadCount(
                    (current) =>
                        Math.max(
                            0,
                            current - 1
                        )
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

            setActionLoading(false);

        }

    };


    // =========================================================
    // DELETE ALL
    // =========================================================

    const handleDeleteAll =
        async () => {

            if (
                notifications.length === 0
            ) {
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

                setActionLoading(true);


                await deleteAllNotifications();


                setNotifications([]);
                setUnreadCount(0);

            } catch (err) {

                console.error(
                    "Failed to delete all notifications:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                    "Unable to delete notifications."
                );

            } finally {

                setActionLoading(false);

            }

        };


    // =========================================================
    // NOTIFICATION HELPERS
    // =========================================================

    const getNotificationIcon = (
        type
    ) => {

        switch (
            String(
                type || ""
            ).toUpperCase()
        ) {

            case "CHART_UPDATE":
                return "📋";

            case "SEAT_AVAILABLE":
                return "🎟️";

            case "JOURNEY_UPDATE":
                return "🚆";

            case "SYSTEM":
                return "⚙️";

            default:
                return "🔔";

        }

    };


    const getNotificationTypeName = (
        type
    ) => {

        switch (
            String(
                type || ""
            ).toUpperCase()
        ) {

            case "CHART_UPDATE":
                return "Chart Update";

            case "SEAT_AVAILABLE":
                return "Seat Available";

            case "JOURNEY_UPDATE":
                return "Journey Update";

            case "SYSTEM":
                return "System";

            default:
                return "Notification";

        }

    };


    const getNotificationClass = (
        notification
    ) => {

        const type =
            String(
                notification.type || ""
            ).toLowerCase();


        if (
            type === "chart_update"
        ) {
            return "notificationTypeChart";
        }


        if (
            type === "seat_available"
        ) {
            return "notificationTypeSeat";
        }


        if (
            type === "journey_update"
        ) {
            return "notificationTypeJourney";
        }


        return "notificationTypeSystem";

    };


    const formatTime = (
        date
    ) => {

        if (!date) {
            return "";
        }


        const parsed =
            new Date(date);


        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {
            return "";
        }


        return parsed.toLocaleString(
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


    const filteredNotifications =
        notifications.filter(
            (notification) => {

                if (
                    filter === "UNREAD"
                ) {
                    return !notification.isRead;
                }


                if (
                    filter === "CHART"
                ) {
                    return (
                        String(
                            notification.type ||
                            ""
                        ).toUpperCase() ===
                        "CHART_UPDATE"
                    );
                }


                if (
                    filter === "SEATS"
                ) {
                    return (
                        String(
                            notification.type ||
                            ""
                        ).toUpperCase() ===
                        "SEAT_AVAILABLE"
                    );
                }


                return true;

            }
        );


    // =========================================================
    // NOTIFICATION CLICK
    // =========================================================

    const handleNotificationClick =
        async (
            notification
        ) => {

            await handleMarkAsRead(
                notification
            );


            if (
                notification.journeyId
            ) {

                navigate(
                    `/recommendation/${notification.journeyId}`
                );

            }

        };


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (

            <>

                <Navbar />

                <main className="notificationsPage">

                    <section className="notificationsLoading">

                        <div className="notificationsLoader">
                            🔔
                        </div>

                        <h1>
                            Loading notifications
                        </h1>

                        <p>
                            Checking your latest ERJA
                            journey updates...
                        </p>

                    </section>

                </main>

            </>

        );

    }


    // =========================================================
    // PAGE
    // =========================================================

    return (

        <>

            <Navbar />


            <main className="notificationsPage">

                {/* =================================================
                    HEADER
                ================================================= */}

                <header className="notificationsHeader">

                    <div>

                        <button
                            className="notificationBackButton"
                            onClick={() =>
                                navigate(
                                    "/dashboard"
                                )
                            }
                        >
                            ← Dashboard
                        </button>


                        <div className="notificationEyebrow">
                            ERJA ALERT CENTER
                        </div>


                        <h1>
                            Notifications
                        </h1>


                        <p>
                            Stay updated on chart preparation,
                            seat availability and journey status.
                        </p>

                    </div>


                    <div className="notificationHeaderActions">

                        <button
                            className="notificationRefreshButton"
                            onClick={() =>
                                loadNotifications(
                                    false
                                )
                            }
                            disabled={
                                refreshing
                            }
                        >
                            {refreshing
                                ? "Refreshing..."
                                : "↻ Refresh"}
                        </button>


                        <button
                            className="markAllButton"
                            onClick={
                                handleMarkAllAsRead
                            }
                            disabled={
                                unreadCount === 0 ||
                                actionLoading
                            }
                        >
                            ✓ Mark all read
                        </button>

                    </div>

                </header>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <div className="notificationError">

                        <span>
                            ⚠️
                        </span>

                        <p>
                            {error}
                        </p>

                        <button
                            onClick={() =>
                                loadNotifications()
                            }
                        >
                            Retry
                        </button>

                    </div>

                )}


                {/* =================================================
                    SUMMARY
                ================================================= */}

                <section className="notificationSummary">

                    <div className="notificationSummaryMain">

                        <div className="notificationSummaryIcon">
                            🔔
                        </div>

                        <div>

                            <span>
                                ALERT STATUS
                            </span>

                            <strong>
                                {unreadCount > 0
                                    ? `${unreadCount} unread ${
                                          unreadCount === 1
                                              ? "notification"
                                              : "notifications"
                                      }`
                                    : "All notifications read"}
                            </strong>

                        </div>

                    </div>


                    <div className="notificationSummaryStats">

                        <div>

                            <strong>
                                {notifications.length}
                            </strong>

                            <span>
                                Total
                            </span>

                        </div>


                        <div>

                            <strong>
                                {unreadCount}
                            </strong>

                            <span>
                                Unread
                            </span>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    FILTERS
                ================================================= */}

                <div className="notificationFilters">

                    <button
                        className={
                            filter === "ALL"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setFilter("ALL")
                        }
                    >
                        All
                        <span>
                            {notifications.length}
                        </span>
                    </button>


                    <button
                        className={
                            filter === "UNREAD"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setFilter("UNREAD")
                        }
                    >
                        Unread
                        <span>
                            {unreadCount}
                        </span>
                    </button>


                    <button
                        className={
                            filter === "CHART"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setFilter("CHART")
                        }
                    >
                        Chart
                    </button>


                    <button
                        className={
                            filter === "SEATS"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setFilter("SEATS")
                        }
                    >
                        Seats
                    </button>

                </div>


                {/* =================================================
                    NOTIFICATION LIST
                ================================================= */}

                <section className="notificationPanel">

                    <div className="notificationPanelHeader">

                        <div>

                            <span>
                                LIVE UPDATES
                            </span>

                            <h2>
                                {filter === "ALL"
                                    ? "All notifications"
                                    : filter === "UNREAD"
                                    ? "Unread notifications"
                                    : filter === "CHART"
                                    ? "Chart notifications"
                                    : "Seat availability notifications"}
                            </h2>

                        </div>


                        {notifications.length > 0 && (

                            <button
                                className="deleteAllButton"
                                onClick={
                                    handleDeleteAll
                                }
                                disabled={
                                    actionLoading
                                }
                            >
                                Delete all
                            </button>

                        )}

                    </div>


                    {filteredNotifications.length === 0 ? (

                        <div className="notificationsEmpty">

                            <div className="notificationsEmptyIcon">
                                {filter === "UNREAD"
                                    ? "✓"
                                    : "🔔"}
                            </div>

                            <h3>
                                {filter === "UNREAD"
                                    ? "You're all caught up"
                                    : "No notifications found"}
                            </h3>

                            <p>
                                {filter === "UNREAD"
                                    ? "There are no unread ERJA alerts right now."
                                    : "New journey and railway availability updates will appear here."}
                            </p>

                        </div>

                    ) : (

                        <div className="notificationsList">

                            {filteredNotifications.map(
                                (notification) => (

                                    <article
                                        key={
                                            notification._id
                                        }
                                        className={`notificationCard ${
                                            notification.isRead
                                                ? "read"
                                                : "unread"
                                        }`}
                                    >

                                        {/* =================================
                                            ICON
                                        ================================= */}

                                        <button
                                            className={`notificationTypeIcon ${getNotificationClass(
                                                notification
                                            )}`}
                                            onClick={() =>
                                                handleNotificationClick(
                                                    notification
                                                )
                                            }
                                        >
                                            {getNotificationIcon(
                                                notification.type
                                            )}
                                        </button>


                                        {/* =================================
                                            CONTENT
                                        ================================= */}

                                        <div
                                            className="notificationCardContent"
                                            onClick={() =>
                                                handleNotificationClick(
                                                    notification
                                                )
                                            }
                                        >

                                            <div className="notificationCardTop">

                                                <div className="notificationTitleArea">

                                                    {!notification.isRead && (
                                                        <span className="newBadge">
                                                            NEW
                                                        </span>
                                                    )}

                                                    <span className="notificationTypeLabel">
                                                        {
                                                            getNotificationTypeName(
                                                                notification.type
                                                            )
                                                        }
                                                    </span>

                                                </div>


                                                <time>
                                                    {formatTime(
                                                        notification.createdAt
                                                    )}
                                                </time>

                                            </div>


                                            <h3>
                                                {
                                                    notification.title ||
                                                    "ERJA Notification"
                                                }
                                            </h3>


                                            <p>
                                                {
                                                    notification.message ||
                                                    "A new journey update is available."
                                                }
                                            </p>


                                            {notification.journeyId && (

                                                <div className="notificationJourneyTag">

                                                    <span>
                                                        Journey update
                                                    </span>

                                                    <b>
                                                        View journey →
                                                    </b>

                                                </div>

                                            )}

                                        </div>


                                        {/* =================================
                                            ACTIONS
                                        ================================= */}

                                        <div className="notificationActions">

                                            {!notification.isRead && (

                                                <button
                                                    title="Mark as read"
                                                    onClick={() =>
                                                        handleMarkAsRead(
                                                            notification
                                                        )
                                                    }
                                                    disabled={
                                                        actionLoading
                                                    }
                                                >
                                                    ✓
                                                </button>

                                            )}


                                            <button
                                                title="Delete"
                                                onClick={() =>
                                                    handleDelete(
                                                        notification._id
                                                    )
                                                }
                                                disabled={
                                                    actionLoading
                                                }
                                            >
                                                ×
                                            </button>

                                        </div>

                                    </article>

                                )
                            )}

                        </div>

                    )}

                </section>


                {/* =================================================
                    FOOTER NOTE
                ================================================= */}

                <div className="notificationsFooter">

                    <span>
                        <i></i>
                        ERJA notification service active
                    </span>

                    <span>
                        Automatically refreshed every 30 seconds
                    </span>

                </div>

            </main>

        </>

    );

}


export default Notifications;