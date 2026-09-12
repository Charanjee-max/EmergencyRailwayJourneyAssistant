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
    const [recommendationLoading, setRecommendationLoading] =
        useState(false);

    const [error, setError] = useState("");


    // =========================================================
    // LOAD DASHBOARD
    // =========================================================

    useEffect(() => {
        loadDashboard();
    }, []);


    const loadDashboard = async () => {

        setLoading(true);
        setError("");

        try {

            const response = await getJourneys();

            const journeyData =
                response?.data?.data || [];

            setJourneys(journeyData);


            if (journeyData.length > 0) {

                await loadLatestRecommendation(
                    journeyData
                );

            } else {

                setLatestRecommendation(null);

            }

        } catch (err) {

            console.error(
                "Failed to load dashboard:",
                err
            );

            setError(
                "Unable to load dashboard data."
            );

        } finally {

            setLoading(false);

        }
    };


    // =========================================================
    // LOAD LATEST RECOMMENDATION
    // =========================================================

    const loadLatestRecommendation = async (
        journeyData
    ) => {

        setRecommendationLoading(true);

        try {

            const results =
                await Promise.allSettled(
                    journeyData.map(
                        (journey) =>
                            getRecommendations(
                                journey._id
                            )
                    )
                );


            const recommendations = [];


            results.forEach(
                (result, index) => {

                    if (
                        result.status !==
                        "fulfilled"
                    ) {
                        return;
                    }


                    const data =
                        result.value?.data?.data;


                    if (!data) {
                        return;
                    }


                    const journey =
                        journeyData[index];


                    if (
                        Array.isArray(data)
                    ) {

                        data.forEach(
                            (recommendation) => {

                                recommendations.push({
                                    ...recommendation,
                                    journeyId:
                                        journey._id,
                                    journeyDate:
                                        journey.journeyDate,
                                    trainNumber:
                                        journey.trainNumber,
                                    boardingStation:
                                        journey.boardingStation,
                                    destinationStation:
                                        journey.destinationStation,
                                });

                            }
                        );

                    } else {

                        recommendations.push({
                            ...data,
                            journeyId:
                                journey._id,
                            journeyDate:
                                journey.journeyDate,
                            trainNumber:
                                journey.trainNumber,
                            boardingStation:
                                journey.boardingStation,
                            destinationStation:
                                journey.destinationStation,
                        });

                    }

                }
            );


            if (
                recommendations.length === 0
            ) {

                setLatestRecommendation(null);

                return;
            }


            recommendations.sort(
                (a, b) => {

                    const dateA =
                        new Date(
                            a.analyzedAt ||
                            a.createdAt ||
                            a.updatedAt ||
                            a.journeyDate ||
                            0
                        );

                    const dateB =
                        new Date(
                            b.analyzedAt ||
                            b.createdAt ||
                            b.updatedAt ||
                            b.journeyDate ||
                            0
                        );

                    return dateB - dateA;

                }
            );


            setLatestRecommendation(
                recommendations[0]
            );


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


    // =========================================================
    // HELPERS
    // =========================================================

    const getRecommendationName = (
        recommendation
    ) => {

        if (!recommendation) {
            return "No recommendation";
        }


        const strategy =
            recommendation.strategy ||
            recommendation.type ||
            recommendation.recommendationType;


        if (!strategy) {
            return "Recommendation Available";
        }


        return strategy
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(
                /\b\w/g,
                (char) =>
                    char.toUpperCase()
            );

    };


    const getScore = (
        recommendation
    ) => {

        return (
            recommendation?.score ??
            recommendation?.confidence ??
            "-"
        );

    };


    const getCoach = (
        recommendation
    ) => {

        if (
            recommendation?.tickets &&
            recommendation.tickets.length > 0
        ) {

            return (
                recommendation.tickets[0]
                    ?.coach || "-"
            );

        }


        return (
            recommendation?.coach ||
            "-"
        );

    };


    const getJourneyStatus = (
        journey
    ) => {

        const status =
            String(
                journey?.status ||
                "PENDING"
            ).toUpperCase();


        switch (status) {

            case "MONITORING":
                return "Monitoring";

            case "CHART_PREPARED":
                return "Chart Prepared";

            case "RECOMMENDATION_READY":
                return "Recommendation Ready";

            case "COMPLETED":
                return "Completed";

            case "CANCELLED":
                return "Cancelled";

            case "ACTIVE":
                return "Active";

            default:
                return "Pending";

        }

    };


    const getStatusClass = (
        journey
    ) => {

        const status =
            String(
                journey?.status ||
                "PENDING"
            ).toUpperCase();


        if (
            status === "COMPLETED"
        ) {
            return "status completed";
        }


        if (
            status === "CANCELLED"
        ) {
            return "status cancelled";
        }


        if (
            status ===
                "RECOMMENDATION_READY" ||
            status ===
                "CHART_PREPARED"
        ) {
            return "status ready";
        }


        if (
            status === "MONITORING" ||
            status === "ACTIVE"
        ) {
            return "status monitoring";
        }


        return "status pending";

    };


    const formatDate = (
        date
    ) => {

        if (!date) {
            return "-";
        }


        const parsed =
            new Date(date);


        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {
            return "-";
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


    // =========================================================
    // COUNTS
    // =========================================================

    const monitoringCount =
        journeys.filter(
            (journey) => {

                const status =
                    String(
                        journey.status ||
                        ""
                    ).toUpperCase();


                return (
                    status === "PENDING" ||
                    status === "ACTIVE" ||
                    status === "MONITORING" ||
                    status ===
                        "CHART_PREPARED" ||
                    status ===
                        "RECOMMENDATION_READY"
                );

            }
        ).length;


    const completedCount =
        journeys.filter(
            (journey) =>
                String(
                    journey.status || ""
                ).toUpperCase() ===
                "COMPLETED"
        ).length;


    const recommendationCount =
        latestRecommendation
            ? 1
            : 0;


    // Alerts are not currently supplied
    // by the Dashboard API.
    const alertCount = 0;


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (

            <>

                <Navbar />

                <main className="dashboard">

                    <section className="dashboard-loading">

                        <div className="loading-orbit">

                            <div className="loading-train">
                                🚆
                            </div>

                        </div>

                        <h2>
                            Preparing your
                            control center
                        </h2>

                        <p>
                            Fetching journeys
                            and recommendations...
                        </p>

                    </section>

                </main>

            </>

        );

    }


    // =========================================================
    // DASHBOARD
    // =========================================================

    return (

        <>

            <Navbar />


            <main className="dashboard">

                {/* =================================================
                    HERO
                ================================================= */}

                <section className="dashboard-hero">

                    <div className="hero-content">

                        <div className="hero-badge">

                            <span className="live-dot"></span>

                            ERJA CONTROL CENTER

                        </div>


                        <h1>
                            Emergency Railway
                            <span>
                                Journey Assistant
                            </span>
                        </h1>


                        <p className="hero-subtitle">

                            Monitor your railway
                            journeys, analyze
                            availability, and discover
                            smarter booking strategies.

                        </p>


                        <div className="hero-actions">

                            <button
                                className="primary-action"
                                onClick={() =>
                                    navigate(
                                        "/add-journey"
                                    )
                                }
                            >

                                <span className="button-icon">
                                    +
                                </span>

                                Add New Journey

                                <span className="button-arrow">
                                    →
                                </span>

                            </button>


                            <button
                                className="secondary-action"
                                onClick={() =>
                                    navigate(
                                        "/journeys"
                                    )
                                }
                            >
                                View My Journeys
                            </button>

                        </div>

                    </div>


                    <div className="hero-visual">

                        <div className="rail-glow"></div>

                        <div className="rail-circle">

                            <div className="rail-circle-inner">

                                <span>
                                    🚆
                                </span>

                            </div>

                        </div>


                        <div className="route-line">

                            <span className="station-node">
                                SC
                            </span>

                            <div className="route-track">
                                <span className="moving-train">
                                    🚆
                                </span>
                            </div>

                            <span className="station-node">
                                BZA
                            </span>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <div className="dashboard-error">

                        <span>
                            ⚠️
                        </span>

                        {error}

                        <button
                            onClick={
                                loadDashboard
                            }
                        >
                            Retry
                        </button>

                    </div>

                )}


                {/* =================================================
                    STATISTICS
                ================================================= */}

                <section className="stats-grid">

                    <div className="stat-card stat-blue">

                        <div className="stat-icon">
                            🚆
                        </div>

                        <div className="stat-content">

                            <span>
                                TOTAL JOURNEYS
                            </span>

                            <strong>
                                {journeys.length}
                            </strong>

                            <small>
                                All tracked journeys
                            </small>

                        </div>

                    </div>


                    <div className="stat-card stat-green">

                        <div className="stat-icon">
                            ◉
                        </div>

                        <div className="stat-content">

                            <span>
                                MONITORING
                            </span>

                            <strong>
                                {monitoringCount}
                            </strong>

                            <small>
                                Currently active
                            </small>

                        </div>

                    </div>


                    <div className="stat-card stat-orange">

                        <div className="stat-icon">
                            ✦
                        </div>

                        <div className="stat-content">

                            <span>
                                RECOMMENDATIONS
                            </span>

                            <strong>
                                {recommendationCount}
                            </strong>

                            <small>
                                Available strategies
                            </small>

                        </div>

                    </div>


                    <div className="stat-card stat-purple">

                        <div className="stat-icon">
                            ✓
                        </div>

                        <div className="stat-content">

                            <span>
                                COMPLETED
                            </span>

                            <strong>
                                {completedCount}
                            </strong>

                            <small>
                                Journey history
                            </small>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    MAIN CONTENT
                ================================================= */}

                <section className="dashboard-grid">


                    {/* =================================================
                        JOURNEYS
                    ================================================= */}

                    <div className="dashboard-card journeys-card">

                        <div className="card-heading">

                            <div>

                                <span className="card-kicker">
                                    YOUR TRAVEL
                                </span>

                                <h2>
                                    My Journeys
                                </h2>

                            </div>


                            <button
                                className="text-action"
                                onClick={() =>
                                    navigate(
                                        "/journeys"
                                    )
                                }
                            >
                                View All
                                <span>→</span>
                            </button>

                        </div>


                        {journeys.length === 0 ? (

                            <div className="empty-state">

                                <div className="empty-illustration">
                                    🚆
                                </div>

                                <h3>
                                    No journeys yet
                                </h3>

                                <p>
                                    Add your first journey
                                    and let ERJA monitor
                                    railway availability
                                    for you.
                                </p>

                                <button
                                    className="empty-action"
                                    onClick={() =>
                                        navigate(
                                            "/add-journey"
                                        )
                                    }
                                >
                                    Add Your First Journey
                                    →
                                </button>

                            </div>

                        ) : (

                            <div className="journey-list">

                                {journeys
                                    .slice(0, 5)
                                    .map(
                                        (journey) => (

                                            <div
                                                className="journey-row"
                                                key={
                                                    journey._id
                                                }
                                            >

                                                <div className="train-icon-box">
                                                    🚆
                                                </div>


                                                <div className="journey-main">

                                                    <div className="train-number">
                                                        Train{" "}
                                                        {
                                                            journey.trainNumber
                                                        }
                                                    </div>


                                                    <div className="journey-route">

                                                        <strong>
                                                            {
                                                                journey.boardingStation
                                                            }
                                                        </strong>

                                                        <div className="route-connector">

                                                            <span></span>
                                                            <span></span>
                                                            <span></span>

                                                            <b>
                                                                →
                                                            </b>

                                                        </div>

                                                        <strong>
                                                            {
                                                                journey.destinationStation
                                                            }
                                                        </strong>

                                                    </div>


                                                    <div className="journey-date">

                                                        {formatDate(
                                                            journey.journeyDate
                                                        )}

                                                    </div>

                                                </div>


                                                <div className="journey-status">

                                                    <span
                                                        className={
                                                            getStatusClass(
                                                                journey
                                                            )
                                                        }
                                                    >

                                                        <i></i>

                                                        {
                                                            getJourneyStatus(
                                                                journey
                                                            )
                                                        }

                                                    </span>

                                                </div>


                                                <button
                                                    className="journey-view"
                                                    onClick={() =>
                                                        navigate(
                                                            `/recommendation/${journey._id}`
                                                        )
                                                    }
                                                >
                                                    View
                                                </button>

                                            </div>

                                        )
                                    )}

                            </div>

                        )}

                    </div>


                    {/* =================================================
                        AI RECOMMENDATION
                    ================================================= */}

                    <div className="dashboard-card recommendation-card">

                        <div className="card-heading">

                            <div>

                                <span className="card-kicker">
                                    ERJA INTELLIGENCE
                                </span>

                                <h2>
                                    Latest Recommendation
                                </h2>

                            </div>

                            <div className="ai-badge">
                                AI
                            </div>

                        </div>


                        {recommendationLoading ? (

                            <div className="recommendation-loading">

                                <div className="ai-loader">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>

                                <h3>
                                    Analyzing journey
                                </h3>

                                <p>
                                    Checking available
                                    booking strategies...
                                </p>

                            </div>

                        ) : latestRecommendation ? (

                            <div className="recommendation-content">

                                <div className="recommendation-hero">

                                    <div className="recommendation-check">
                                        ✓
                                    </div>

                                    <div>

                                        <span>
                                            BEST AVAILABLE
                                            STRATEGY
                                        </span>

                                        <h3>
                                            {
                                                getRecommendationName(
                                                    latestRecommendation
                                                )
                                            }
                                        </h3>

                                    </div>

                                </div>


                                <div className="recommendation-route">

                                    <div>

                                        <small>
                                            TRAIN
                                        </small>

                                        <strong>
                                            {
                                                latestRecommendation.trainNumber ||
                                                "-"
                                            }
                                        </strong>

                                    </div>


                                    <div className="recommendation-arrow">
                                        →
                                    </div>


                                    <div>

                                        <small>
                                            ROUTE
                                        </small>

                                        <strong>
                                            {
                                                latestRecommendation.boardingStation ||
                                                "-"
                                            }
                                            {" "}
                                            →
                                            {" "}
                                            {
                                                latestRecommendation.destinationStation ||
                                                "-"
                                            }
                                        </strong>

                                    </div>

                                </div>


                                <div className="recommendation-stats">

                                    <div>

                                        <span>
                                            COACH
                                        </span>

                                        <strong>
                                            {
                                                getCoach(
                                                    latestRecommendation
                                                )
                                            }
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            SCORE
                                        </span>

                                        <strong>
                                            {
                                                getScore(
                                                    latestRecommendation
                                                )
                                            }

                                        </strong>

                                    </div>

                                </div>


                                <button
                                    className="recommendation-action"
                                    onClick={() =>
                                        navigate(
                                            `/recommendation/${latestRecommendation.journeyId}`
                                        )
                                    }
                                >

                                    View Full Recommendation

                                    <span>
                                        →
                                    </span>

                                </button>

                            </div>

                        ) : (

                            <div className="empty-recommendation">

                                <div className="recommendation-empty-icon">
                                    ✦
                                </div>

                                <h3>
                                    Waiting for analysis
                                </h3>

                                <p>
                                    Once ERJA analyzes
                                    your journey, the
                                    best booking strategy
                                    will appear here.
                                </p>


                                {journeys.length === 0 && (

                                    <button
                                        className="empty-action"
                                        onClick={() =>
                                            navigate(
                                                "/add-journey"
                                            )
                                        }
                                    >
                                        Start a Journey
                                        →
                                    </button>

                                )}

                            </div>

                        )}

                    </div>

                </section>


                {/* =================================================
                    SAFETY / AVAILABILITY WARNING
                ================================================= */}

                <section className="availability-warning">

                    <div className="warning-icon">
                        ⚠
                    </div>

                    <div>

                        <strong>
                            Availability can change at any time
                        </strong>

                        <p>
                            Recommended berths may become
                            unavailable or be booked by another
                            passenger before you complete your
                            booking.
                        </p>

                    </div>

                </section>


                {/* =================================================
                    FOOTER STATUS
                ================================================= */}

                <div className="dashboard-footer">

                    <span className="footer-status">
                        <i></i>
                        ERJA monitoring system active
                    </span>

                    <span>
                        Emergency Railway Journey Assistant
                    </span>

                </div>

            </main>

        </>

    );

}


export default Dashboard;