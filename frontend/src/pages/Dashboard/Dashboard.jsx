import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Dashboard.css";

import Navbar from "../../components/Navbar/Navbar";
import SummaryCard from "../../components/SummaryCard/SummaryCard";
import { getJourneys } from "../../api/journeyAPI";
import { getRecommendations } from "../../api/recommendationAPI";

function Dashboard() {
    const navigate = useNavigate();

    const [journeys, setJourneys] = useState([]);
    const [latestRecommendation, setLatestRecommendation] = useState(null);

    const [loading, setLoading] = useState(true);
    const [recommendationLoading, setRecommendationLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await getJourneys();

            const journeyData = response?.data?.data || [];

            setJourneys(journeyData);

            // Find recommendations from journeys
            if (journeyData.length > 0) {
                await loadLatestRecommendation(journeyData);
            } else {
                setLatestRecommendation(null);
            }
        } catch (err) {
            console.error("Failed to load dashboard:", err);
            setError("Unable to load dashboard data.");
        } finally {
            setLoading(false);
        }
    };

    const loadLatestRecommendation = async (journeyData) => {
        setRecommendationLoading(true);

        try {
            const results = await Promise.allSettled(
                journeyData.map((journey) =>
                    getRecommendations(journey._id)
                )
            );

            const recommendations = [];

            results.forEach((result, index) => {
                if (result.status !== "fulfilled") return;

                const data = result.value?.data?.data;

                if (!data) return;

                const journey = journeyData[index];

                if (Array.isArray(data)) {
                    data.forEach((recommendation) => {
                        recommendations.push({
                            ...recommendation,
                            journeyId: journey._id,
                            journeyDate: journey.journeyDate,
                        });
                    });
                } else {
                    recommendations.push({
                        ...data,
                        journeyId: journey._id,
                        journeyDate: journey.journeyDate,
                    });
                }
            });

            if (recommendations.length === 0) {
                setLatestRecommendation(null);
                return;
            }

            // Prefer newest recommendation
            recommendations.sort((a, b) => {
                const dateA = new Date(
                    a.analyzedAt ||
                    a.createdAt ||
                    a.updatedAt ||
                    a.journeyDate ||
                    0
                );

                const dateB = new Date(
                    b.analyzedAt ||
                    b.createdAt ||
                    b.updatedAt ||
                    b.journeyDate ||
                    0
                );

                return dateB - dateA;
            });

            setLatestRecommendation(recommendations[0]);
        } catch (err) {
            console.error(
                "Failed to load recommendations:",
                err
            );

            setLatestRecommendation(null);
        } finally {
            setRecommendationLoading(false);
        }
    };

    const getRecommendationName = (recommendation) => {
        if (!recommendation) return "No recommendation";

        const strategy =
            recommendation.strategy ||
            recommendation.type ||
            recommendation.recommendationType;

        if (!strategy) return "Recommendation Available";

        return strategy
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const getScore = (recommendation) => {
        return (
            recommendation?.score ??
            recommendation?.confidence ??
            "-"
        );
    };

    const getCoach = (recommendation) => {
        if (
            recommendation?.tickets &&
            recommendation.tickets.length > 0
        ) {
            return recommendation.tickets[0]?.coach || "-";
        }

        return recommendation?.coach || "-";
    };

    const monitoringCount = journeys.filter((journey) => {
        const status = String(journey.status || "").toUpperCase();

        return (
            status === "PENDING" ||
            status === "ACTIVE" ||
            status === "MONITORING"
        );
    }).length;

    const recommendationCount = latestRecommendation ? 1 : 0;

    // Alerts are not currently provided by the Dashboard API,
    // so we do not invent a value.
    const alertCount = 0;

    if (loading) {
        return (
            <>
                <Navbar />

                <div className="dashboard">
                    <div className="dashboard-loading">
                        <div className="loading-spinner"></div>
                        <h2>Loading Dashboard...</h2>
                        <p>
                            Fetching your journeys and recommendations.
                        </p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />

            <div className="dashboard">

                <div className="dashboard-header">
                    <div>
                        <span className="dashboard-eyebrow">
                            ERJA CONTROL CENTER
                        </span>

                        <h1>
                            Emergency Railway Journey Assistant
                        </h1>

                        <p className="subtitle">
                            Monitor your journeys, track availability,
                            and discover the best booking options.
                        </p>
                    </div>

                    <button
                        className="header-add-btn"
                        onClick={() => navigate("/add-journey")}
                    >
                        <span>＋</span>
                        Add Journey
                    </button>
                </div>

                {error && (
                    <div className="dashboard-error">
                        ⚠️ {error}
                    </div>
                )}

                <div className="summary-grid">

                    <SummaryCard
                        title="Total Journeys"
                        value={journeys.length}
                        color="#1565C0"
                    />

                    <SummaryCard
                        title="Monitoring"
                        value={monitoringCount}
                        color="#43A047"
                    />

                    <SummaryCard
                        title="Recommendations"
                        value={recommendationCount}
                        color="#FB8C00"
                    />

                    <SummaryCard
                        title="Alerts"
                        value={alertCount}
                        color="#E53935"
                    />

                </div>

                <div className="actions">
                    <button
                        className="add-btn"
                        onClick={() => navigate("/add-journey")}
                    >
                        <span>＋</span>
                        Add New Journey
                    </button>
                </div>

                <div className="content-grid">

                    {/* JOURNEYS */}

                    <div className="card journeys-card">

                        <div className="card-header">
                            <div>
                                <span className="section-label">
                                    MONITORED
                                </span>

                                <h2>My Journeys</h2>
                            </div>

                            <button
                                className="secondary-btn"
                                onClick={() => navigate("/journeys")}
                            >
                                View All →
                            </button>
                        </div>

                        {journeys.length === 0 ? (

                            <div className="empty-state">
                                <div className="empty-icon">🚆</div>

                                <h3>No journeys yet</h3>

                                <p>
                                    Add a journey to start monitoring
                                    railway availability.
                                </p>

                                <button
                                    className="view-btn"
                                    onClick={() =>
                                        navigate("/add-journey")
                                    }
                                >
                                    Add Your First Journey
                                </button>
                            </div>

                        ) : (

                            <div className="table-wrapper">
                                <table>

                                    <thead>
                                        <tr>
                                            <th>Train</th>
                                            <th>Route</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>

                                    <tbody>

                                        {journeys.slice(0, 6).map(
                                            (journey) => (

                                                <tr key={journey._id}>

                                                    <td>
                                                        <strong>
                                                            {journey.trainNumber}
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        <span className="route">
                                                            {
                                                                journey.boardingStation
                                                            }
                                                            <span>
                                                                →
                                                            </span>
                                                            {
                                                                journey.destinationStation
                                                            }
                                                        </span>
                                                    </td>

                                                    <td>
                                                        {new Date(
                                                            journey.journeyDate
                                                        ).toLocaleDateString(
                                                            "en-GB"
                                                        )}
                                                    </td>

                                                    <td>
                                                        <span className="status active">
                                                            {
                                                                journey.status ||
                                                                "PENDING"
                                                            }
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <button
                                                            className="view-btn small"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/recommendation/${journey._id}`
                                                                )
                                                            }
                                                        >
                                                            View
                                                        </button>
                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>
                            </div>

                        )}

                    </div>

                    {/* LATEST RECOMMENDATION */}

                    <div className="card recommendation-card">

                        <div className="card-header">
                            <div>
                                <span className="section-label">
                                    AI BOOKING ENGINE
                                </span>

                                <h2>Latest Recommendation</h2>
                            </div>
                        </div>

                        {recommendationLoading ? (

                            <div className="recommendation-loading">
                                <div className="loading-spinner small"></div>
                                <p>
                                    Loading recommendation...
                                </p>
                            </div>

                        ) : latestRecommendation ? (

                            <div className="recommendation">

                                <div className="recommendation-icon">
                                    ✓
                                </div>

                                <div className="recommendation-title">
                                    <span>Recommended Strategy</span>

                                    <h3>
                                        {getRecommendationName(
                                            latestRecommendation
                                        )}
                                    </h3>
                                </div>

                                <div className="recommendation-info">

                                    <div className="info-item">
                                        <span>Coach</span>
                                        <strong>
                                            {getCoach(
                                                latestRecommendation
                                            )}
                                        </strong>
                                    </div>

                                    <div className="info-item">
                                        <span>Score</span>
                                        <strong>
                                            {getScore(
                                                latestRecommendation
                                            )}
                                        </strong>
                                    </div>

                                </div>

                                <button
                                    className="view-btn full"
                                    onClick={() =>
                                        navigate(
                                            `/recommendation/${latestRecommendation.journeyId}`
                                        )
                                    }
                                >
                                    View Recommendation →
                                </button>

                            </div>

                        ) : (

                            <div className="empty-recommendation">

                                <div className="empty-icon">
                                    🔎
                                </div>

                                <h3>
                                    No Recommendation Yet
                                </h3>

                                <p>
                                    Recommendations will appear here
                                    once ERJA analyzes your journey.
                                </p>

                            </div>

                        )}

                    </div>

                </div>

            </div>
        </>
    );
}

export default Dashboard;