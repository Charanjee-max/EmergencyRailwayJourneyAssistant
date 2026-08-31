import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Journeys.css";

const API_BASE_URL = "http://localhost:5000";

function Journeys() {
    const navigate = useNavigate();

    const [journeys, setJourneys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =========================================================
    // FETCH JOURNEYS
    // =========================================================

    const fetchJourneys = async () => {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("token");

            if (!token) {
                setError("Please login again.");
                return;
            }

            const response = await fetch(
                `${API_BASE_URL}/api/journey`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    "Failed to fetch journeys."
                );
            }

            setJourneys(result.data || []);

        } catch (err) {

            console.error(
                "Failed to fetch journeys:",
                err
            );

            setError(
                err.message ||
                "Unable to load journeys."
            );

        } finally {
            setLoading(false);
        }
    };


    // =========================================================
    // DELETE JOURNEY
    // =========================================================

    const handleDelete = async (journeyId) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this journey?"
            );

        if (!confirmed) {
            return;
        }

        try {

            const token =
                localStorage.getItem("token");

            const response =
                await fetch(
                    `${API_BASE_URL}/api/journey/${journeyId}`,
                    {
                        method: "DELETE",
                        headers: {
                            "Content-Type":
                                "application/json",
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );

            const result =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    "Failed to delete journey."
                );
            }

            setJourneys((previous) =>
                previous.filter(
                    (journey) =>
                        journey._id !== journeyId
                )
            );

        } catch (err) {

            console.error(
                "Delete journey error:",
                err
            );

            alert(
                err.message ||
                "Unable to delete journey."
            );
        }
    };


    // =========================================================
    // OPEN RECOMMENDATIONS
    // =========================================================

    const handleRecommendations = (
        journeyId,
        chartPrepared
    ) => {

        // Do not open recommendations when
        // the chart has not been prepared.

        if (!chartPrepared) {

            alert(
                "IRCTC chart has not been prepared yet. Recommendations will be available after chart preparation."
            );

            return;
        }

        navigate(
            `/recommendation/${journeyId}`
        );
    };


    // =========================================================
    // LOAD DATA
    // =========================================================

    useEffect(() => {
        fetchJourneys();
    }, []);


    // =========================================================
    // DATE FORMATTER
    // =========================================================

    const formatDate = (date) => {

        if (!date) {
            return "—";
        }

        const parsedDate =
            new Date(date);

        if (Number.isNaN(
            parsedDate.getTime()
        )) {
            return "—";
        }

        return parsedDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            }
        );
    };


    // =========================================================
    // CLASS FORMATTER
    // =========================================================

    const getClasses = (journey) => {

        if (
            !journey.allowedClasses ||
            !journey.allowedClasses.length
        ) {
            return "—";
        }

        return journey.allowedClasses
            .filter(
                (item) => item.enabled
            )
            .map(
                (item) => item.class
            )
            .join(", ");
    };


    // =========================================================
    // CHART STATUS
    // =========================================================

    const getChartStatus = (journey) => {

        if (
            !journey.chart ||
            typeof journey.chart.chartPrepared !==
                "boolean"
        ) {
            return {
                type: "unknown",
                label: "Chart Status Unknown",
            };
        }


        if (
            journey.chart.chartPrepared === true
        ) {
            return {
                type: "prepared",
                label: "Chart Prepared",
            };
        }


        return {
            type: "not-prepared",
            label: "Chart Not Prepared",
        };
    };


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (
            <div className="journeys-page">

                <div className="journeys-header">
                    <h1>My Journeys</h1>
                    <p>
                        Monitor your railway journeys
                        and seat availability.
                    </p>
                </div>

                <div className="journeys-loading">
                    Loading journeys...
                </div>

            </div>
        );
    }


    // =========================================================
    // ERROR
    // =========================================================

    if (error) {

        return (
            <div className="journeys-page">

                <div className="journeys-header">
                    <h1>My Journeys</h1>
                    <p>
                        Monitor your railway journeys
                        and seat availability.
                    </p>
                </div>

                <div className="journeys-error">
                    <h3>
                        Unable to load journeys
                    </h3>

                    <p>
                        {error}
                    </p>

                    <button
                        onClick={fetchJourneys}
                    >
                        Try Again
                    </button>
                </div>

            </div>
        );
    }


    // =========================================================
    // PAGE
    // =========================================================

    return (
        <div className="journeys-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="journeys-header">

                <div>

                    <h1>
                        My Journeys
                    </h1>

                    <p>
                        Monitor your railway
                        journeys and seat
                        availability.
                    </p>

                </div>

                <button
                    className="create-journey-button"
                    onClick={() =>
                        navigate(
                            "/journeys/create"
                        )
                    }
                >
                    + New Journey
                </button>

            </div>


            {/* =================================================
                JOURNEY COUNT
            ================================================= */}

            <div className="journey-summary">

                <div className="summary-card">

                    <span className="summary-number">
                        {journeys.length}
                    </span>

                    <span className="summary-label">
                        Total Journeys
                    </span>

                </div>

                <div className="summary-card">

                    <span className="summary-number">
                        {
                            journeys.filter(
                                (journey) =>
                                    journey.chart &&
                                    journey.chart
                                        .chartPrepared ===
                                        true
                            ).length
                        }
                    </span>

                    <span className="summary-label">
                        Charts Prepared
                    </span>

                </div>

                <div className="summary-card">

                    <span className="summary-number">
                        {
                            journeys.filter(
                                (journey) =>
                                    !journey.chart ||
                                    journey.chart
                                        .chartPrepared !==
                                        true
                            ).length
                        }
                    </span>

                    <span className="summary-label">
                        Waiting for Chart
                    </span>

                </div>

            </div>


            {/* =================================================
                EMPTY STATE
            ================================================= */}

            {journeys.length === 0 ? (

                <div className="journeys-empty">

                    <div className="empty-icon">
                        🚆
                    </div>

                    <h2>
                        No journeys yet
                    </h2>

                    <p>
                        Create a journey to start
                        monitoring railway
                        availability.
                    </p>

                    <button
                        onClick={() =>
                            navigate(
                                "/journeys/create"
                            )
                        }
                    >
                        Create Journey
                    </button>

                </div>

            ) : (

                /* =================================================
                   JOURNEYS TABLE
                ================================================= */

                <div className="journeys-table-container">

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
                                    ACTIONS
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {journeys.map(
                                (journey) => {

                                    const chartStatus =
                                        getChartStatus(
                                            journey
                                        );

                                    const chartPrepared =
                                        chartStatus.type ===
                                        "prepared";


                                    return (

                                        <tr
                                            key={
                                                journey._id
                                            }
                                        >

                                            {/* TRAIN */}

                                            <td>

                                                <div className="train-info">

                                                    <strong>
                                                        {
                                                            journey.trainNumber
                                                        }
                                                    </strong>

                                                </div>

                                            </td>


                                            {/* ROUTE */}

                                            <td>

                                                <div className="route-info">

                                                    <strong>
                                                        {
                                                            journey.boardingStation
                                                        }
                                                    </strong>

                                                    <span>
                                                        →
                                                    </span>

                                                    <strong>
                                                        {
                                                            journey.destinationStation
                                                        }
                                                    </strong>

                                                </div>

                                            </td>


                                            {/* DATE */}

                                            <td>

                                                {
                                                    formatDate(
                                                        journey.journeyDate
                                                    )
                                                }

                                            </td>


                                            {/* CLASS */}

                                            <td>

                                                <div className="class-info">

                                                    {
                                                        getClasses(
                                                            journey
                                                        )
                                                    }

                                                    {journey.allowMixedClass && (
                                                        <span className="mixed-class-badge">
                                                            Mixed
                                                        </span>
                                                    )}

                                                </div>

                                            </td>


                                            {/* JOURNEY STATUS */}

                                            <td>

                                                <span
                                                    className={`journey-status status-${String(
                                                        journey.status ||
                                                        "UNKNOWN"
                                                    ).toLowerCase()}`}
                                                >

                                                    {
                                                        journey.status ||
                                                        "UNKNOWN"
                                                    }

                                                </span>

                                            </td>


                                            {/* CHART STATUS */}

                                            <td>

                                                <div
                                                    className={`chart-status chart-status-${chartStatus.type}`}
                                                >

                                                    <span className="chart-status-icon">

                                                        {chartStatus.type ===
                                                        "prepared"
                                                            ? "🟢"
                                                            : chartStatus.type ===
                                                              "not-prepared"
                                                            ? "🟡"
                                                            : "⚪"}

                                                    </span>

                                                    <div>

                                                        <strong>
                                                            {
                                                                chartStatus.label
                                                            }
                                                        </strong>

                                                        {journey.chart?.fetchedAt && (
                                                            <small>
                                                                Checked{" "}
                                                                {
                                                                    formatDate(
                                                                        journey
                                                                            .chart
                                                                            .fetchedAt
                                                                    )
                                                                }
                                                            </small>
                                                        )}

                                                    </div>

                                                </div>

                                            </td>


                                            {/* ACTIONS */}

                                            <td>

                                                <div className="journey-actions">

                                                    <button
                                                        className={
                                                            chartPrepared
                                                                ? "recommendation-button"
                                                                : "recommendation-button disabled"
                                                        }
                                                        onClick={() =>
                                                            handleRecommendations(
                                                                journey._id,
                                                                chartPrepared
                                                            )
                                                        }
                                                    >
                                                        {chartPrepared
                                                            ? "View Recommendations"
                                                            : "Waiting for Chart"}
                                                    </button>


                                                    <button
                                                        className="delete-journey-button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                journey._id
                                                            )
                                                        }
                                                        title="Delete journey"
                                                    >
                                                        🗑️
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

        </div>
    );
}

export default Journeys;