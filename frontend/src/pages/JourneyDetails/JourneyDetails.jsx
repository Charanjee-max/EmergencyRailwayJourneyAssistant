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

import { getJourneyById } from "../../api/journeyAPI";
import { getRecommendations } from "../../api/recommendationAPI";

import "./JourneyDetails.css";

export default function JourneyDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [journey, setJourney] = useState(null);
    const [recommendations, setRecommendations] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [recommendationLoading, setRecommendationLoading] =
        useState(false);

    const [error, setError] = useState("");
    const [recommendationError, setRecommendationError] =
        useState("");

    // =========================================================
    // LOAD JOURNEY
    // =========================================================

    const loadJourney = useCallback(
        async (isRefresh = false) => {
            if (!id) {
                setError("Journey ID is missing.");
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
                    err.response?.data?.message ||
                    err.message ||
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
        useCallback(async () => {
            if (!id) {
                return;
            }

            try {
                setRecommendationLoading(true);
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

                /*
                 * Recommendation data may legitimately be
                 * unavailable before the chart is prepared.
                 * Therefore this should not make the entire
                 * Journey Details page fail.
                 */
                setRecommendationError(
                    err.response?.data?.message ||
                    err.message ||
                    "Recommendations are not available yet."
                );
            } finally {
                setRecommendationLoading(false);
            }
        }, [id]);

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
    // REFRESH EVERYTHING
    // =========================================================

    const handleRefresh = async () => {
        await Promise.all([
            loadJourney(true),
            loadRecommendations(),
        ]);
    };

    // =========================================================
    // DATE FORMATTERS
    // =========================================================

    const formatDate = (date) => {
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

    const formatDateTime = (date) => {
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
    // STRATEGY
    // =========================================================

    const formatStrategy = (strategy) => {
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

    const getStatusClass = (status) => {
        return (
            String(status || "PENDING")
                .toLowerCase()
                .replaceAll("_", "-")
        );
    };

    const getStatusIcon = (status) => {
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

    const getStatusText = (status) => {
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

    const enabledClasses = useMemo(() => {
        return (
            journey?.allowedClasses?.filter(
                (item) => item?.enabled
            ) || []
        );
    }, [journey]);

    // =========================================================
    // CHART INFORMATION
    // =========================================================

    const chart = journey?.chart || {};

    const chartPrepared =
        chart.chartPrepared === true ||
        chart.prepared === true;

    const chartOneDate =
        chart.chartOneDate || null;

    const chartTwoDate =
        chart.chartTwoDate || null;

    /*
     * If chartTwoDate exists, the second/final chart
     * has been prepared according to the data currently
     * exposed by the backend.
     */
    const finalChartPrepared =
        Boolean(chartTwoDate);

    // =========================================================
    // RECOMMENDATION INFORMATION
    // =========================================================

    const recommendationCount =
        recommendations.length;

    const topRecommendation =
        recommendations[0] || null;

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
        journey.status === "COMPLETED";

    const isCancelled =
        journey.status === "CANCELLED";

    const isActive =
        !isCompleted &&
        !isCancelled;

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="journey-details-page">

                <div className="journey-state-card">

                    <div className="journey-state-icon">
                        🚆
                    </div>

                    <div className="details-page-label">
                        ERJA JOURNEY MONITOR
                    </div>

                    <h2>
                        Loading Journey
                    </h2>

                    <p>
                        Fetching your journey details...
                    </p>

                    <div className="details-loading-bar">
                        <div></div>
                    </div>

                </div>

            </div>
        );
    }

    // =========================================================
    // ERROR
    // =========================================================

    if (error || !journey) {
        return (
            <div className="journey-details-page">

                <div className="journey-state-card">

                    <div className="journey-state-icon">
                        ⚠️
                    </div>

                    <div className="details-page-label">
                        ERJA JOURNEY MONITOR
                    </div>

                    <h2>
                        Journey Not Found
                    </h2>

                    <p>
                        {error ||
                            "The requested journey could not be found."}
                    </p>

                    <div className="journey-state-actions">

                        <button
                            className="primary-details-btn"
                            onClick={() =>
                                navigate("/dashboard")
                            }
                        >
                            ← Back to Dashboard
                        </button>

                        <button
                            className="secondary-action"
                            onClick={() =>
                                loadJourney()
                            }
                        >
                            Try Again
                        </button>

                    </div>

                </div>

            </div>
        );
    }

    return (
        <div className="journey-details-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="journey-details-header">

                <div className="details-header-actions">

                    <button
                        className="details-back-btn"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                    >
                        ← Back to Dashboard
                    </button>

                    <button
                        className="refresh-details-btn"
                        onClick={handleRefresh}
                        disabled={
                            refreshing ||
                            recommendationLoading
                        }
                    >
                        {refreshing ||
                        recommendationLoading
                            ? "Refreshing..."
                            : "↻ Refresh"}
                    </button>

                </div>

                <div className="details-page-label">
                    ERJA JOURNEY MONITOR
                </div>

                <div className="details-heading-row">

                    <div>

                        <h1>
                            Journey Details
                        </h1>

                        <p>
                            Monitor your railway journey,
                            chart preparation and ERJA
                            booking recommendations.
                        </p>

                    </div>

                    <div
                        className={`journey-status-badge ${getStatusClass(
                            journey.status
                        )}`}
                    >

                        <span className="status-dot">
                            {getStatusIcon(
                                journey.status
                            )}
                        </span>

                        {getStatusText(
                            journey.status
                        )}

                    </div>

                </div>

            </header>

            {/* =================================================
                MAIN
            ================================================= */}

            <main className="journey-details-content">

                {/* =================================================
                    ROUTE CARD
                ================================================= */}

                <section className="route-card">

                    <div className="route-card-top">

                        <div>

                            <span className="card-eyebrow">
                                TRAIN NUMBER
                            </span>

                            <strong className="train-number">
                                {journey.trainNumber ||
                                    "—"}
                            </strong>

                        </div>

                        <div className="journey-date-box">

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

                    <div className="route-display">

                        <div className="station">

                            <span className="station-label">
                                FROM
                            </span>

                            <strong>
                                {journey.boardingStation ||
                                    "—"}
                            </strong>

                            <small>
                                Boarding Station
                            </small>

                        </div>

                        <div className="route-line">

                            <div className="route-node"></div>

                            <div className="route-track"></div>

                            <span className="route-train">
                                🚆
                            </span>

                            <div className="route-track"></div>

                            <div className="route-node"></div>

                        </div>

                        <div className="station destination">

                            <span className="station-label">
                                TO
                            </span>

                            <strong>
                                {journey.destinationStation ||
                                    "—"}
                            </strong>

                            <small>
                                Passenger Destination
                            </small>

                        </div>

                    </div>

                </section>

                {/* =================================================
                    TOP INFORMATION
                ================================================= */}

                <section className="details-grid">

                    <div className="info-card">

                        <div className="info-icon blue">
                            📡
                        </div>

                        <div>

                            <span>
                                Journey Status
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

                    <div className="info-card">

                        <div className="info-icon green">
                            📋
                        </div>

                        <div>

                            <span>
                                Chart Status
                            </span>

                            <strong>
                                {chartPrepared
                                    ? "Prepared"
                                    : "Waiting"}
                            </strong>

                            <small>
                                IRCTC chart status
                            </small>

                        </div>

                    </div>

                    <div className="info-card">

                        <div className="info-icon orange">
                            ✨
                        </div>

                        <div>

                            <span>
                                Recommendations
                            </span>

                            <strong>
                                {recommendationLoading
                                    ? "Checking..."
                                    : recommendationCount}
                            </strong>

                            <small>
                                Active ERJA strategies
                            </small>

                        </div>

                    </div>

                </section>

                {/* =================================================
                    CHART STATUS
                ================================================= */}

                <section className="details-panel chart-status-panel">

                    <div className="panel-heading">

                        <div className="panel-number">
                            01
                        </div>

                        <div>

                            <span>
                                IRCTC CHART
                            </span>

                            <h2>
                                Chart Preparation
                            </h2>

                        </div>

                    </div>

                    <div className="chart-timeline">

                        <div
                            className={`chart-step ${
                                chartOneDate
                                    ? "completed-step"
                                    : ""
                            }`}
                        >

                            <div className="chart-step-icon">
                                {chartOneDate
                                    ? "✓"
                                    : "1"}
                            </div>

                            <div>

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

                        <div className="chart-timeline-line"></div>

                        <div
                            className={`chart-step ${
                                finalChartPrepared
                                    ? "completed-step"
                                    : ""
                            }`}
                        >

                            <div className="chart-step-icon">
                                {finalChartPrepared
                                    ? "✓"
                                    : "2"}
                            </div>

                            <div>

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

                    <div className="chart-source-note">

                        <span>
                            ℹ️
                        </span>

                        <p>
                            ERJA uses the expected chart
                            window to decide when to query
                            IRCTC. The actual preparation
                            status shown here comes from
                            IRCTC chart data.
                        </p>

                    </div>

                </section>

                {/* =================================================
                    TWO COLUMN DETAILS
                ================================================= */}

                <div className="details-two-column">

                    {/* =================================================
                        BOOKING CONFIGURATION
                    ================================================= */}

                    <section className="details-panel">

                        <div className="panel-heading">

                            <div className="panel-number">
                                02
                            </div>

                            <div>

                                <span>
                                    JOURNEY CONFIGURATION
                                </span>

                                <h2>
                                    Booking Preferences
                                </h2>

                            </div>

                        </div>

                        <div className="preference-list">

                            <div className="preference-row">

                                <span>
                                    Preferred Class
                                </span>

                                <div className="class-list">

                                    {enabledClasses.length >
                                    0 ? (
                                        enabledClasses.map(
                                            (item) => (
                                                <span
                                                    className="details-class-badge"
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

                            <div className="preference-row">

                                <span>
                                    Mixed Class
                                </span>

                                <strong
                                    className={
                                        journey.allowMixedClass
                                            ? "enabled-text"
                                            : "disabled-text"
                                    }
                                >
                                    {journey.allowMixedClass
                                        ? "✓ Allowed"
                                        : "✕ Not Allowed"}
                                </strong>

                            </div>

                            <div className="preference-row">

                                <span>
                                    Preferred Strategy
                                </span>

                                <strong>
                                    {formatStrategy(
                                        journey.preferredStrategy
                                    )}
                                </strong>

                            </div>

                            <div className="preference-row">

                                <span>
                                    Journey Created
                                </span>

                                <strong>
                                    {formatDateTime(
                                        journey.createdAt
                                    )}
                                </strong>

                            </div>

                        </div>

                    </section>

                    {/* =================================================
                        MONITORING
                    ================================================= */}

                    <section className="details-panel">

                        <div className="panel-heading">

                            <div className="panel-number">
                                03
                            </div>

                            <div>

                                <span>
                                    ERJA MONITORING
                                </span>

                                <h2>
                                    Monitoring State
                                </h2>

                            </div>

                        </div>

                        <div
                            className={`monitor-box ${
                                isActive
                                    ? "has-monitor-data"
                                    : ""
                            }`}
                        >

                            <div className="monitor-status-icon">
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
                                    Last monitoring check:{" "}
                                    {formatDateTime(
                                        journey.lastCheckedAt
                                    )}
                                </p>

                            </div>

                        </div>

                        <div className="monitor-note">

                            <span>
                                ℹ️
                            </span>

                            <p>
                                ERJA does not use RailRadar
                                seat availability for this
                                workflow. Vacancy analysis
                                is performed from the IRCTC
                                chart workflow after chart
                                preparation.
                            </p>

                        </div>

                    </section>

                </div>

                {/* =================================================
                    RECOMMENDATION SUMMARY
                ================================================= */}

                <section className="recommendation-summary-panel">

                    <div className="recommendation-summary-header">

                        <div>

                            <span>
                                ERJA OPTIMIZATION
                            </span>

                            <h2>
                                Booking Recommendation
                            </h2>

                        </div>

                        <div className="recommendation-count-badge">
                            {recommendationLoading
                                ? "Checking"
                                : `${recommendationCount} Available`}
                        </div>

                    </div>

                    {recommendationLoading ? (

                        <div className="recommendation-empty">

                            <div className="recommendation-empty-icon">
                                🔎
                            </div>

                            <strong>
                                Checking recommendations...
                            </strong>

                            <p>
                                ERJA is checking the latest
                                recommendation data.
                            </p>

                        </div>

                    ) : topRecommendation ? (

                        <div className="recommendation-highlight">

                            <div className="recommendation-main-icon">
                                ✨
                            </div>

                            <div className="recommendation-main-content">

                                <span>
                                    TOP STRATEGY
                                </span>

                                <h3>
                                    {getRecommendationStrategy(
                                        topRecommendation
                                    )}
                                </h3>

                                <p>
                                    {topRecommendation.reason ||
                                        "ERJA has generated a booking strategy based on the available chart data."}
                                </p>

                                <div className="recommendation-meta">

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
                                className="recommendation-view-btn"
                                onClick={() =>
                                    navigate(
                                        `/recommendation/${id}`
                                    )
                                }
                            >
                                View All
                                <span>→</span>
                            </button>

                        </div>

                    ) : (

                        <div className="recommendation-empty">

                            <div className="recommendation-empty-icon">
                                {chartPrepared
                                    ? "🔎"
                                    : "⏳"}
                            </div>

                            <strong>
                                {chartPrepared
                                    ? "No recommendation available"
                                    : "Waiting for chart preparation"}
                            </strong>

                            <p>
                                {recommendationError ||
                                    (chartPrepared
                                        ? "IRCTC has not returned a usable vacancy combination for this journey yet."
                                        : "ERJA will analyze vacancy only after the required IRCTC chart is prepared.")}
                            </p>

                        </div>

                    )}

                </section>

                {/* =================================================
                    AVAILABILITY WARNING
                ================================================= */}

                <section className="availability-warning">

                    <div className="availability-warning-icon">
                        ⚠️
                    </div>

                    <div>

                        <strong>
                            Important availability notice
                        </strong>

                        <p>
                            Berth availability may change at
                            any time. Recommended berths may
                            become unavailable or be booked by
                            other passengers before you complete
                            your booking.
                        </p>

                    </div>

                </section>

                {/* =================================================
                    COMPLETION INFORMATION
                ================================================= */}

                {isCompleted && (
                    <section className="completion-card">

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
                    ACTIONS
                ================================================= */}

                <section className="journey-actions">

                    <button
                        className="recommendation-action"
                        onClick={() =>
                            navigate(
                                `/recommendation/${id}`
                            )
                        }
                    >

                        <span>
                            ✨
                        </span>

                        <div>

                            <strong>
                                View Recommendations
                            </strong>

                            <small>
                                See ERJA's booking strategies
                            </small>

                        </div>

                        <b>
                            →
                        </b>

                    </button>

                    <button
                        className="secondary-action"
                        onClick={() =>
                            navigate("/journeys")
                        }
                    >
                        View All Journeys
                    </button>

                </section>

            </main>

        </div>
    );
}