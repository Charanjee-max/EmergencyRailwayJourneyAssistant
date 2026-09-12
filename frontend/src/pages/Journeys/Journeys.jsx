import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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

                const response =
                    await getJourneys();

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
                    err.response?.data?.message ||
                    err.message ||
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
    // DATE
    // =========================================================

    const formatDate = (date) => {
        if (!date) return "—";

        const parsed =
            new Date(date);

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
                month: "2-digit",
                year: "numeric",
            }
        );
    };

    const formatChartTime = (date) => {
        if (!date) {
            return "Not available";
        }

        const parsed =
            new Date(date);

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
                hour12: false,
            }
        );
    };

    // =========================================================
    // STATUS
    // =========================================================

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

    const getStatusClass = (status) => {
        return String(
            status || "PENDING"
        )
            .toLowerCase()
            .replaceAll(
                "_",
                "-"
            );
    };

    // =========================================================
    // CHART
    // =========================================================

    const isChartPrepared = (journey) =>
        journey?.chart?.chartPrepared ===
            true ||
        journey?.chart?.prepared ===
            true;

    const getExpectedFirstChart =
        (journey) =>
            journey?.chart
                ?.expectedFirstChartTime ||
            journey?.chart
                ?.firstChartTime ||
            null;

    const getExpectedFinalChart =
        (journey) =>
            journey?.chart
                ?.expectedFinalChartTime ||
            journey?.chart
                ?.finalChartTime ||
            null;

    // =========================================================
    // CLASS
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
                        item.class
                );

        if (
            enabled &&
            enabled.length
        ) {
            return enabled.join(
                ", "
            );
        }

        return "—";
    };

    // =========================================================
    // SUMMARY
    // =========================================================

    const summary = useMemo(() => {
        const total =
            journeys.length;

        const prepared =
            journeys.filter(
                isChartPrepared
            ).length;

        const waiting =
            journeys.filter(
                (journey) =>
                    !isChartPrepared(
                        journey
                    )
            ).length;

        return {
            total,
            prepared,
            waiting,
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
                            journey._id !==
                            journeyId
                    )
            );
        } catch (err) {
            console.error(
                "Failed to delete journey:",
                err
            );

            alert(
                err.response?.data?.message ||
                    err.message ||
                    "Unable to delete journey."
            );
        }
    };

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="journeys-page">

                <div className="journeys-loading">

                    <div className="journeys-loading-icon">
                        🚆
                    </div>

                    <h2>
                        Loading Journeys...
                    </h2>

                    <p>
                        Fetching your monitored
                        railway journeys.
                    </p>

                </div>

            </div>
        );
    }

    return (
        <div className="journeys-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="journeys-header">

                <div>

                    <div className="journeys-eyebrow">
                        ERJA JOURNEY CENTER
                    </div>

                    <h1>
                        My Journeys
                    </h1>

                    <p>
                        Monitor your railway
                        journeys and chart
                        preparation status.
                    </p>

                </div>

                <div className="journeys-header-actions">

                    <button
                        className="pnr-dashboard-btn"
                        onClick={() =>
                            navigate("/pnr")
                        }
                    >
                        🎫 PNR Status
                    </button>

                    <button
                        className="new-journey-btn"
                        onClick={() =>
                            navigate(
                                "/add-journey"
                            )
                        }
                    >
                        + New Journey
                    </button>

                </div>

            </header>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="journeys-error">
                    ⚠️ {error}
                </div>
            )}

            {/* =================================================
                SUMMARY
            ================================================= */}

            <section className="journey-summary-grid">

                <div className="journey-summary-card">

                    <div className="summary-icon blue">
                        🚆
                    </div>

                    <div>
                        <strong>
                            {summary.total}
                        </strong>

                        <span>
                            Total Journeys
                        </span>

                        <small>
                            Active and upcoming
                            journeys
                        </small>
                    </div>

                </div>

                <div className="journey-summary-card">

                    <div className="summary-icon green">
                        📋
                    </div>

                    <div>
                        <strong>
                            {summary.prepared}
                        </strong>

                        <span>
                            Charts Prepared
                        </span>

                        <small>
                            Trains with prepared
                            charts
                        </small>
                    </div>

                </div>

                <div className="journey-summary-card">

                    <div className="summary-icon orange">
                        🕐
                    </div>

                    <div>
                        <strong>
                            {summary.waiting}
                        </strong>

                        <span>
                            Waiting for Chart
                        </span>

                        <small>
                            Waiting for IRCTC
                            chart preparation
                        </small>
                    </div>

                </div>

            </section>

            {/* =================================================
                TABLE
            ================================================= */}

            <section className="journeys-table-card">

                <div className="journeys-table-header">

                    <div>

                        <span>
                            MONITORED JOURNEYS
                        </span>

                        <h2>
                            Journey Tracking
                        </h2>

                    </div>

                    <button
                        className="refresh-journeys-btn"
                        onClick={() =>
                            loadJourneys(true)
                        }
                        disabled={
                            refreshing
                        }
                    >
                        {refreshing
                            ? "Refreshing..."
                            : "↻ Refresh"}
                    </button>

                </div>

                {journeys.length === 0 ? (

                    <div className="journeys-empty">

                        <div>
                            🚆
                        </div>

                        <h3>
                            No journeys yet
                        </h3>

                        <p>
                            Add a journey to
                            start monitoring
                            railway chart
                            availability.
                        </p>

                        <button
                            onClick={() =>
                                navigate(
                                    "/add-journey"
                                )
                            }
                        >
                            + Add Journey
                        </button>

                    </div>

                ) : (

                    <div className="journeys-table-wrapper">

                        <table className="journeys-table">

                            <thead>

                                <tr>

                                    <th>
                                        TRAIN
                                    </th>

                                    <th>
                                        ROUTE
                                    </th>

                                    <th>
                                        JOURNEY DATE
                                    </th>

                                    <th>
                                        CLASS
                                    </th>

                                    <th>
                                        STATUS
                                    </th>

                                    <th>
                                        CHART STATUS
                                    </th>

                                    <th>
                                        EXPECTED CHART TIME
                                    </th>

                                    <th>
                                        ACTIONS
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {journeys.map(
                                    (journey) => {

                                        const chartPrepared =
                                            isChartPrepared(
                                                journey
                                            );

                                        const firstChart =
                                            getExpectedFirstChart(
                                                journey
                                            );

                                        const finalChart =
                                            getExpectedFinalChart(
                                                journey
                                            );

                                        return (
                                            <tr
                                                key={
                                                    journey._id
                                                }
                                            >

                                                {/* TRAIN */}

                                                <td>

                                                    <div className="train-cell">

                                                        <strong>
                                                            {
                                                                journey.trainNumber
                                                            }
                                                        </strong>

                                                    </div>

                                                </td>

                                                {/* ROUTE */}

                                                <td>

                                                    <div className="route-cell">

                                                        <strong>
                                                            {
                                                                journey.boardingStation
                                                            }
                                                            <span>
                                                                →
                                                            </span>
                                                            {
                                                                journey.destinationStation
                                                            }
                                                        </strong>

                                                    </div>

                                                </td>

                                                {/* DATE */}

                                                <td>

                                                    <strong className="date-cell">
                                                        {formatDate(
                                                            journey.journeyDate
                                                        )}
                                                    </strong>

                                                </td>

                                                {/* CLASS */}

                                                <td>

                                                    <div className="class-cell">
                                                        {getClasses(
                                                            journey
                                                        )}
                                                    </div>

                                                </td>

                                                {/* STATUS */}

                                                <td>

                                                    <span
                                                        className={`journey-status ${getStatusClass(
                                                            journey.status
                                                        )}`}
                                                    >
                                                        {
                                                            getStatusText(
                                                                journey.status
                                                            )
                                                        }
                                                    </span>

                                                </td>

                                                {/* CHART */}

                                                <td>

                                                    <div
                                                        className={`chart-status ${
                                                            chartPrepared
                                                                ? "prepared"
                                                                : "waiting"
                                                        }`}
                                                    >

                                                        <span className="chart-status-dot"></span>

                                                        <div>

                                                            <strong>
                                                                {chartPrepared
                                                                    ? "Chart Prepared"
                                                                    : "Chart Not Prepared"}
                                                            </strong>

                                                            <small>
                                                                {chartPrepared
                                                                    ? "IRCTC chart available"
                                                                    : "Waiting for IRCTC chart"}
                                                            </small>

                                                        </div>

                                                    </div>

                                                </td>

                                                {/* EXPECTED TIME */}

                                                <td>

                                                    <div className="expected-chart-time">

                                                        <div>

                                                            <span>
                                                                FIRST CHART
                                                            </span>

                                                            <strong>
                                                                {firstChart
                                                                    ? formatChartTime(
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
                                                                    ? formatChartTime(
                                                                          finalChart
                                                                      )
                                                                    : "Calculating..."}
                                                            </strong>

                                                        </div>

                                                    </div>

                                                </td>

                                                {/* ACTIONS */}

                                                <td>

                                                    <div className="journey-actions-cell">

                                                        <button
                                                            className="view-journey-btn"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/journey/${journey._id}`
                                                                )
                                                            }
                                                        >
                                                            View
                                                        </button>

                                                        <button
                                                            className="delete-journey-btn"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    journey._id
                                                                )
                                                            }
                                                            title="Delete journey"
                                                        >
                                                            🗑
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>
                                        );
                                    }
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </section>

            {/* =================================================
                INFORMATION
            ================================================= */}

            <section className="chart-info-banner">

                <div className="chart-info-icon">
                    ℹ️
                </div>

                <div>

                    <strong>
                        Expected Chart Timing
                    </strong>

                    <p>
                        ERJA calculates the expected
                        first and final chart preparation
                        windows from the train's origin
                        departure time. ERJA automatically
                        checks IRCTC when the appropriate
                        chart window is reached.
                    </p>

                </div>

            </section>

            {/* =================================================
                PNR QUICK ACCESS
            ================================================= */}

            <section className="pnr-quick-panel">

                <div className="pnr-quick-icon">
                    🎫
                </div>

                <div>

                    <span>
                        ALREADY BOOKED?
                    </span>

                    <h2>
                        Check your PNR status
                    </h2>

                    <p>
                        Enter your 10-digit PNR to
                        view booking and passenger
                        status.
                    </p>

                </div>

                <button
                    onClick={() =>
                        navigate("/pnr")
                    }
                >
                    Check PNR →
                </button>

            </section>

        </div>
    );
}