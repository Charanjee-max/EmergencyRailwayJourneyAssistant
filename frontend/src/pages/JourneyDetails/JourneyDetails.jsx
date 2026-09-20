import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";

import { getJourneyById } from "../../api/journeyAPI";
import { getRecommendations } from "../../api/recommendationAPI";

import "./JourneyDetails.css";


export default function JourneyDetails() {

    const { id } = useParams();
    const navigate = useNavigate();


    // =========================================================
    // STATE
    // =========================================================

    const [journey, setJourney] = useState(null);

    const [recommendations, setRecommendations] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [recommendationLoading, setRecommendationLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [recommendationError, setRecommendationError] =
        useState("");


    // =========================================================
    // LOAD JOURNEY
    // =========================================================

    const loadJourney = useCallback(
        async (isRefresh = false) => {

            if (!id) {

                setError(
                    "Journey ID is missing."
                );

                setLoading(false);

                return;
            }


            try {

                if (isRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError("");


                const response =
                    await getJourneyById(id);


                const data =
                    response?.data?.data;


                if (!data) {

                    throw new Error(
                        "Journey information was not returned by the server."
                    );
                }


                setJourney(data);

            } catch (err) {

                console.error(
                    "Failed to load journey:",
                    err
                );


                setError(
                    err?.response?.data?.message ||
                    err?.message ||
                    "Unable to load journey details."
                );

            } finally {

                setLoading(false);
                setRefreshing(false);
            }

        },
        [id]
    );


    // =========================================================
    // LOAD RECOMMENDATIONS
    // =========================================================

    const loadRecommendations =
        useCallback(
            async () => {

                if (!id) {
                    return;
                }


                try {

                    setRecommendationLoading(
                        true
                    );

                    setRecommendationError("");


                    const response =
                        await getRecommendations(id);


                    const data =
                        response?.data?.data ??
                        response?.data ??
                        [];


                    setRecommendations(
                        Array.isArray(data)
                            ? data
                            : []
                    );

                } catch (err) {

                    console.error(
                        "Failed to load recommendations:",
                        err
                    );


                    setRecommendations([]);


                    setRecommendationError(
                        err?.response?.data?.message ||
                        err?.message ||
                        "Recommendations are not available yet."
                    );

                } finally {

                    setRecommendationLoading(
                        false
                    );
                }

            },
            [id]
        );


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {

        loadJourney();

    }, [loadJourney]);


    useEffect(() => {

        loadRecommendations();

    }, [loadRecommendations]);


    // =========================================================
    // REFRESH
    // =========================================================

    const handleRefresh =
        async () => {

            await Promise.all([
                loadJourney(true),
                loadRecommendations(),
            ]);

        };


    // =========================================================
    // FORMAT DATE
    // =========================================================

    const formatDate =
        (date) => {

            if (!date) {
                return "—";
            }


            const parsedDate =
                new Date(date);


            if (
                Number.isNaN(
                    parsedDate.getTime()
                )
            ) {
                return "—";
            }


            return parsedDate.toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }
            );
        };


    // =========================================================
    // FORMAT DATE TIME
    // =========================================================

    const formatDateTime =
        (date) => {

            if (!date) {
                return "Not available";
            }


            const parsedDate =
                new Date(date);


            if (
                Number.isNaN(
                    parsedDate.getTime()
                )
            ) {
                return "Not available";
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


    // =========================================================
    // FORMAT STRATEGY
    // =========================================================

    const formatStrategy =
        (strategy) => {

            if (!strategy) {
                return "Single Ticket";
            }


            return String(strategy)
                .replaceAll("_", " ")
                .toLowerCase()
                .replace(
                    /\b\w/g,
                    (char) =>
                        char.toUpperCase()
                );
        };


    // =========================================================
    // STATUS
    // =========================================================

    const getStatusClass =
        (status) => {

            return String(
                status || "PENDING"
            )
                .toLowerCase()
                .replaceAll("_", "-");
        };


    const getStatusIcon =
        (status) => {

            switch (status) {

                case "MONITORING":
                    return "📡";

                case "RECOMMENDATION_READY":
                    return "✨";

                case "CHART_PREPARED":
                    return "📋";

                case "COMPLETED":
                    return "✓";

                case "CANCELLED":
                    return "✕";

                default:
                    return "⏳";
            }
        };


    const getStatusText =
        (status) => {

            switch (status) {

                case "MONITORING":
                    return "Monitoring";

                case "RECOMMENDATION_READY":
                    return "Recommendation Ready";

                case "CHART_PREPARED":
                    return "Chart Prepared";

                case "COMPLETED":
                    return "Completed";

                case "CANCELLED":
                    return "Cancelled";

                default:
                    return "Pending";
            }
        };


    // =========================================================
    // ENABLED CLASSES
    // =========================================================

    const enabledClasses =
        useMemo(
            () => {

                return (
                    journey?.allowedClasses?.filter(
                        (item) =>
                            item?.enabled
                    ) || []
                );

            },
            [journey]
        );


    // =========================================================
    // CHART DATA
    // =========================================================

    const chart =
        journey?.chart || {};


    const chartPrepared =
        chart.chartPrepared === true ||
        chart.prepared === true;


    const chartOneDate =
        chart.chartOneDate ||
        null;


    const chartTwoDate =
        chart.chartTwoDate ||
        null;


    const finalChartPrepared =
        Boolean(chartTwoDate);


    // =========================================================
    // RECOMMENDATION DATA
    // =========================================================

    const recommendationCount =
        recommendations.length;


    const topRecommendation =
        recommendations[0] ||
        null;


    const getRecommendationStrategy =
        (recommendation) => {

            if (!recommendation) {
                return "No recommendation";
            }


            return formatStrategy(
                recommendation.strategy ||
                recommendation.type ||
                recommendation.recommendationType
            );
        };


    const getRecommendationScore =
        (recommendation) => {

            if (!recommendation) {
                return "—";
            }


            return (
                recommendation.score ??
                recommendation.confidence ??
                "—"
            );
        };


    const getRecommendationTickets =
        (recommendation) => {

            if (
                !recommendation ||
                !Array.isArray(
                    recommendation.tickets
                )
            ) {
                return 0;
            }


            return recommendation.tickets.length;
        };


    // =========================================================
    // JOURNEY STATE
    // =========================================================

    const isCompleted =
        journey?.status === "COMPLETED";


    const isCancelled =
        journey?.status === "CANCELLED";


    const isActive =
        !isCompleted &&
        !isCancelled;


    // =========================================================
    // LOADING SCREEN
    // =========================================================

    if (loading) {

        return (
            <div className="journey-details-page">

                <Navbar />

                <main className="journey-details-shell">

                    <section className="journey-loading-card">

                        <div className="loading-icon">
                            🚆
                        </div>

                        <span className="page-eyebrow">
                            ERJA JOURNEY MONITOR
                        </span>

                        <h1>
                            Loading Journey
                        </h1>

                        <p>
                            Fetching your journey details
                            and latest railway status.
                        </p>

                        <div className="loading-track">
                            <div className="loading-progress"></div>
                        </div>

                    </section>

                </main>

            </div>
        );
    }


    // =========================================================
    // ERROR SCREEN
    // =========================================================

    if (error || !journey) {

        return (
            <div className="journey-details-page">

                <Navbar />

                <main className="journey-details-shell">

                    <section className="journey-error-card">

                        <div className="error-icon">
                            ⚠️
                        </div>

                        <span className="page-eyebrow">
                            ERJA JOURNEY MONITOR
                        </span>

                        <h1>
                            Journey Not Found
                        </h1>

                        <p>
                            {error ||
                                "The requested journey could not be found."}
                        </p>

                        <div className="error-actions">

                            <button
                                className="primary-button"
                                onClick={() =>
                                    navigate(
                                        "/dashboard"
                                    )
                                }
                            >
                                ← Dashboard
                            </button>

                            <button
                                className="secondary-button"
                                onClick={() =>
                                    loadJourney()
                                }
                            >
                                Try Again
                            </button>

                        </div>

                    </section>

                </main>

            </div>
        );
    }


    // =========================================================
    // MAIN UI
    // =========================================================

    return (
        <div className="journey-details-page">

            <Navbar />


            <main className="journey-details-shell">


                {/* =================================================
                    PAGE HEADER
                ================================================= */}

                <section className="details-hero">

                    <div className="hero-top-row">

                        <button
                            className="back-button"
                            onClick={() =>
                                navigate(
                                    "/dashboard"
                                )
                            }
                        >
                            ← Dashboard
                        </button>


                        <button
                            className="refresh-button"
                            onClick={
                                handleRefresh
                            }
                            disabled={
                                refreshing ||
                                recommendationLoading
                            }
                        >
                            <span>
                                ↻
                            </span>

                            {refreshing ||
                            recommendationLoading
                                ? "Refreshing..."
                                : "Refresh"}
                        </button>

                    </div>


                    <div className="hero-content">

                        <div className="hero-copy">

                            <span className="page-eyebrow">
                                ERJA JOURNEY MONITOR
                            </span>

                            <h1>
                                Journey
                                <span>
                                    Details
                                </span>
                            </h1>

                            <p>
                                Monitor your railway
                                journey, chart preparation,
                                vacancy analysis and
                                ERJA booking strategies.
                            </p>

                        </div>


                        <div
                            className={`hero-status ${getStatusClass(
                                journey.status
                            )}`}
                        >

                            <span className="hero-status-icon">
                                {getStatusIcon(
                                    journey.status
                                )}
                            </span>

                            <div>

                                <small>
                                    CURRENT STATUS
                                </small>

                                <strong>
                                    {getStatusText(
                                        journey.status
                                    )}
                                </strong>

                            </div>

                        </div>

                    </div>

                </section>



                {/* =================================================
                    JOURNEY ROUTE
                ================================================= */}

                <section className="route-hero-card">

                    <div className="route-card-header">

                        <div>

                            <span className="section-eyebrow">
                                TRAIN
                            </span>

                            <div className="train-heading">

                                <strong>
                                    {journey.trainNumber ||
                                        "—"}
                                </strong>

                                <span>
                                    Journey
                                </span>

                            </div>

                        </div>


                        <div className="date-display">

                            <span>
                                JOURNEY DATE
                            </span>

                            <strong>
                                {formatDate(
                                    journey.journeyDate
                                )}
                            </strong>

                        </div>

                    </div>


                    <div className="route-main">

                        <div className="route-station source">

                            <span className="station-caption">
                                FROM
                            </span>

                            <strong>
                                {journey.boardingStation ||
                                    "—"}
                            </strong>

                            <small>
                                Boarding station
                            </small>

                        </div>


                        <div className="route-visual">

                            <div className="route-line-top">

                                <span className="route-dot"></span>

                                <span className="route-line"></span>

                                <span className="route-train-icon">
                                    🚆
                                </span>

                                <span className="route-line"></span>

                                <span className="route-dot"></span>

                            </div>

                            <div className="route-arrow-label">
                                JOURNEY ROUTE
                            </div>

                        </div>


                        <div className="route-station destination">

                            <span className="station-caption">
                                TO
                            </span>

                            <strong>
                                {journey.destinationStation ||
                                    "—"}
                            </strong>

                            <small>
                                Passenger destination
                            </small>

                        </div>

                    </div>

                </section>



                {/* =================================================
                    KPI CARDS
                ================================================= */}

                <section className="details-kpi-grid">

                    <div className="kpi-card">

                        <div className="kpi-icon blue">
                            📡
                        </div>

                        <div className="kpi-content">

                            <span>
                                JOURNEY STATUS
                            </span>

                            <strong>
                                {getStatusText(
                                    journey.status
                                )}
                            </strong>

                            <small>
                                ERJA monitoring state
                            </small>

                        </div>

                    </div>


                    <div className="kpi-card">

                        <div className="kpi-icon green">
                            📋
                        </div>

                        <div className="kpi-content">

                            <span>
                                CHART STATUS
                            </span>

                            <strong>
                                {chartPrepared
                                    ? "Prepared"
                                    : "Waiting"}
                            </strong>

                            <small>
                                IRCTC chart state
                            </small>

                        </div>

                    </div>


                    <div className="kpi-card">

                        <div className="kpi-icon orange">
                            ✨
                        </div>

                        <div className="kpi-content">

                            <span>
                                RECOMMENDATIONS
                            </span>

                            <strong>
                                {recommendationLoading
                                    ? "..."
                                    : recommendationCount}
                            </strong>

                            <small>
                                Available strategies
                            </small>

                        </div>

                    </div>


                    <div className="kpi-card">

                        <div className="kpi-icon purple">
                            🎫
                        </div>

                        <div className="kpi-content">

                            <span>
                                PREFERRED CLASS
                            </span>

                            <strong>
                                {enabledClasses.length > 0
                                    ? enabledClasses
                                          .map(
                                              (item) =>
                                                  item.class
                                          )
                                          .join(", ")
                                    : "Not specified"}
                            </strong>

                            <small>
                                Booking preference
                            </small>

                        </div>

                    </div>

                </section>



                {/* =================================================
                    CHART PREPARATION
                ================================================= */}

                <section className="glass-panel">

                    <div className="panel-header">

                        <div className="panel-title-group">

                            <span className="panel-number">
                                01
                            </span>

                            <div>

                                <span className="section-eyebrow">
                                    IRCTC CHART
                                </span>

                                <h2>
                                    Chart Preparation
                                </h2>

                            </div>

                        </div>


                        <div
                            className={`panel-status ${
                                chartPrepared
                                    ? "success"
                                    : "waiting"
                            }`}
                        >
                            <span></span>

                            {chartPrepared
                                ? "Chart Prepared"
                                : "Waiting"}
                        </div>

                    </div>


                    <div className="chart-timeline">

                        <div
                            className={`timeline-item ${
                                chartOneDate
                                    ? "completed"
                                    : ""
                            }`}
                        >

                            <div className="timeline-marker">

                                {chartOneDate
                                    ? "✓"
                                    : "1"}

                            </div>

                            <div className="timeline-content">

                                <span>
                                    FIRST CHART
                                </span>

                                <strong>
                                    {chartOneDate
                                        ? formatDateTime(
                                              chartOneDate
                                          )
                                        : "Not prepared yet"}
                                </strong>

                                <small>
                                    Initial chart preparation
                                </small>

                            </div>

                        </div>


                        <div className="timeline-connector"></div>


                        <div
                            className={`timeline-item ${
                                finalChartPrepared
                                    ? "completed"
                                    : ""
                            }`}
                        >

                            <div className="timeline-marker">

                                {finalChartPrepared
                                    ? "✓"
                                    : "2"}

                            </div>

                            <div className="timeline-content">

                                <span>
                                    SECOND / FINAL CHART
                                </span>

                                <strong>
                                    {chartTwoDate
                                        ? formatDateTime(
                                              chartTwoDate
                                          )
                                        : "Not prepared yet"}
                                </strong>

                                <small>
                                    Final chart information
                                </small>

                            </div>

                        </div>

                    </div>


                    <div className="info-strip">

                        <span>
                            ℹ
                        </span>

                        <p>
                            ERJA uses the chart preparation
                            state to determine when vacancy
                            analysis should begin.
                        </p>

                    </div>

                </section>



                {/* =================================================
                    TWO COLUMN INFORMATION
                ================================================= */}

                <section className="details-two-column">


                    {/* =================================================
                        BOOKING PREFERENCES
                    ================================================= */}

                    <div className="glass-panel">

                        <div className="panel-header">

                            <div className="panel-title-group">

                                <span className="panel-number">
                                    02
                                </span>

                                <div>

                                    <span className="section-eyebrow">
                                        CONFIGURATION
                                    </span>

                                    <h2>
                                        Booking Preferences
                                    </h2>

                                </div>

                            </div>

                        </div>


                        <div className="preference-list">

                            <div className="preference-item">

                                <div className="preference-label">
                                    <span>
                                        Preferred Class
                                    </span>

                                    <small>
                                        Selected booking class
                                    </small>
                                </div>

                                <div className="class-badges">

                                    {enabledClasses.length >
                                    0 ? (

                                        enabledClasses.map(
                                            (item) => (

                                                <span
                                                    className="class-badge"
                                                    key={
                                                        item.class
                                                    }
                                                >
                                                    {item.class}
                                                </span>

                                            )
                                        )

                                    ) : (

                                        <strong>
                                            Not specified
                                        </strong>

                                    )}

                                </div>

                            </div>


                            <div className="preference-item">

                                <div className="preference-label">

                                    <span>
                                        Mixed Class
                                    </span>

                                    <small>
                                        Allow different classes
                                    </small>

                                </div>

                                <strong
                                    className={
                                        journey.allowMixedClass
                                            ? "value-positive"
                                            : "value-muted"
                                    }
                                >
                                    {journey.allowMixedClass
                                        ? "✓ Allowed"
                                        : "✕ Not Allowed"}
                                </strong>

                            </div>


                            <div className="preference-item">

                                <div className="preference-label">

                                    <span>
                                        Preferred Strategy
                                    </span>

                                    <small>
                                        Journey optimization
                                    </small>

                                </div>

                                <strong>
                                    {formatStrategy(
                                        journey.preferredStrategy
                                    )}
                                </strong>

                            </div>


                            <div className="preference-item">

                                <div className="preference-label">

                                    <span>
                                        Journey Created
                                    </span>

                                    <small>
                                        ERJA registration time
                                    </small>

                                </div>

                                <strong>
                                    {formatDateTime(
                                        journey.createdAt
                                    )}
                                </strong>

                            </div>

                        </div>

                    </div>



                    {/* =================================================
                        MONITORING STATE
                    ================================================= */}

                    <div className="glass-panel">

                        <div className="panel-header">

                            <div className="panel-title-group">

                                <span className="panel-number">
                                    03
                                </span>

                                <div>

                                    <span className="section-eyebrow">
                                        ERJA MONITORING
                                    </span>

                                    <h2>
                                        Monitoring State
                                    </h2>

                                </div>

                            </div>

                        </div>


                        <div
                            className={`monitoring-card ${
                                isActive
                                    ? "active"
                                    : isCompleted
                                    ? "completed"
                                    : "cancelled"
                            }`}
                        >

                            <div className="monitoring-icon">

                                {isCompleted
                                    ? "✓"
                                    : isCancelled
                                    ? "✕"
                                    : "📡"}

                            </div>


                            <div>

                                <strong>
                                    {isCompleted
                                        ? "Journey completed"
                                        : isCancelled
                                        ? "Journey cancelled"
                                        : "Journey monitoring active"}
                                </strong>

                                <p>
                                    Last monitoring check
                                </p>

                                <span>
                                    {formatDateTime(
                                        journey.lastCheckedAt
                                    )}
                                </span>

                            </div>

                        </div>


                        <div className="info-strip">

                            <span>
                                ℹ
                            </span>

                            <p>
                                Vacancy analysis is performed
                                through the IRCTC chart workflow
                                after chart preparation.
                            </p>

                        </div>

                    </div>

                </section>



                {/* =================================================
                    RECOMMENDATION
                ================================================= */}

                <section className="recommendation-panel">

                    <div className="recommendation-header">

                        <div>

                            <span className="section-eyebrow">
                                ERJA OPTIMIZATION
                            </span>

                            <h2>
                                Booking Recommendation
                            </h2>

                            <p>
                                Practical booking strategies
                                generated from the latest
                                railway availability data.
                            </p>

                        </div>


                        <div className="recommendation-count">

                            {recommendationLoading
                                ? "Checking..."
                                : `${recommendationCount} Available`}

                        </div>

                    </div>


                    {recommendationLoading ? (

                        <div className="recommendation-empty">

                            <div className="empty-icon">
                                🔎
                            </div>

                            <h3>
                                Checking recommendations
                            </h3>

                            <p>
                                ERJA is checking the latest
                                recommendation data.
                            </p>

                        </div>

                    ) : topRecommendation ? (

                        <div className="recommendation-highlight">

                            <div className="recommendation-icon">
                                ✨
                            </div>


                            <div className="recommendation-details">

                                <span>
                                    TOP AVAILABLE STRATEGY
                                </span>

                                <h3>
                                    {getRecommendationStrategy(
                                        topRecommendation
                                    )}
                                </h3>

                                <p>
                                    {topRecommendation.reason ||
                                        "ERJA generated this booking strategy using the latest available chart data."}
                                </p>


                                <div className="recommendation-stats">

                                    <div>

                                        <span>
                                            SCORE
                                        </span>

                                        <strong>
                                            {getRecommendationScore(
                                                topRecommendation
                                            )}
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            TICKETS
                                        </span>

                                        <strong>
                                            {getRecommendationTickets(
                                                topRecommendation
                                            )}
                                        </strong>

                                    </div>

                                </div>

                            </div>


                            <button
                                className="view-recommendation-button"
                                onClick={() =>
                                    navigate(
                                        `/recommendation/${id}`
                                    )
                                }
                            >
                                View Recommendations
                                <span>
                                    →
                                </span>
                            </button>

                        </div>

                    ) : (

                        <div className="recommendation-empty">

                            <div className="empty-icon">
                                {chartPrepared
                                    ? "🔎"
                                    : "⏳"}
                            </div>

                            <h3>
                                {chartPrepared
                                    ? "No recommendation available"
                                    : "Waiting for chart preparation"}
                            </h3>

                            <p>
                                {recommendationError ||
                                    (chartPrepared
                                        ? "IRCTC has not returned a usable vacancy combination for this journey yet."
                                        : "ERJA will analyze vacancy after the required IRCTC chart is prepared.")}
                            </p>

                        </div>

                    )}

                </section>



                {/* =================================================
                    AVAILABILITY NOTICE
                ================================================= */}

                <section className="availability-notice">

                    <div className="notice-icon">
                        ⚠️
                    </div>

                    <div>

                        <strong>
                            Availability can change at any time
                        </strong>

                        <p>
                            Recommended berths may become
                            unavailable or be booked by another
                            passenger before you complete your
                            reservation. Always verify the latest
                            availability before booking.
                        </p>

                    </div>

                </section>



                {/* =================================================
                    COMPLETED JOURNEY
                ================================================= */}

                {isCompleted && (

                    <section className="completion-panel">

                        <div className="completion-icon">
                            ✓
                        </div>

                        <div>

                            <span>
                                JOURNEY COMPLETED
                            </span>

                            <h2>
                                Train reached its final station
                            </h2>

                            <p>
                                {journey.finalStationCode
                                    ? `${journey.finalStationCode}${
                                          journey.finalStationName
                                              ? ` — ${journey.finalStationName}`
                                              : ""
                                      }`
                                    : "Final station information recorded by ERJA."}
                            </p>

                            <small>
                                Completed at:{" "}
                                {formatDateTime(
                                    journey.completedAt
                                )}
                            </small>

                        </div>

                    </section>

                )}



                {/* =================================================
                    BOTTOM ACTIONS
                ================================================= */}

                <section className="journey-actions">

                    <button
                        className="primary-action-card"
                        onClick={() =>
                            navigate(
                                `/recommendation/${id}`
                            )
                        }
                    >

                        <span className="action-icon">
                            ✨
                        </span>

                        <div>

                            <strong>
                                View Recommendations
                            </strong>

                            <small>
                                Explore ERJA booking strategies
                            </small>

                        </div>

                        <span className="action-arrow">
                            →
                        </span>

                    </button>


                    <button
                        className="secondary-action-card"
                        onClick={() =>
                            navigate(
                                "/journeys"
                            )
                        }
                    >

                        <span>
                            🚆
                        </span>

                        View All Journeys

                    </button>

                </section>


                {/* =================================================
                    FOOTER
                ================================================= */}

                <footer className="journey-details-footer">

                    <span className="footer-live">

                        <i></i>

                        ERJA monitoring system active

                    </span>


                    <span>
                        Emergency Railway Journey Assistant
                    </span>

                </footer>


            </main>

        </div>
    );
}