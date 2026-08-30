import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getRecommendations } from "../../api/recommendationAPI";
import "./Recommendation.css";

function formatStrategy(strategy = "") {
    return strategy
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function Recommendation() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadRecommendations = useCallback(async () => {
        if (!id) {
            setError("Journey ID is missing.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await getRecommendations(id);

            console.log(
                "Recommendation Response:",
                response.data
            );

            setRecommendations(
                response.data?.data || []
            );
        } catch (err) {
            console.error(
                "Failed to load recommendations:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to load recommendations."
            );
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadRecommendations();
    }, [loadRecommendations]);


    // =========================================
    // LOADING
    // =========================================

    if (loading) {
        return (
            <div className="recommendation-page">

                <div className="recommendation-loading">

                    <div className="loading-orb">
                        🤖
                    </div>

                    <div className="empty-label">
                        ERJA BOOKING ENGINE
                    </div>

                    <h2>
                        Analyzing Your Journey
                    </h2>

                    <p>
                        ERJA is checking available seats
                        and calculating the best booking strategy.
                    </p>

                    <div className="loading-bar">
                        <div></div>
                    </div>

                </div>

            </div>
        );
    }


    return (
        <div className="recommendation-page">

            {/* =====================================
                HEADER
            ====================================== */}

            <header className="recommendation-header">

                <button
                    className="back-btn"
                    onClick={() => navigate("/dashboard")}
                >
                    ← Back to Dashboard
                </button>

                <div className="page-label">
                    ERJA BOOKING ENGINE
                </div>

                <h1>
                    Journey Recommendations
                </h1>

                <p>
                    Smart booking strategies generated
                    from your current journey availability.
                </p>

                {recommendations.length > 0 && (
                    <div className="recommendation-summary">

                        <span>
                            ✨ {recommendations.length}{" "}
                            recommendation
                            {recommendations.length > 1
                                ? "s"
                                : ""}
                        </span>

                        <span className="summary-dot">
                            •
                        </span>

                        <span>
                            Ranked by ERJA Strategy Engine
                        </span>

                    </div>
                )}

            </header>


            {/* =====================================
                ERROR
            ====================================== */}

            {error && (
                <div className="error-card">

                    <div className="state-icon">
                        ⚠️
                    </div>

                    <div className="empty-label">
                        ERJA BOOKING ENGINE
                    </div>

                    <h2>
                        Unable to Load Recommendations
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        className="retry-btn"
                        onClick={loadRecommendations}
                    >
                        Try Again
                    </button>

                </div>
            )}


            {/* =====================================
                EMPTY
            ====================================== */}

            {!error &&
                recommendations.length === 0 && (
                    <div className="empty-card">

                        <div className="empty-icon">
                            🔎
                        </div>

                        <div className="empty-label">
                            BOOKING ENGINE
                        </div>

                        <h2>
                            No Recommendations Found
                        </h2>

                        <p>
                            ERJA currently has no active
                            booking strategy for this journey.
                            Recommendations will appear when
                            suitable availability is detected.
                        </p>

                        <button
                            className="back-dashboard-btn"
                            onClick={() =>
                                navigate("/dashboard")
                            }
                        >
                            ← Back to Dashboard
                        </button>

                    </div>
                )}


            {/* =====================================
                RECOMMENDATIONS
            ====================================== */}

            {!error &&
                recommendations.length > 0 && (

                    <main className="recommendations-list">

                        {recommendations.map(
                            (recommendation, index) => (

                                <article
                                    className={`recommendation-card ${
                                        index === 0
                                            ? "top-recommendation"
                                            : ""
                                    }`}
                                    key={
                                        recommendation.rank ??
                                        recommendation.strategy ??
                                        index
                                    }
                                >

                                    {/* =================================
                                        TOP SECTION
                                    ================================== */}

                                    <div className="recommendation-top">

                                        <div className="recommendation-title">

                                            <div className="rank-row">

                                                <span className="rank-badge">
                                                    #{recommendation.rank ??
                                                        index + 1}
                                                </span>

                                                {index === 0 && (
                                                    <span className="best-badge">
                                                        ⭐ BEST OPTION
                                                    </span>
                                                )}

                                            </div>

                                            <h2>
                                                {recommendation.title ||
                                                    formatStrategy(
                                                        recommendation.strategy
                                                    )}
                                            </h2>

                                        </div>


                                        {/* Confidence */}

                                        <div className="confidence">

                                            <span>
                                                Confidence
                                            </span>

                                            <strong>
                                                {recommendation.confidence ??
                                                    `${recommendation.score ?? 0}%`}
                                            </strong>

                                            <small>
                                                ERJA score
                                            </small>

                                        </div>

                                    </div>


                                    {/* =================================
                                        STRATEGY
                                    ================================== */}

                                    <div className="strategy-box">

                                        <div className="strategy-icon">
                                            ⚡
                                        </div>

                                        <div>

                                            <span className="strategy-label">
                                                RECOMMENDED STRATEGY
                                            </span>

                                            <strong>
                                                {formatStrategy(
                                                    recommendation.strategy
                                                )}
                                            </strong>

                                        </div>

                                    </div>


                                    {/* =================================
                                        REASON
                                    ================================== */}

                                    <section className="reason-section">

                                        <div className="section-heading">

                                            <span>
                                                01
                                            </span>

                                            <h3>
                                                Why this is recommended
                                            </h3>

                                        </div>

                                        <p>
                                            {recommendation.reason ||
                                                "This strategy provides a suitable booking option based on current availability."}
                                        </p>

                                    </section>


                                    {/* =================================
                                        TICKETS
                                    ================================== */}

                                    <section className="tickets-section">

                                        <div className="section-heading">

                                            <span>
                                                02
                                            </span>

                                            <h3>
                                                Ticket Details
                                            </h3>

                                        </div>


                                        {recommendation.tickets &&
                                        recommendation.tickets.length >
                                            0 ? (

                                            <div className="table-container">

                                                <table>

                                                    <thead>

                                                        <tr>
                                                            <th>
                                                                Ticket
                                                            </th>

                                                            <th>
                                                                From
                                                            </th>

                                                            <th>
                                                                To
                                                            </th>

                                                            <th>
                                                                Class
                                                            </th>

                                                            <th>
                                                                Coach
                                                            </th>

                                                            <th>
                                                                Berth
                                                            </th>
                                                        </tr>

                                                    </thead>


                                                    <tbody>

                                                        {recommendation.tickets.map(
                                                            (
                                                                ticket,
                                                                ticketIndex
                                                            ) => (

                                                                <tr
                                                                    key={
                                                                        ticketIndex
                                                                    }
                                                                >

                                                                    <td>

                                                                        <span className="ticket-number">
                                                                            {ticketIndex +
                                                                                1}
                                                                        </span>

                                                                        Ticket{" "}
                                                                        {ticketIndex +
                                                                            1}

                                                                    </td>


                                                                    <td className="station-code">
                                                                        {ticket.from ||
                                                                            "—"}
                                                                    </td>


                                                                    <td className="station-code">
                                                                        {ticket.to ||
                                                                            "—"}
                                                                    </td>


                                                                    <td>

                                                                        <span className="class-badge">
                                                                            {ticket.class ||
                                                                                "—"}
                                                                        </span>

                                                                    </td>


                                                                    <td>
                                                                        {ticket.coach ||
                                                                            "Not assigned"}
                                                                    </td>


                                                                    <td>
                                                                        {ticket.berth ||
                                                                            "Not assigned"}
                                                                    </td>

                                                                </tr>

                                                            )
                                                        )}

                                                    </tbody>

                                                </table>

                                            </div>

                                        ) : (

                                            <p className="no-ticket-data">
                                                No ticket details available.
                                            </p>

                                        )}

                                    </section>


                                    {/* =================================
                                        INSTRUCTIONS
                                    ================================== */}

                                    {recommendation.instructions &&
                                        recommendation.instructions
                                            .length > 0 && (

                                            <section className="instructions-section">

                                                <div className="section-heading">

                                                    <span>
                                                        03
                                                    </span>

                                                    <h3>
                                                        Booking Instructions
                                                    </h3>

                                                </div>


                                                <ol>

                                                    {recommendation.instructions.map(
                                                        (
                                                            instruction,
                                                            instructionIndex
                                                        ) => (

                                                            <li
                                                                key={
                                                                    instructionIndex
                                                                }
                                                            >

                                                                <span className="instruction-number">
                                                                    {instructionIndex +
                                                                        1}
                                                                </span>

                                                                <span>
                                                                    {
                                                                        instruction
                                                                    }
                                                                </span>

                                                            </li>

                                                        )
                                                    )}

                                                </ol>

                                            </section>

                                        )}


                                    {/* =================================
                                        WARNINGS
                                    ================================== */}

                                    {recommendation.warnings &&
                                        recommendation.warnings.length >
                                            0 && (

                                            <section className="warnings-section">

                                                <div className="warning-header">

                                                    <span>
                                                        ⚠️
                                                    </span>

                                                    <div>

                                                        <h3>
                                                            Important Warnings
                                                        </h3>

                                                        <p>
                                                            Please review before booking
                                                        </p>

                                                    </div>

                                                </div>


                                                <ul>

                                                    {recommendation.warnings.map(
                                                        (
                                                            warning,
                                                            warningIndex
                                                        ) => (

                                                            <li
                                                                key={
                                                                    warningIndex
                                                                }
                                                            >
                                                                {warning}
                                                            </li>

                                                        )
                                                    )}

                                                </ul>

                                            </section>

                                        )}

                                </article>

                            )
                        )}

                    </main>

                )}

        </div>
    );
}

export default Recommendation;