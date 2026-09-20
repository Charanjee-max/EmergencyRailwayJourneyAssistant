import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";

import {
    getJourneys,
    deleteJourney,
} from "../../api/journeyAPI";

import "./Journeys.css";

export default function Journeys() {
    const navigate = useNavigate();

    const [journeys, setJourneys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    // =========================================================
    // LOAD JOURNEYS
    // =========================================================

    const loadJourneys = useCallback(
        async (isRefresh = false) => {
            try {
                if (isRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError("");

                const response = await getJourneys();

                const data =
                    response?.data?.data || [];

                setJourneys(
                    Array.isArray(data)
                        ? data
                        : []
                );
            } catch (err) {
                console.error(
                    "Failed to load journeys:",
                    err
                );

                setError(
                    err?.response?.data?.message ||
                    err?.message ||
                    "Unable to load journeys."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );

    useEffect(() => {
        loadJourneys();
    }, [loadJourneys]);

    // =========================================================
    // FORMAT DATE
    // =========================================================

    const formatDate = (date) => {
        if (!date) {
            return "—";
        }

        const parsed = new Date(date);

        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {
            return "—";
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

    const formatDateTime = (date) => {
        if (!date) {
            return "Not available";
        }

        const parsed = new Date(date);

        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {
            return "Not available";
        }

        return parsed.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            }
        );
    };

    // =========================================================
    // STATUS
    // =========================================================

    const getStatusText = (status) => {
        switch (
            String(
                status || "PENDING"
            ).toUpperCase()
        ) {
            case "MONITORING":
            case "ACTIVE":
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

    const getStatusClass = (status) => {
        const normalized =
            String(
                status || "PENDING"
            )
                .toLowerCase()
                .replaceAll(
                    "_",
                    "-"
                );

        if (
            normalized === "active"
        ) {
            return "monitoring";
        }

        return normalized;
    };

    const getStatusIcon = (status) => {
        switch (
            String(
                status || "PENDING"
            ).toUpperCase()
        ) {
            case "MONITORING":
            case "ACTIVE":
                return "◉";

            case "RECOMMENDATION_READY":
                return "✦";

            case "CHART_PREPARED":
                return "✓";

            case "COMPLETED":
                return "✓";

            case "CANCELLED":
                return "×";

            default:
                return "◷";
        }
    };

    // =========================================================
    // CHART
    // =========================================================

    const isChartPrepared = (journey) => {
        return (
            journey?.chart?.chartPrepared === true ||
            journey?.chart?.prepared === true
        );
    };

    const getExpectedFirstChart = (journey) => {
        return (
            journey?.chart
                ?.expectedFirstChartTime ||
            journey?.chart
                ?.firstChartTime ||
            null
        );
    };

    const getExpectedFinalChart = (journey) => {
        return (
            journey?.chart
                ?.expectedFinalChartTime ||
            journey?.chart
                ?.finalChartTime ||
            null
        );
    };

    // =========================================================
    // CLASSES
    // =========================================================

    const getClasses = (journey) => {
        const enabled =
            journey?.allowedClasses
                ?.filter(
                    (item) =>
                        item?.enabled
                )
                .map(
                    (item) =>
                        item?.class
                )
                .filter(Boolean);

        if (
            enabled &&
            enabled.length
        ) {
            return enabled.join(", ");
        }

        return "Not specified";
    };

    // =========================================================
    // ROUTE
    // =========================================================

    const getBoardingStation = (
        journey
    ) => {
        return (
            journey?.boardingStation ||
            journey?.source ||
            journey?.from ||
            "—"
        );
    };

    const getDestinationStation = (
        journey
    ) => {
        return (
            journey?.destinationStation ||
            journey?.destination ||
            journey?.to ||
            "—"
        );
    };

    // =========================================================
    // TRAIN
    // =========================================================

    const getTrainNumber = (
        journey
    ) => {
        return (
            journey?.trainNumber ||
            journey?.trainNo ||
            "—"
        );
    };

    const getTrainName = (
        journey
    ) => {
        return (
            journey?.trainName ||
            journey?.train?.trainName ||
            journey?.train?.name ||
            "Railway Journey"
        );
    };

    // =========================================================
    // SUMMARY
    // =========================================================

    const summary = useMemo(() => {
        const total =
            journeys.length;

        const monitoring =
            journeys.filter(
                (journey) => {
                    const status =
                        String(
                            journey?.status ||
                            ""
                        ).toUpperCase();

                    return (
                        status === "PENDING" ||
                        status === "ACTIVE" ||
                        status === "MONITORING"
                    );
                }
            ).length;

        const prepared =
            journeys.filter(
                (journey) =>
                    isChartPrepared(
                        journey
                    )
            ).length;

        const recommendations =
            journeys.filter(
                (journey) =>
                    String(
                        journey?.status ||
                        ""
                    ).toUpperCase() ===
                    "RECOMMENDATION_READY"
            ).length;

        const completed =
            journeys.filter(
                (journey) =>
                    String(
                        journey?.status ||
                        ""
                    ).toUpperCase() ===
                    "COMPLETED"
            ).length;

        return {
            total,
            monitoring,
            prepared,
            recommendations,
            completed,
        };
    }, [journeys]);

    // =========================================================
    // DELETE
    // =========================================================

    const handleDelete = async (
        journeyId
    ) => {
        const confirmed =
            window.confirm(
                "Are you sure you want to delete this journey?"
            );

        if (!confirmed) {
            return;
        }

        try {
            await deleteJourney(
                journeyId
            );

            setJourneys(
                (previous) =>
                    previous.filter(
                        (journey) =>
                            journey?._id !==
                            journeyId
                    )
            );
        } catch (err) {
            console.error(
                "Failed to delete journey:",
                err
            );

            window.alert(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to delete journey."
            );
        }
    };

    // =========================================================
    // VIEW JOURNEY
    // =========================================================

    const handleViewJourney = (
        journeyId
    ) => {
        navigate(
            `/journey/${journeyId}`
        );
    };

    // =========================================================
    // VIEW RECOMMENDATION
    // =========================================================

    const handleRecommendation = (
        journeyId
    ) => {
        navigate(
            `/recommendation/${journeyId}`
        );
    };

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <>
                <Navbar />

                <main className="journeys-page">

                    <section className="journeys-loading-card">

                        <div className="journeys-loading-orbit">
                            <div>
                                🚆
                            </div>
                        </div>

                        <div className="journeys-loading-label">
                            ERJA JOURNEY CENTER
                        </div>

                        <h1>
                            Loading your journeys
                        </h1>

                        <p>
                            Fetching your monitored
                            railway journeys and
                            current chart status.
                        </p>

                        <div className="journeys-loading-line">
                            <span />
                        </div>

                    </section>

                </main>
            </>
        );
    }

    // =========================================================
    // MAIN UI
    // =========================================================

    return (
        <>
            <Navbar />

            <main className="journeys-page">

                {/* =================================================
                    HERO
                ================================================= */}

                <section className="journeys-hero">

                    <div className="journeys-hero-copy">

                        <div className="journeys-eyebrow">
                            <span />
                            ERJA JOURNEY CENTER
                        </div>

                        <h1>
                            My
                            <span>
                                Journeys
                            </span>
                        </h1>

                        <p>
                            Keep every monitored railway
                            journey in one place. Track
                            chart preparation, availability
                            analysis and recommendations.
                        </p>

                    </div>

                    <div className="journeys-hero-actions">

                        <button
                            type="button"
                            className="journeys-refresh-button"
                            onClick={() =>
                                loadJourneys(true)
                            }
                            disabled={
                                refreshing
                            }
                        >
                            <span>
                                {refreshing
                                    ? "↻"
                                    : "⟳"}
                            </span>

                            {refreshing
                                ? "Refreshing..."
                                : "Refresh"}
                        </button>

                        <button
                            type="button"
                            className="journeys-add-button"
                            onClick={() =>
                                navigate(
                                    "/add-journey"
                                )
                            }
                        >
                            <span>
                                +
                            </span>

                            Add Journey
                        </button>

                    </div>

                </section>

                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (
                    <section className="journeys-error-card">

                        <div className="journeys-error-icon">
                            !
                        </div>

                        <div>
                            <strong>
                                Unable to load journeys
                            </strong>

                            <p>
                                {error}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                loadJourneys()
                            }
                        >
                            Try Again
                        </button>

                    </section>
                )}

                {/* =================================================
                    SUMMARY
                ================================================= */}

                <section className="journeys-stats">

                    <div className="journeys-stat-card blue">

                        <div className="journeys-stat-icon">
                            🚆
                        </div>

                        <div>
                            <span>
                                TOTAL JOURNEYS
                            </span>

                            <strong>
                                {summary.total}
                            </strong>

                            <small>
                                All tracked journeys
                            </small>
                        </div>

                    </div>

                    <div className="journeys-stat-card green">

                        <div className="journeys-stat-icon">
                            ◉
                        </div>

                        <div>
                            <span>
                                MONITORING
                            </span>

                            <strong>
                                {summary.monitoring}
                            </strong>

                            <small>
                                Currently active
                            </small>
                        </div>

                    </div>

                    <div className="journeys-stat-card purple">

                        <div className="journeys-stat-icon">
                            ✓
                        </div>

                        <div>
                            <span>
                                CHART READY
                            </span>

                            <strong>
                                {summary.prepared}
                            </strong>

                            <small>
                                Chart prepared
                            </small>
                        </div>

                    </div>

                    <div className="journeys-stat-card orange">

                        <div className="journeys-stat-icon">
                            ✦
                        </div>

                        <div>
                            <span>
                                RECOMMENDATIONS
                            </span>

                            <strong>
                                {summary.recommendations}
                            </strong>

                            <small>
                                Ready to review
                            </small>
                        </div>

                    </div>

                </section>

                {/* =================================================
                    JOURNEY LIST
                ================================================= */}

                <section className="journeys-content-card">

                    <div className="journeys-content-header">

                        <div>

                            <div className="section-eyebrow">
                                YOUR TRAVEL
                            </div>

                            <h2>
                                Tracked journeys
                            </h2>

                            <p>
                                ERJA automatically monitors
                                the journeys you have added.
                            </p>

                        </div>

                        <div className="journeys-count">
                            {journeys.length}
                            <span>
                                journey
                                {journeys.length === 1
                                    ? ""
                                    : "s"}
                            </span>
                        </div>

                    </div>

                    {journeys.length === 0 ? (
                        <div className="journeys-empty">

                            <div className="journeys-empty-visual">
                                🚆
                            </div>

                            <div className="section-eyebrow">
                                NOTHING HERE YET
                            </div>

                            <h3>
                                Start monitoring a journey
                            </h3>

                            <p>
                                Add a train, journey date,
                                boarding station and
                                destination. ERJA will
                                monitor the journey for
                                available booking options.
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/add-journey"
                                    )
                                }
                            >
                                + Add Your First Journey
                            </button>

                        </div>
                    ) : (
                        <div className="journeys-list">

                            {journeys.map(
                                (
                                    journey
                                ) => {
                                    const journeyId =
                                        journey?._id;

                                    const chartPrepared =
                                        isChartPrepared(
                                            journey
                                        );

                                    const status =
                                        String(
                                            journey?.status ||
                                            "PENDING"
                                        ).toUpperCase();

                                    const firstChart =
                                        getExpectedFirstChart(
                                            journey
                                        );

                                    const finalChart =
                                        getExpectedFinalChart(
                                            journey
                                        );

                                    const boarding =
                                        getBoardingStation(
                                            journey
                                        );

                                    const destination =
                                        getDestinationStation(
                                            journey
                                        );

                                    const trainNumber =
                                        getTrainNumber(
                                            journey
                                        );

                                    const trainName =
                                        getTrainName(
                                            journey
                                        );

                                    return (
                                        <article
                                            className="journey-card"
                                            key={
                                                journeyId
                                            }
                                        >

                                            {/* CARD TOP */}

                                            <div className="journey-card-top">

                                                <div className="journey-train-identity">

                                                    <div className="journey-train-icon">
                                                        🚆
                                                    </div>

                                                    <div>

                                                        <div className="journey-train-number">
                                                            Train{" "}
                                                            {
                                                                trainNumber
                                                            }
                                                        </div>

                                                        <h3>
                                                            {
                                                                trainName
                                                            }
                                                        </h3>

                                                    </div>

                                                </div>

                                                <span
                                                    className={`journey-status ${getStatusClass(
                                                        status
                                                    )}`}
                                                >
                                                    <span>
                                                        {getStatusIcon(
                                                            status
                                                        )}
                                                    </span>

                                                    {getStatusText(
                                                        status
                                                    )}
                                                </span>

                                            </div>

                                            {/* ROUTE */}

                                            <div className="journey-route-panel">

                                                <div className="journey-station">

                                                    <span className="journey-station-label">
                                                        BOARDING
                                                    </span>

                                                    <strong>
                                                        {
                                                            boarding
                                                        }
                                                    </strong>

                                                </div>

                                                <div className="journey-route-line">

                                                    <span className="route-dot" />

                                                    <span className="route-line" />

                                                    <span className="route-train">
                                                        🚆
                                                    </span>

                                                    <span className="route-line" />

                                                    <span className="route-dot" />

                                                </div>

                                                <div className="journey-station destination">

                                                    <span className="journey-station-label">
                                                        DESTINATION
                                                    </span>

                                                    <strong>
                                                        {
                                                            destination
                                                        }
                                                    </strong>

                                                </div>

                                            </div>

                                            {/* DETAILS */}

                                            <div className="journey-details-grid">

                                                <div className="journey-detail">

                                                    <span>
                                                        JOURNEY DATE
                                                    </span>

                                                    <strong>
                                                        {formatDate(
                                                            journey?.journeyDate
                                                        )}
                                                    </strong>

                                                </div>

                                                <div className="journey-detail">

                                                    <span>
                                                        PREFERRED CLASS
                                                    </span>

                                                    <strong>
                                                        {getClasses(
                                                            journey
                                                        )}
                                                    </strong>

                                                </div>

                                                <div className="journey-detail">

                                                    <span>
                                                        MIXED CLASS
                                                    </span>

                                                    <strong>
                                                        {journey?.allowMixedClass
                                                            ? "Allowed"
                                                            : "Not allowed"}
                                                    </strong>

                                                </div>

                                                <div className="journey-detail">

                                                    <span>
                                                        LAST CHECKED
                                                    </span>

                                                    <strong>
                                                        {formatDateTime(
                                                            journey?.lastCheckedAt
                                                        )}
                                                    </strong>

                                                </div>

                                            </div>

                                            {/* CHART STATUS */}

                                            <div className="journey-chart-panel">

                                                <div className="journey-chart-status">

                                                    <div
                                                        className={`journey-chart-dot ${
                                                            chartPrepared
                                                                ? "prepared"
                                                                : "waiting"
                                                        }`}
                                                    />

                                                    <div>

                                                        <strong>
                                                            {chartPrepared
                                                                ? "Chart Prepared"
                                                                : "Chart Not Prepared"}
                                                        </strong>

                                                        <span>
                                                            {chartPrepared
                                                                ? "ERJA is checking railway availability."
                                                                : "ERJA is waiting for chart preparation."}
                                                        </span>

                                                    </div>

                                                </div>

                                                <div className="journey-chart-times">

                                                    <div>

                                                        <span>
                                                            FIRST CHART
                                                        </span>

                                                        <strong>
                                                            {firstChart
                                                                ? formatDateTime(
                                                                      firstChart
                                                                  )
                                                                : "Calculating..."}
                                                        </strong>

                                                    </div>

                                                    <div>

                                                        <span>
                                                            FINAL CHART
                                                        </span>

                                                        <strong>
                                                            {finalChart
                                                                ? formatDateTime(
                                                                      finalChart
                                                                  )
                                                                : "Calculating..."}
                                                        </strong>

                                                    </div>

                                                </div>

                                            </div>

                                            {/* ACTIONS */}

                                            <div className="journey-card-actions">

                                                <button
                                                    type="button"
                                                    className="journey-view-button"
                                                    onClick={() =>
                                                        handleViewJourney(
                                                            journeyId
                                                        )
                                                    }
                                                >
                                                    View Journey
                                                    <span>
                                                        →
                                                    </span>
                                                </button>

                                                {status ===
                                                    "RECOMMENDATION_READY" && (
                                                    <button
                                                        type="button"
                                                        className="journey-recommendation-button"
                                                        onClick={() =>
                                                            handleRecommendation(
                                                                journeyId
                                                            )
                                                        }
                                                    >
                                                        View Recommendation
                                                        <span>
                                                            ✦
                                                        </span>
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    className="journey-delete-button"
                                                    onClick={() =>
                                                        handleDelete(
                                                            journeyId
                                                        )
                                                    }
                                                    title="Delete journey"
                                                >
                                                    🗑
                                                </button>

                                            </div>

                                        </article>
                                    );
                                }
                            )}

                        </div>
                    )}

                </section>

                {/* =================================================
                    INFORMATION
                ================================================= */}

                <section className="journeys-info-card">

                    <div className="journeys-info-icon">
                        ℹ
                    </div>

                    <div>

                        <span>
                            HOW ERJA MONITORS
                        </span>

                        <h3>
                            Chart preparation → vacancy →
                            journey analysis
                        </h3>

                        <p>
                            ERJA monitors your selected
                            train and checks chart
                            preparation before analyzing
                            available railway vacancy.
                            Recommendations are generated
                            from the latest availability
                            detected by the monitoring
                            workflow.
                        </p>

                    </div>

                </section>

                {/* =================================================
                    PNR QUICK ACCESS
                ================================================= */}

                <section className="journeys-pnr-card">

                    <div className="journeys-pnr-icon">
                        🎫
                    </div>

                    <div className="journeys-pnr-content">

                        <span>
                            ALREADY BOOKED?
                        </span>

                        <h2>
                            Check your PNR status
                        </h2>

                        <p>
                            View your reservation,
                            passenger status and berth
                            information.
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/pnr")
                        }
                    >
                        Check PNR
                        <span>
                            →
                        </span>
                    </button>

                </section>

                {/* =================================================
                    FOOTER STATUS
                ================================================= */}

                <div className="journeys-footer-status">

                    <span className="journeys-live-dot" />

                    <span>
                        ERJA journey monitoring service
                        active
                    </span>

                    <span className="journeys-footer-separator">
                        •
                    </span>

                    <span>
                        Data refreshes when you open or
                        refresh this page
                    </span>

                </div>

            </main>
        </>
    );
}