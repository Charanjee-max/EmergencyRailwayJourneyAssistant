import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getJourneyById } from "../../api/journeyAPI";
import "./JourneyDetails.css";

export default function JourneyDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [journey, setJourney] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

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

                const response = await getJourneyById(id);

                const data = response?.data?.data;

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

    useEffect(() => {
        loadJourney();
    }, [loadJourney]);


    // =========================================
    // HELPERS
    // =========================================

    const formatDate = (date) => {
        if (!date) return "—";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
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
            return "Not checked yet";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "Not checked yet";
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


    const formatStrategy = (strategy) => {
        if (!strategy) {
            return "Single Ticket";
        }

        return strategy
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, (char) =>
                char.toUpperCase()
            );
    };


    const getStatusClass = (status) => {
        return (
            status
                ?.toLowerCase()
                .replaceAll("_", "-") ||
            "pending"
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


    // =========================================
    // ENABLED CLASSES
    // =========================================

    const enabledClasses = useMemo(() => {
        return (
            journey?.allowedClasses?.filter(
                (item) => item?.enabled
            ) || []
        );
    }, [journey]);


    // =========================================
    // LOADING
    // =========================================

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


    // =========================================
    // ERROR
    // =========================================

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

            {/* =====================================
                HEADER
            ====================================== */}

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
                        onClick={() =>
                            loadJourney(true)
                        }
                        disabled={refreshing}
                    >
                        {refreshing
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
                            Monitor the status,
                            availability and configuration
                            of your railway journey.
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


            {/* =====================================
                MAIN
            ====================================== */}

            <main className="journey-details-content">


                {/* =================================
                    ROUTE CARD
                ================================== */}

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
                                Destination
                            </small>

                        </div>

                    </div>

                </section>


                {/* =================================
                    MONITORING OVERVIEW
                ================================== */}

                <section className="details-grid">

                    <div className="info-card">

                        <div className="info-icon blue">
                            📡
                        </div>

                        <div>

                            <span>
                                Monitoring Status
                            </span>

                            <strong>
                                {getStatusText(
                                    journey.status
                                )}
                            </strong>

                            <small>
                                ERJA journey monitoring
                            </small>

                        </div>

                    </div>


                    <div className="info-card">

                        <div className="info-icon green">
                            🎟️
                        </div>

                        <div>

                            <span>
                                Available Seats
                            </span>

                            <strong>
                                {journey.lastAvailableSeats ??
                                    "—"}
                            </strong>

                            <small>
                                Last monitored availability
                            </small>

                        </div>

                    </div>


                    <div className="info-card">

                        <div className="info-icon orange">
                            🔎
                        </div>

                        <div>

                            <span>
                                Seat Status
                            </span>

                            <strong>
                                {journey.lastSeatStatus ||
                                    "Not checked"}
                            </strong>

                            <small>
                                Current monitored status
                            </small>

                        </div>

                    </div>

                </section>


                {/* =================================
                    TWO COLUMN DETAILS
                ================================== */}

                <div className="details-two-column">


                    {/* ==============================
                        BOOKING PREFERENCES
                    =============================== */}

                    <section className="details-panel">

                        <div className="panel-heading">

                            <div className="panel-number">
                                01
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
                                                    key={item.class}
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
                                    {formatDate(
                                        journey.createdAt
                                    )}
                                </strong>

                            </div>

                        </div>

                    </section>


                    {/* ==============================
                        MONITORING
                    =============================== */}

                    <section className="details-panel">

                        <div className="panel-heading">

                            <div className="panel-number">
                                02
                            </div>

                            <div>

                                <span>
                                    MONITORING
                                </span>

                                <h2>
                                    Latest Check
                                </h2>

                            </div>

                        </div>


                        <div
                            className={`monitor-box ${
                                journey.lastSeatStatus
                                    ? "has-monitor-data"
                                    : ""
                            }`}
                        >

                            <div className="monitor-status-icon">
                                {journey.lastSeatStatus
                                    ? "✓"
                                    : "⏳"}
                            </div>

                            <div>

                                <strong>
                                    {journey.lastSeatStatus ||
                                        "Waiting for first check"}
                                </strong>

                                <p>
                                    Last checked:{" "}
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
                                ERJA continuously monitors
                                your journey and analyzes
                                availability to find suitable
                                booking possibilities.
                            </p>

                        </div>

                    </section>

                </div>


                {/* =================================
                    ACTIONS
                ================================== */}

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
                                See ERJA's best booking
                                strategies
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