import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";

import "./Dashboard.css";

import Navbar from "../../components/Navbar/Navbar";

import { getJourneys } from "../../api/journeyAPI";
import { getRecommendations } from "../../api/recommendationAPI";
import { getNotifications } from "../../api/notificationAPI";


function Dashboard() {

    const navigate = useNavigate();


    // =========================================================
    // STATE
    // =========================================================

    const [journeys, setJourneys] = useState([]);

    const [latestRecommendation, setLatestRecommendation] =
        useState(null);

    const [recommendationTotal, setRecommendationTotal] =
        useState(0);

    const [notifications, setNotifications] =
        useState([]);

    const [unreadCount, setUnreadCount] =
        useState(0);

    const [loading, setLoading] =
        useState(true);

    const [recommendationLoading, setRecommendationLoading] =
        useState(false);

    const [notificationLoading, setNotificationLoading] =
        useState(false);

    const [error, setError] =
        useState("");


    // =========================================================
    // LOAD DASHBOARD
    // =========================================================

    const loadDashboard = useCallback(
        async () => {

            setLoading(true);
            setError("");

            try {

                const [
                    journeyResponse,
                    notificationResponse,
                ] = await Promise.all([
                    getJourneys(),
                    getNotifications(10),
                ]);


                const journeyData =
                    journeyResponse?.data?.data || [];


                const notificationData =
                    notificationResponse?.data?.data || [];


                const notificationUnread =
                    notificationResponse?.data?.unreadCount || 0;


                setJourneys(
                    Array.isArray(journeyData)
                        ? journeyData
                        : []
                );


                setNotifications(
                    Array.isArray(notificationData)
                        ? notificationData
                        : []
                );


                setUnreadCount(
                    Number(notificationUnread) || 0
                );


                if (journeyData.length > 0) {

                    await loadLatestRecommendation(
                        journeyData
                    );

                } else {

                    setLatestRecommendation(null);
                    setRecommendationTotal(0);

                }

            } catch (err) {

                console.error(
                    "Failed to load dashboard:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                    "Unable to load dashboard data."
                );

            } finally {

                setLoading(false);

            }

        },
        []
    );


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {

        loadDashboard();

    }, [loadDashboard]);


    // =========================================================
    // PERIODIC DASHBOARD REFRESH
    // =========================================================

    useEffect(() => {

        const interval =
            setInterval(
                () => {
                    loadDashboard();
                },
                30000
            );


        return () => {
            clearInterval(interval);
        };

    }, [loadDashboard]);


    // =========================================================
    // LOAD RECOMMENDATIONS
    // =========================================================

    const loadLatestRecommendation = async (
        journeyData
    ) => {

        setRecommendationLoading(true);

        try {

            const results =
                await Promise.allSettled(
                    journeyData.map(
                        (journey) =>
                            getRecommendations(
                                journey._id
                            )
                    )
                );


            const allRecommendations = [];


            results.forEach(
                (result, index) => {

                    if (
                        result.status !==
                        "fulfilled"
                    ) {
                        return;
                    }


                    const data =
                        result.value?.data?.data;


                    if (!data) {
                        return;
                    }


                    const journey =
                        journeyData[index];


                    if (
                        Array.isArray(data)
                    ) {

                        data.forEach(
                            (recommendation) => {

                                allRecommendations.push({
                                    ...recommendation,

                                    journeyId:
                                        journey._id,

                                    journeyDate:
                                        journey.journeyDate,

                                    trainNumber:
                                        journey.trainNumber,

                                    boardingStation:
                                        journey.boardingStation,

                                    destinationStation:
                                        journey.destinationStation,
                                });

                            }
                        );

                    } else {

                        allRecommendations.push({
                            ...data,

                            journeyId:
                                journey._id,

                            journeyDate:
                                journey.journeyDate,

                            trainNumber:
                                journey.trainNumber,

                            boardingStation:
                                journey.boardingStation,

                            destinationStation:
                                journey.destinationStation,
                        });

                    }

                }
            );


            setRecommendationTotal(
                allRecommendations.length
            );


            if (
                allRecommendations.length === 0
            ) {

                setLatestRecommendation(null);

                return;
            }


            allRecommendations.sort(
                (a, b) => {

                    const dateA =
                        new Date(
                            a.analyzedAt ||
                            a.createdAt ||
                            a.updatedAt ||
                            a.journeyDate ||
                            0
                        );


                    const dateB =
                        new Date(
                            b.analyzedAt ||
                            b.createdAt ||
                            b.updatedAt ||
                            b.journeyDate ||
                            0
                        );


                    return dateB - dateA;

                }
            );


            setLatestRecommendation(
                allRecommendations[0]
            );

        } catch (err) {

            console.error(
                "Failed to load recommendations:",
                err
            );

            setLatestRecommendation(null);
            setRecommendationTotal(0);

        } finally {

            setRecommendationLoading(false);

        }

    };


    // =========================================================
    // REFRESH NOTIFICATIONS ONLY
    // =========================================================

    const refreshNotifications = async () => {

        setNotificationLoading(true);

        try {

            const response =
                await getNotifications(10);


            setNotifications(
                response?.data?.data || []
            );


            setUnreadCount(
                response?.data?.unreadCount || 0
            );

        } catch (err) {

            console.error(
                "Failed to refresh notifications:",
                err
            );

        } finally {

            setNotificationLoading(false);

        }

    };


    // =========================================================
    // HELPERS
    // =========================================================

    const getRecommendationName = (
        recommendation
    ) => {

        if (!recommendation) {
            return "No recommendation";
        }


        const strategy =
            recommendation.strategy ||
            recommendation.type ||
            recommendation.recommendationType;


        if (!strategy) {
            return "Recommendation Available";
        }


        return String(strategy)
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(
                /\b\w/g,
                (char) => char.toUpperCase()
            );

    };


    const getCoach = (
        recommendation
    ) => {

        if (
            recommendation?.tickets &&
            recommendation.tickets.length > 0
        ) {

            return (
                recommendation.tickets[0]?.coach ||
                recommendation.tickets[0]?.coachCode ||
                "-"
            );

        }


        return (
            recommendation?.coach ||
            recommendation?.coachCode ||
            "-"
        );

    };


    const getRecommendationSegments = (
        recommendation
    ) => {

        if (
            !recommendation
        ) {
            return 0;
        }


        if (
            Array.isArray(
                recommendation.tickets
            )
        ) {

            return recommendation.tickets.length;

        }


        return 0;

    };


    const getJourneyStatus = (
        journey
    ) => {

        const status =
            String(
                journey?.status ||
                "PENDING"
            ).toUpperCase();


        switch (status) {

            case "MONITORING":
                return "Monitoring";

            case "CHART_PREPARED":
                return "Chart Prepared";

            case "RECOMMENDATION_READY":
                return "Recommendation Ready";

            case "COMPLETED":
                return "Completed";

            case "CANCELLED":
                return "Cancelled";

            case "ACTIVE":
                return "Active";

            default:
                return "Pending";

        }

    };


    const getStatusClass = (
        journey
    ) => {

        const status =
            String(
                journey?.status ||
                "PENDING"
            ).toUpperCase();


        if (
            status === "COMPLETED"
        ) {
            return "status completed";
        }


        if (
            status === "CANCELLED"
        ) {
            return "status cancelled";
        }


        if (
            status ===
                "RECOMMENDATION_READY" ||
            status ===
                "CHART_PREPARED"
        ) {
            return "status ready";
        }


        if (
            status === "MONITORING" ||
            status === "ACTIVE"
        ) {
            return "status monitoring";
        }


        return "status pending";

    };


    const formatDate = (
        date
    ) => {

        if (!date) {
            return "-";
        }


        const parsed =
            new Date(date);


        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {
            return "-";
        }


        return parsed.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );

    };


    const formatNotificationTime = (
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
                hour: "2-digit",
                minute: "2-digit",
            }
        );

    };


    const getNotificationIcon = (
        type
    ) => {

        switch (
            String(type || "").toUpperCase()
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


    const getNotificationClass = (
        notification
    ) => {

        if (
            !notification?.isRead
        ) {
            return "notification-item unread";
        }


        return "notification-item";

    };


    // =========================================================
    // COUNTS
    // =========================================================

    const monitoringCount =
        useMemo(
            () =>
                journeys.filter(
                    (journey) => {

                        const status =
                            String(
                                journey.status ||
                                ""
                            ).toUpperCase();


                        return (
                            status === "PENDING" ||
                            status === "ACTIVE" ||
                            status === "MONITORING" ||
                            status ===
                                "CHART_PREPARED" ||
                            status ===
                                "RECOMMENDATION_READY"
                        );

                    }
                ).length,
            [journeys]
        );


    const completedCount =
        useMemo(
            () =>
                journeys.filter(
                    (journey) =>
                        String(
                            journey.status || ""
                        ).toUpperCase() ===
                        "COMPLETED"
                ).length,
            [journeys]
        );


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (

            <>

                <Navbar />

                <main className="dashboard">

                    <section className="dashboard-loading">

                        <div className="loading-orbit">

                            <div className="loading-train">
                                🚆
                            </div>

                        </div>

                        <h2>
                            Preparing your
                            control center
                        </h2>

                        <p>
                            Fetching journeys,
                            availability and
                            notifications...
                        </p>

                    </section>

                </main>

            </>

        );

    }


    // =========================================================
    // DASHBOARD
    // =========================================================

    return (

        <>

            <Navbar />


            <main className="dashboard">

                {/* =================================================
                    HERO
                ================================================= */}

                <section className="dashboard-hero">

                    <div className="hero-content">

                        <div className="hero-badge">

                            <span className="live-dot"></span>

                            ERJA CONTROL CENTER

                        </div>


                        <h1>
                            Emergency Railway
                            <span>
                                Journey Assistant
                            </span>
                        </h1>


                        <p className="hero-subtitle">

                            Monitor your railway
                            journeys, analyze
                            availability, and discover
                            practical booking strategies.

                        </p>


                        <div className="hero-actions">

                            <button
                                className="primary-action"
                                onClick={() =>
                                    navigate(
                                        "/add-journey"
                                    )
                                }
                            >

                                <span className="button-icon">
                                    +
                                </span>

                                Add New Journey

                                <span className="button-arrow">
                                    →
                                </span>

                            </button>


                            <button
                                className="secondary-action"
                                onClick={() =>
                                    navigate(
                                        "/journeys"
                                    )
                                }
                            >
                                View My Journeys
                            </button>

                        </div>

                    </div>


                    <div className="hero-visual">

                        <div className="rail-glow"></div>

                        <div className="rail-circle">

                            <div className="rail-circle-inner">

                                <span>
                                    🚆
                                </span>

                            </div>

                        </div>


                        <div className="route-line">

                            <span className="station-node">
                                ERJA
                            </span>

                            <div className="route-track">

                                <span className="moving-train">
                                    🚆
                                </span>

                            </div>

                            <span className="station-node">
                                LIVE
                            </span>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <div className="dashboard-error">

                        <span>
                            ⚠️
                        </span>

                        {error}

                        <button
                            onClick={
                                loadDashboard
                            }
                        >
                            Retry
                        </button>

                    </div>

                )}


                {/* =================================================
                    STATISTICS
                ================================================= */}

                <section className="stats-grid">

                    <div className="stat-card stat-blue">

                        <div className="stat-icon">
                            🚆
                        </div>

                        <div className="stat-content">

                            <span>
                                TOTAL JOURNEYS
                            </span>

                            <strong>
                                {journeys.length}
                            </strong>

                            <small>
                                All tracked journeys
                            </small>

                        </div>

                    </div>


                    <div className="stat-card stat-green">

                        <div className="stat-icon">
                            ◉
                        </div>

                        <div className="stat-content">

                            <span>
                                MONITORING
                            </span>

                            <strong>
                                {monitoringCount}
                            </strong>

                            <small>
                                Currently active
                            </small>

                        </div>

                    </div>


                    <div className="stat-card stat-orange">

                        <div className="stat-icon">
                            ✦
                        </div>

                        <div className="stat-content">

                            <span>
                                RECOMMENDATIONS
                            </span>

                            <strong>
                                {recommendationTotal}
                            </strong>

                            <small>
                                Available strategies
                            </small>

                        </div>

                    </div>


                    <div
                        className="stat-card stat-purple notification-stat-card"
                        onClick={() =>
                            navigate(
                                "/notifications"
                            )
                        }
                    >

                        <div className="stat-icon">
                            🔔
                        </div>

                        <div className="stat-content">

                            <span>
                                NOTIFICATIONS
                            </span>

                            <strong>
                                {unreadCount}
                            </strong>

                            <small>
                                Unread alerts
                            </small>

                        </div>

                        {unreadCount > 0 && (
                            <span className="stat-alert-dot"></span>
                        )}

                    </div>

                </section>


                {/* =================================================
                    MAIN CONTENT
                ================================================= */}

                <section className="dashboard-grid">


                    {/* =================================================
                        JOURNEYS
                    ================================================= */}

                    <div className="dashboard-card journeys-card">

                        <div className="card-heading">

                            <div>

                                <span className="card-kicker">
                                    YOUR TRAVEL
                                </span>

                                <h2>
                                    My Journeys
                                </h2>

                            </div>


                            <button
                                className="text-action"
                                onClick={() =>
                                    navigate(
                                        "/journeys"
                                    )
                                }
                            >
                                View All
                                <span>→</span>
                            </button>

                        </div>


                        {journeys.length === 0 ? (

                            <div className="empty-state">

                                <div className="empty-illustration">
                                    🚆
                                </div>

                                <h3>
                                    No journeys yet
                                </h3>

                                <p>
                                    Add your first journey
                                    and let ERJA monitor
                                    railway availability
                                    for you.
                                </p>

                                <button
                                    className="empty-action"
                                    onClick={() =>
                                        navigate(
                                            "/add-journey"
                                        )
                                    }
                                >
                                    Add Your First Journey
                                    →
                                </button>

                            </div>

                        ) : (

                            <div className="journey-list">

                                {journeys
                                    .slice(0, 5)
                                    .map(
                                        (journey) => (

                                            <div
                                                className="journey-row"
                                                key={
                                                    journey._id
                                                }
                                            >

                                                <div className="train-icon-box">
                                                    🚆
                                                </div>


                                                <div className="journey-main">

                                                    <div className="train-number">
                                                        Train{" "}
                                                        {
                                                            journey.trainNumber
                                                        }
                                                    </div>


                                                    <div className="journey-route">

                                                        <strong>
                                                            {
                                                                journey.boardingStation
                                                            }
                                                        </strong>

                                                        <div className="route-connector">

                                                            <span></span>
                                                            <span></span>
                                                            <span></span>

                                                            <b>
                                                                →
                                                            </b>

                                                        </div>

                                                        <strong>
                                                            {
                                                                journey.destinationStation
                                                            }
                                                        </strong>

                                                    </div>


                                                    <div className="journey-date">

                                                        {formatDate(
                                                            journey.journeyDate
                                                        )}

                                                    </div>

                                                </div>


                                                <div className="journey-status">

                                                    <span
                                                        className={
                                                            getStatusClass(
                                                                journey
                                                            )
                                                        }
                                                    >

                                                        <i></i>

                                                        {
                                                            getJourneyStatus(
                                                                journey
                                                            )
                                                        }

                                                    </span>

                                                </div>


                                                <button
                                                    className="journey-view"
                                                    onClick={() =>
                                                        navigate(
                                                            `/recommendation/${journey._id}`
                                                        )
                                                    }
                                                >
                                                    View
                                                </button>

                                            </div>

                                        )
                                    )}

                            </div>

                        )}

                    </div>


                    {/* =================================================
                        NOTIFICATIONS
                    ================================================= */}

                    <div className="dashboard-card notifications-card">

                        <div className="card-heading">

                            <div>

                                <span className="card-kicker">
                                    LIVE UPDATES
                                </span>

                                <h2>
                                    Notifications
                                </h2>

                            </div>


                            <button
                                className="text-action"
                                onClick={() =>
                                    navigate(
                                        "/notifications"
                                    )
                                }
                            >
                                View All
                                <span>→</span>
                            </button>

                        </div>


                        {notificationLoading ? (

                            <div className="notificationLoading">
                                Checking latest alerts...
                            </div>

                        ) : notifications.length === 0 ? (

                            <div className="empty-notifications">

                                <div className="notification-empty-icon">
                                    🔔
                                </div>

                                <h3>
                                    No notifications
                                </h3>

                                <p>
                                    ERJA will notify you when
                                    your journey status or
                                    railway availability changes.
                                </p>

                            </div>

                        ) : (

                            <div className="notification-list">

                                {notifications
                                    .slice(0, 4)
                                    .map(
                                        (notification) => (

                                            <div
                                                key={
                                                    notification._id
                                                }
                                                className={
                                                    getNotificationClass(
                                                        notification
                                                    )
                                                }
                                                onClick={() =>
                                                    navigate(
                                                        "/notifications"
                                                    )
                                                }
                                            >

                                                <div className="notification-icon">

                                                    {getNotificationIcon(
                                                        notification.type
                                                    )}

                                                </div>


                                                <div className="notification-content">

                                                    <strong>
                                                        {
                                                            notification.title ||
                                                            "ERJA Notification"
                                                        }
                                                    </strong>

                                                    <p>
                                                        {
                                                            notification.message ||
                                                            "A journey update is available."
                                                        }
                                                    </p>

                                                    <span>
                                                        {
                                                            formatNotificationTime(
                                                                notification.createdAt
                                                            )
                                                        }
                                                    </span>

                                                </div>


                                                {!notification.isRead && (
                                                    <span className="unread-dot"></span>
                                                )}

                                            </div>

                                        )
                                    )}

                            </div>

                        )}


                        <button
                            className="notification-refresh"
                            onClick={
                                refreshNotifications
                            }
                        >
                            ↻ Refresh notifications
                        </button>

                    </div>


                    {/* =================================================
                        RECOMMENDATION
                    ================================================= */}

                    <div className="dashboard-card recommendation-card">

                        <div className="card-heading">

                            <div>

                                <span className="card-kicker">
                                    ERJA INTELLIGENCE
                                </span>

                                <h2>
                                    Latest Recommendation
                                </h2>

                            </div>

                            <div className="ai-badge">
                                ERJA
                            </div>

                        </div>


                        {recommendationLoading ? (

                            <div className="recommendation-loading">

                                <div className="ai-loader">

                                    <span></span>
                                    <span></span>
                                    <span></span>

                                </div>

                                <h3>
                                    Analyzing journey
                                </h3>

                                <p>
                                    Checking available
                                    booking strategies...
                                </p>

                            </div>

                        ) : latestRecommendation ? (

                            <div className="recommendation-content">

                                <div className="recommendation-hero">

                                    <div className="recommendation-check">
                                        ✓
                                    </div>

                                    <div>

                                        <span>
                                            CURRENT STRATEGY
                                        </span>

                                        <h3>
                                            {
                                                getRecommendationName(
                                                    latestRecommendation
                                                )
                                            }
                                        </h3>

                                    </div>

                                </div>


                                <div className="recommendation-route">

                                    <div>

                                        <small>
                                            TRAIN
                                        </small>

                                        <strong>
                                            {
                                                latestRecommendation.trainNumber ||
                                                "-"
                                            }
                                        </strong>

                                    </div>


                                    <div className="recommendation-arrow">
                                        →
                                    </div>


                                    <div>

                                        <small>
                                            ROUTE
                                        </small>

                                        <strong>
                                            {
                                                latestRecommendation.boardingStation ||
                                                "-"
                                            }
                                            {" "}
                                            →
                                            {" "}
                                            {
                                                latestRecommendation.destinationStation ||
                                                "-"
                                            }
                                        </strong>

                                    </div>

                                </div>


                                <div className="recommendation-stats">

                                    <div>

                                        <span>
                                            SEGMENTS
                                        </span>

                                        <strong>
                                            {
                                                getRecommendationSegments(
                                                    latestRecommendation
                                                )
                                            }
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            COACH
                                        </span>

                                        <strong>
                                            {
                                                getCoach(
                                                    latestRecommendation
                                                )
                                            }
                                        </strong>

                                    </div>

                                </div>


                                <button
                                    className="recommendation-action"
                                    onClick={() =>
                                        navigate(
                                            `/recommendation/${latestRecommendation.journeyId}`
                                        )
                                    }
                                >

                                    View Full Recommendation

                                    <span>
                                        →
                                    </span>

                                </button>

                            </div>

                        ) : (

                            <div className="empty-recommendation">

                                <div className="recommendation-empty-icon">
                                    ✦
                                </div>

                                <h3>
                                    Waiting for analysis
                                </h3>

                                <p>
                                    Once ERJA analyzes
                                    your journey, the
                                    available booking
                                    strategy will appear here.
                                </p>


                                {journeys.length === 0 && (

                                    <button
                                        className="empty-action"
                                        onClick={() =>
                                            navigate(
                                                "/add-journey"
                                            )
                                        }
                                    >
                                        Start a Journey
                                        →
                                    </button>

                                )}

                            </div>

                        )}

                    </div>

                </section>


                {/* =================================================
                    CHART PREPARED NOTICE
                ================================================= */}

                {notifications.some(
                    (notification) =>
                        String(
                            notification.type || ""
                        ).toUpperCase() ===
                        "CHART_UPDATE"
                ) && (

                    <section className="chart-prepared-banner">

                        <div className="chart-banner-icon">
                            📋
                        </div>

                        <div className="chart-banner-content">

                            <strong>
                                Chart preparation update received
                            </strong>

                            <p>
                                ERJA has detected a chart status
                                update for one of your monitored
                                journeys. Open notifications to
                                see the details.
                            </p>

                        </div>

                        <button
                            onClick={() =>
                                navigate(
                                    "/notifications"
                                )
                            }
                        >
                            Open
                            <span>→</span>
                        </button>

                    </section>

                )}


                {/* =================================================
                    AVAILABILITY WARNING
                ================================================= */}

                <section className="availability-warning">

                    <div className="warning-icon">
                        ⚠
                    </div>

                    <div>

                        <strong>
                            Availability can change at any time
                        </strong>

                        <p>
                            Recommended berths may become
                            unavailable or be booked by another
                            passenger before you complete
                            your booking.
                        </p>

                    </div>

                </section>


                {/* =================================================
                    FOOTER
                ================================================= */}

                <div className="dashboard-footer">

                    <span className="footer-status">

                        <i></i>

                        ERJA monitoring system active

                    </span>

                    <span>
                        Last dashboard refresh:
                        {" "}
                        {new Date().toLocaleTimeString(
                            "en-IN",
                            {
                                hour: "2-digit",
                                minute: "2-digit",
                            }
                        )}
                    </span>

                </div>

            </main>

        </>

    );

}


export default Dashboard;