import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import "./Journeys.css";

const API_BASE_URL = "http://localhost:5000/api";

export default function Journeys() {
    const navigate = useNavigate();

    const [journeys, setJourneys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    // =========================================
    // FETCH JOURNEYS
    // =========================================

    const loadJourneys = useCallback(async (refresh = false) => {
        try {
            if (refresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await fetch(
                `${API_BASE_URL}/journey`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result?.message ||
                    "Failed to load journeys."
                );
            }

            /*
             * Supports common backend response formats:
             *
             * {
             *   success: true,
             *   data: [...]
             * }
             *
             * or
             *
             * {
             *   success: true,
             *   journeys: [...]
             * }
             */

            const data =
                result?.data ||
                result?.journeys ||
                result?.results ||
                [];

            setJourneys(
                Array.isArray(data) ? data : []
            );

        } catch (err) {
            console.error(
                "Journey loading error:",
                err
            );

            setError(
                err.message ||
                "Unable to load journeys."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);


    // =========================================
    // INITIAL LOAD
    // =========================================

    useEffect(() => {
        loadJourneys();
    }, [loadJourneys]);


    // =========================================
    // DELETE JOURNEY
    // =========================================

    const handleDelete = async (journeyId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this journey?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");

            const response = await fetch(
                `${API_BASE_URL}/journey/${journeyId}`,
                {
                    method: "DELETE",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result?.message ||
                    "Failed to delete journey."
                );
            }

            setJourneys((previous) =>
                previous.filter(
                    (journey) =>
                        String(
                            journey._id ||
                            journey.id
                        ) !== String(journeyId)
                )
            );

        } catch (err) {
            console.error(
                "Journey deletion error:",
                err
            );

            setError(
                err.message ||
                "Unable to delete journey."
            );
        }
    };


    // =========================================
    // DATE FORMATTER
    // =========================================

    const formatDate = (value) => {
        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            }
        );
    };


    // =========================================
    // CLASS FORMATTER
    // =========================================

    const getClassName = (journey) => {
        const classes =
            journey.preferredClasses ||
            journey.preferredClass ||
            journey.classCode ||
            journey.class;

        if (Array.isArray(classes)) {
            return classes.join(", ");
        }

        return classes || "—";
    };


    // =========================================
    // STATUS
    // =========================================

    const getStatus = (journey) => {
        return (
            journey.status ||
            journey.monitoringStatus ||
            "PENDING"
        );
    };


    // =========================================
    // STATUS CLASS
    // =========================================

    const getStatusClass = (status) => {
        const normalized =
            String(status)
                .toLowerCase()
                .replace(/\s+/g, "_");

        if (
            normalized === "active" ||
            normalized === "monitoring" ||
            normalized === "success" ||
            normalized === "completed"
        ) {
            return "status-active";
        }

        if (
            normalized === "cancelled" ||
            normalized === "canceled" ||
            normalized === "failed"
        ) {
            return "status-danger";
        }

        return "status-pending";
    };


    // =========================================
    // VIEW JOURNEY
    // =========================================

    const handleView = (journey) => {
        const id =
            journey._id ||
            journey.id;

        if (!id) {
            return;
        }

        navigate(`/recommendation/${id}`);
    };


    // =========================================
    // LOADING
    // =========================================

    if (loading) {
        return (
            <div className="journeys-page">
                <Navbar />

                <div className="journeys-loading">

                    <div className="journeys-loading-icon">
                        🚆
                    </div>

                    <span>
                        ERJA JOURNEY CENTER
                    </span>

                    <h1>
                        Loading Journeys
                    </h1>

                    <p>
                        Fetching your monitored railway
                        journeys...
                    </p>

                    <div className="loading-line">
                        <div />
                    </div>

                </div>
            </div>
        );
    }


    // =========================================
    // MAIN PAGE
    // =========================================

    return (
        <div className="journeys-page">

            <Navbar />

            <main className="journeys-container">

                {/* =================================
                    HEADER
                ================================== */}

                <section className="journeys-header">

                    <div>

                        <span className="journeys-eyebrow">
                            ERJA CONTROL CENTER
                        </span>

                        <h1>
                            My Journeys
                        </h1>

                        <p>
                            Manage and monitor all your
                            railway journeys from one place.
                        </p>

                    </div>


                    <button
                        className="add-journey-button"
                        onClick={() =>
                            navigate("/add-journey")
                        }
                    >
                        + Add Journey
                    </button>

                </section>


                {/* =================================
                    ERROR
                ================================== */}

                {error && (

                    <div className="journeys-error">

                        <span>⚠️</span>

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
                    SUMMARY CARDS
                ================================== */}

                <section className="journey-summary">

                    <div className="summary-card blue">

                        <div className="summary-icon">
                            🚆
                        </div>

                        <div>
                            <strong>
                                {journeys.length}
                            </strong>

                            <span>
                                Total Journeys
                            </span>
                        </div>

                    </div>


                    <div className="summary-card green">

                        <div className="summary-icon">
                            📡
                        </div>

                        <div>
                            <strong>
                                {
                                    journeys.filter(
                                        (journey) => {
                                            const status =
                                                getStatus(
                                                    journey
                                                ).toLowerCase();

                                            return (
                                                status ===
                                                    "pending" ||
                                                status ===
                                                    "active" ||
                                                status ===
                                                    "monitoring"
                                            );
                                        }
                                    ).length
                                }
                            </strong>

                            <span>
                                Monitoring
                            </span>
                        </div>

                    </div>


                    <div className="summary-card orange">

                        <div className="summary-icon">
                            ✨
                        </div>

                        <div>
                            <strong>
                                {
                                    journeys.filter(
                                        (journey) =>
                                            journey.recommendation ||
                                            journey.hasRecommendation
                                    ).length
                                }
                            </strong>

                            <span>
                                Recommendations
                            </span>
                        </div>

                    </div>


                    <div className="summary-card red">

                        <div className="summary-icon">
                            ⚠️
                        </div>

                        <div>
                            <strong>
                                {
                                    journeys.filter(
                                        (journey) => {
                                            const status =
                                                getStatus(
                                                    journey
                                                ).toLowerCase();

                                            return (
                                                status ===
                                                    "failed" ||
                                                status ===
                                                    "cancelled" ||
                                                status ===
                                                    "canceled"
                                            );
                                        }
                                    ).length
                                }
                            </strong>

                            <span>
                                Alerts
                            </span>
                        </div>

                    </div>

                </section>


                {/* =================================
                    TOOLBAR
                ================================== */}

                <section className="journeys-toolbar">

                    <div>

                        <span>
                            MONITORED JOURNEYS
                        </span>

                        <strong>
                            All Your Journeys
                        </strong>

                    </div>


                    <div className="journeys-toolbar-actions">

                        <button
                            onClick={() =>
                                loadJourneys(true)
                            }
                            disabled={refreshing}
                        >
                            {refreshing
                                ? "Refreshing..."
                                : "↻ Refresh"}
                        </button>

                        <button
                            className="toolbar-add"
                            onClick={() =>
                                navigate("/add-journey")
                            }
                        >
                            + Add New Journey
                        </button>

                    </div>

                </section>


                {/* =================================
                    EMPTY STATE
                ================================== */}

                {journeys.length === 0 && (

                    <section className="journeys-empty">

                        <div className="empty-icon">
                            🚆
                        </div>

                        <span>
                            NO JOURNEYS
                        </span>

                        <h2>
                            No Journeys Yet
                        </h2>

                        <p>
                            Add your first railway journey
                            and ERJA will start monitoring
                            availability for you.
                        </p>

                        <button
                            onClick={() =>
                                navigate("/add-journey")
                            }
                        >
                            + Add Your First Journey
                        </button>

                    </section>

                )}


                {/* =================================
                    JOURNEY TABLE
                ================================== */}

                {journeys.length > 0 && (

                    <section className="journeys-table-card">

                        <div className="table-wrapper">

                            <table>

                                <thead>

                                    <tr>
                                        <th>TRAIN</th>
                                        <th>ROUTE</th>
                                        <th>DATE</th>
                                        <th>CLASS</th>
                                        <th>STATUS</th>
                                        <th>ACTION</th>
                                    </tr>

                                </thead>


                                <tbody>

                                    {journeys.map(
                                        (journey) => {

                                            const id =
                                                journey._id ||
                                                journey.id;

                                            const train =
                                                journey.trainNumber ||
                                                journey.trainNo ||
                                                "—";

                                            const source =
                                                journey.source ||
                                                journey.from ||
                                                "—";

                                            const destination =
                                                journey.destination ||
                                                journey.to ||
                                                "—";

                                            const status =
                                                getStatus(
                                                    journey
                                                );

                                            return (

                                                <tr
                                                    key={id}
                                                >

                                                    <td>

                                                        <div className="train-cell">

                                                            <span className="train-icon">
                                                                🚆
                                                            </span>

                                                            <strong>
                                                                {train}
                                                            </strong>

                                                        </div>

                                                    </td>


                                                    <td>

                                                        <div className="route-cell">

                                                            <span>
                                                                {source}
                                                            </span>

                                                            <b>
                                                                →
                                                            </b>

                                                            <span>
                                                                {destination}
                                                            </span>

                                                        </div>

                                                    </td>


                                                    <td>
                                                        {formatDate(
                                                            journey.journeyDate ||
                                                            journey.date
                                                        )}
                                                    </td>


                                                    <td>

                                                        <span className="class-badge">
                                                            {getClassName(
                                                                journey
                                                            )}
                                                        </span>

                                                    </td>


                                                    <td>

                                                        <span
                                                            className={`journey-status ${getStatusClass(
                                                                status
                                                            )}`}
                                                        >
                                                            {status}
                                                        </span>

                                                    </td>


                                                    <td>

                                                        <div className="journey-actions">

                                                            <button
                                                                className="view-button"
                                                                onClick={() =>
                                                                    handleView(
                                                                        journey
                                                                    )
                                                                }
                                                            >
                                                                View
                                                            </button>

                                                            <button
                                                                className="delete-button"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        id
                                                                    )
                                                                }
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

                    </section>

                )}

            </main>

        </div>
    );
}