import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getRecommendations } from "../../api/recommendationAPI";
import "./Recommendation.css";

function Recommendation() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadRecommendations();
    }, [id]);

    const loadRecommendations = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getRecommendations(id);

            console.log("Recommendation Response:", response.data);

            setRecommendations(response.data.data || []);
        } catch (error) {
            console.error(
                "Failed to load recommendations:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to load recommendations."
            );
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="recommendation-page">
                <div className="recommendation-loading">
                    <h2>Loading recommendations...</h2>
                    <p>Please wait.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="recommendation-page">

            <div className="recommendation-header">

                <button
                    className="back-btn"
                    onClick={() => navigate("/dashboard")}
                >
                    ← Back to Dashboard
                </button>

                <h1>Journey Recommendations</h1>

                <p>
                    Recommended booking options for your journey.
                </p>

            </div>

            {error && (
                <div className="error-card">
                    <h2>Unable to Load Recommendations</h2>

                    <p>{error}</p>

                    <button
                        className="retry-btn"
                        onClick={loadRecommendations}
                    >
                        Try Again
                    </button>
                </div>
            )}

            {!error && recommendations.length === 0 && (
                <div className="empty-card">

                    <div className="empty-icon">
                        🔎
                    </div>

                    <h2>No Recommendations Found</h2>

                    <p>
                        There are currently no active recommendations
                        for this journey.
                    </p>

                    <button
                        className="back-dashboard-btn"
                        onClick={() => navigate("/dashboard")}
                    >
                        Back to Dashboard
                    </button>

                </div>
            )}

            {!error && recommendations.length > 0 && (
                <div className="recommendations-list">

                    {recommendations.map((recommendation) => (

                        <div
                            className="recommendation-card"
                            key={recommendation.rank}
                        >

                            <div className="recommendation-top">

                                <div>
                                    <span className="rank-badge">
                                        #{recommendation.rank}
                                    </span>

                                    <h2>
                                        {recommendation.title}
                                    </h2>
                                </div>

                                <div className="confidence">
                                    <span>
                                        Confidence
                                    </span>

                                    <strong>
                                        {recommendation.confidence}
                                    </strong>
                                </div>

                            </div>

                            <div className="strategy-box">

                                <strong>
                                    Strategy:
                                </strong>

                                <span>
                                    {recommendation.strategy}
                                </span>

                            </div>

                            <div className="reason-section">

                                <h3>Why this is recommended</h3>

                                <p>
                                    {recommendation.reason ||
                                        "No reason provided."}
                                </p>

                            </div>

                            <div className="tickets-section">

                                <h3>Ticket Details</h3>

                                {recommendation.tickets &&
                                    recommendation.tickets.length > 0 ? (

                                    <div className="table-container">

                                        <table>

                                            <thead>
                                                <tr>
                                                    <th>Ticket</th>
                                                    <th>From</th>
                                                    <th>To</th>
                                                    <th>Class</th>
                                                    <th>Coach</th>
                                                    <th>Berth</th>
                                                </tr>
                                            </thead>

                                            <tbody>

                                                {recommendation.tickets.map(
                                                    (ticket, index) => (

                                                        <tr key={index}>

                                                            <td>
                                                                Ticket{" "}
                                                                {index + 1}
                                                            </td>

                                                            <td>
                                                                {ticket.from}
                                                            </td>

                                                            <td>
                                                                {ticket.to}
                                                            </td>

                                                            <td>
                                                                <span className="class-badge">
                                                                    {ticket.class}
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

                            </div>

                            {recommendation.instructions &&
                                recommendation.instructions.length > 0 && (

                                    <div className="instructions-section">

                                        <h3>Booking Instructions</h3>

                                        <ol>

                                            {recommendation.instructions.map(
                                                (instruction, index) => (

                                                    <li key={index}>
                                                        {instruction}
                                                    </li>

                                                )
                                            )}

                                        </ol>

                                    </div>

                                )}

                            {recommendation.warnings &&
                                recommendation.warnings.length > 0 && (

                                    <div className="warnings-section">

                                        <h3>⚠️ Important Warnings</h3>

                                        <ul>

                                            {recommendation.warnings.map(
                                                (warning, index) => (

                                                    <li key={index}>
                                                        {warning}
                                                    </li>

                                                )
                                            )}

                                        </ul>

                                    </div>

                                )}

                        </div>

                    ))}

                </div>
            )}

        </div>
    );
}

export default Recommendation;