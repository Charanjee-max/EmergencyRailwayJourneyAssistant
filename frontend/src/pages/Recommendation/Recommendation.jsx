import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getRecommendations } from "../../api/recommendationAPI";
import "./Recommendation.css";

function formatStrategy(strategy = "") {
    return String(strategy)
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStrategyIcon(strategy = "") {
    const value = String(strategy).toLowerCase();

    if (value.includes("direct")) {
        return "🎯";
    }

    if (value.includes("mixed")) {
        return "🔀";
    }

    if (value.includes("split")) {
        return "🧩";
    }

    if (value.includes("multi")) {
        return "🛤️";
    }

    if (value.includes("tte")) {
        return "👨‍✈️";
    }

    return "⚡";
}

function getStrategyDescription(strategy = "") {
    const value = String(strategy).toLowerCase();

    if (value.includes("direct")) {
        return "One ticket covers the complete journey.";
    }

    if (value.includes("mixed")) {
        return "Different classes are combined to cover the complete journey.";
    }

    if (value.includes("split")) {
        return "Multiple tickets cover different sections of the same journey.";
    }

    if (value.includes("multi")) {
        return "Multiple connected journey segments are used to complete the route.";
    }

    if (value.includes("tte")) {
        return "This option depends on onboard ticketing or TTE assistance.";
    }

    return "A booking strategy generated from current railway availability.";
}

function getAvailabilityLabel(summary = {}) {
    const count = summary.count ?? summary.available ?? summary.quantity ?? 0;
    const classCode = summary.class || summary.classCode || "Class";

    return `${count} ${classCode} seat${Number(count) === 1 ? "" : "s"} available`;
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

            const data = response.data?.data;

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

    const recommendationStats = useMemo(() => {
        let totalTickets = 0;
        let mixedClassCount = 0;
        let directCount = 0;

        recommendations.forEach((recommendation) => {
            totalTickets += Array.isArray(recommendation.tickets)
                ? recommendation.tickets.length
                : 0;

            const strategy = String(
                recommendation.strategy || ""
            ).toLowerCase();

            if (strategy.includes("mixed")) {
                mixedClassCount += 1;
            }

            if (strategy.includes("direct")) {
                directCount += 1;
            }
        });

        return {
            totalTickets,
            mixedClassCount,
            directCount,
        };
    }, [recommendations]);


    /* =====================================================
       LOADING
       ===================================================== */

    if (loading) {
        return (
            <div className="recommendationPage">

                <div className="recommendationLoading">

                    <div className="loadingGlassCard">

                        <div className="loadingIcon">
                            🤖
                        </div>

                        <div className="pageEyebrow">
                            ERJA BOOKING ENGINE
                        </div>

                        <h1>
                            Analyzing your journey
                        </h1>

                        <p>
                            ERJA is checking the current chart,
                            available berths and possible booking
                            combinations.
                        </p>

                        <div className="loadingProgress">
                            <span></span>
                        </div>

                        <div className="loadingSteps">

                            <span className="loadingStep active">
                                Chart
                            </span>

                            <span className="loadingStep active">
                                Vacancy
                            </span>

                            <span className="loadingStep">
                                Graph
                            </span>

                            <span className="loadingStep">
                                Strategy
                            </span>

                        </div>

                    </div>

                </div>

            </div>
        );
    }


    return (
        <div className="recommendationPage">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="recommendationHeader">

                <button
                    className="backButton"
                    onClick={() => navigate("/dashboard")}
                >
                    ← Dashboard
                </button>

                <div className="headerContent">

                    <div className="pageEyebrow">
                        ERJA BOOKING ENGINE
                    </div>

                    <h1>
                        Journey Recommendations
                    </h1>

                    <p>
                        Current railway availability converted into
                        practical booking strategies.
                    </p>

                </div>

                <button
                    className="refreshButton"
                    onClick={loadRecommendations}
                    disabled={loading}
                >
                    ↻ Refresh
                </button>

            </header>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <section className="stateCard errorCard">

                    <div className="stateIcon">
                        ⚠️
                    </div>

                    <div className="pageEyebrow">
                        BOOKING ENGINE
                    </div>

                    <h2>
                        Unable to load recommendations
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        className="primaryAction"
                        onClick={loadRecommendations}
                    >
                        Try Again
                    </button>

                </section>
            )}


            {/* =================================================
                EMPTY
            ================================================= */}

            {!error && recommendations.length === 0 && (
                <section className="stateCard emptyCard">

                    <div className="stateIcon">
                        🔎
                    </div>

                    <div className="pageEyebrow">
                        NO CURRENT STRATEGY
                    </div>

                    <h2>
                        No booking combination found
                    </h2>

                    <p>
                        ERJA has not found a valid seat combination
                        for this journey at the moment. This can happen
                        when the chart is not prepared, no suitable
                        vacancy is available, or the current vacancy
                        cannot cover the complete journey.
                    </p>

                    <div className="emptyActions">

                        <button
                            className="primaryAction"
                            onClick={loadRecommendations}
                        >
                            ↻ Check Again
                        </button>

                        <button
                            className="secondaryAction"
                            onClick={() => navigate("/dashboard")}
                        >
                            ← Dashboard
                        </button>

                    </div>

                </section>
            )}


            {/* =================================================
                RECOMMENDATIONS
            ================================================= */}

            {!error && recommendations.length > 0 && (

                <main className="recommendationContent">

                    {/* =================================================
                        SUMMARY
                    ================================================= */}

                    <section className="availabilityOverview">

                        <div className="overviewIntro">

                            <div className="pageEyebrow">
                                CURRENT AVAILABILITY
                            </div>

                            <h2>
                                {recommendations.length} valid
                                {" "}
                                {recommendations.length === 1
                                    ? "strategy"
                                    : "strategies"}
                            </h2>

                            <p>
                                Review the available journey
                                combinations below before booking.
                            </p>

                        </div>


                        <div className="overviewStats">

                            <div className="overviewStat">

                                <strong>
                                    {recommendationStats.totalTickets}
                                </strong>

                                <span>
                                    Ticket segments
                                </span>

                            </div>


                            <div className="overviewStat">

                                <strong>
                                    {recommendationStats.directCount}
                                </strong>

                                <span>
                                    Direct options
                                </span>

                            </div>


                            <div className="overviewStat">

                                <strong>
                                    {recommendationStats.mixedClassCount}
                                </strong>

                                <span>
                                    Mixed options
                                </span>

                            </div>

                        </div>

                    </section>


                    {/* =================================================
                        STRATEGY CARDS
                    ================================================= */}

                    <div className="recommendationsList">

                        {recommendations.map(
                            (recommendation, index) => {

                                const strategy =
                                    recommendation.strategy || "";

                                const tickets =
                                    Array.isArray(
                                        recommendation.tickets
                                    )
                                        ? recommendation.tickets
                                        : [];

                                const vacancySummary =
                                    Array.isArray(
                                        recommendation.vacancySummary
                                    )
                                        ? recommendation.vacancySummary
                                        : [];

                                const instructions =
                                    Array.isArray(
                                        recommendation.instructions
                                    )
                                        ? recommendation.instructions
                                        : [];

                                const warnings =
                                    Array.isArray(
                                        recommendation.warnings
                                    )
                                        ? recommendation.warnings
                                        : [];

                                const isFirst =
                                    index === 0;

                                const isMixed =
                                    String(strategy)
                                        .toLowerCase()
                                        .includes("mixed");

                                const isDirect =
                                    String(strategy)
                                        .toLowerCase()
                                        .includes("direct");

                                return (
                                    <article
                                        className={`recommendationCard ${
                                            isFirst
                                                ? "featuredRecommendation"
                                                : ""
                                        }`}
                                        key={
                                            recommendation._id ||
                                            recommendation.rank ||
                                            `${strategy}-${index}`
                                        }
                                    >

                                        {/* =================================
                                            CARD HEADER
                                        ================================= */}

                                        <div className="recommendationCardHeader">

                                            <div className="strategyIdentity">

                                                <div className="strategyIcon">
                                                    {getStrategyIcon(
                                                        strategy
                                                    )}
                                                </div>

                                                <div>

                                                    <div className="rankLine">

                                                        <span className="rankBadge">
                                                            #
                                                            {recommendation.rank ??
                                                                index + 1}
                                                        </span>

                                                        {isFirst && (
                                                            <span className="currentOptionBadge">
                                                                PRIMARY OPTION
                                                            </span>
                                                        )}

                                                        {isDirect && (
                                                            <span className="typeBadge directBadge">
                                                                DIRECT
                                                            </span>
                                                        )}

                                                        {isMixed && (
                                                            <span className="typeBadge mixedBadge">
                                                                MIXED CLASS
                                                            </span>
                                                        )}

                                                    </div>

                                                    <h2>
                                                        {recommendation.title ||
                                                            formatStrategy(
                                                                strategy
                                                            )}
                                                    </h2>

                                                    <p>
                                                        {getStrategyDescription(
                                                            strategy
                                                        )}
                                                    </p>

                                                </div>

                                            </div>

                                        </div>


                                        {/* =================================
                                            REASON
                                        ================================= */}

                                        <section className="reasonBlock">

                                            <div className="sectionLabel">
                                                <span>
                                                    01
                                                </span>

                                                Why this strategy
                                            </div>

                                            <p>
                                                {recommendation.reason ||
                                                    "This strategy is based on the current availability returned by ERJA."}
                                            </p>

                                        </section>


                                        {/* =================================
                                            AVAILABILITY
                                        ================================= */}

                                        {vacancySummary.length > 0 && (

                                            <section className="availabilityBlock">

                                                <div className="sectionLabel">
                                                    <span>
                                                        02
                                                    </span>

                                                    Availability detected
                                                </div>

                                                <div className="availabilityGrid">

                                                    {vacancySummary.map(
                                                        (
                                                            summary,
                                                            summaryIndex
                                                        ) => (

                                                            <div
                                                                className="availabilityCard"
                                                                key={
                                                                    summaryIndex
                                                                }
                                                            >

                                                                <div className="availabilityNumber">
                                                                    {summary.count ??
                                                                        summary.available ??
                                                                        summary.quantity ??
                                                                        0}
                                                                </div>

                                                                <div className="availabilityInfo">

                                                                    <strong>
                                                                        {summary.class ||
                                                                            summary.classCode ||
                                                                            "Class"}
                                                                    </strong>

                                                                    <span>
                                                                        {getAvailabilityLabel(
                                                                            summary
                                                                        )}
                                                                    </span>

                                                                </div>

                                                                <div className="availabilityDot"></div>

                                                            </div>

                                                        )
                                                    )}

                                                </div>

                                            </section>

                                        )}


                                        {/* =================================
                                            TICKET SEGMENTS
                                        ================================= */}

                                        <section className="ticketBlock">

                                            <div className="sectionLabel">
                                                <span>
                                                    03
                                                </span>

                                                Booking segments
                                            </div>


                                            {tickets.length > 0 ? (

                                                <div className="ticketTimeline">

                                                    {tickets.map(
                                                        (
                                                            ticket,
                                                            ticketIndex
                                                        ) => {

                                                            const from =
                                                                ticket.from ||
                                                                ticket.fromStation ||
                                                                "—";

                                                            const to =
                                                                ticket.to ||
                                                                ticket.toStation ||
                                                                "—";

                                                            const classCode =
                                                                ticket.class ||
                                                                ticket.classCode ||
                                                                "—";

                                                            const coach =
                                                                ticket.coach ||
                                                                ticket.coachCode ||
                                                                "";

                                                            const berth =
                                                                ticket.berth ||
                                                                ticket.berthNumber ||
                                                                "";

                                                            return (
                                                                <div
                                                                    className="ticketSegment"
                                                                    key={
                                                                        ticketIndex
                                                                    }
                                                                >

                                                                    <div className="segmentNumber">
                                                                        {ticketIndex +
                                                                            1}
                                                                    </div>

                                                                    <div className="segmentMain">

                                                                        <div className="segmentRoute">

                                                                            <div className="segmentStation">

                                                                                <strong>
                                                                                    {from}
                                                                                </strong>

                                                                            </div>

                                                                            <div className="segmentLine">

                                                                                <span></span>

                                                                            </div>

                                                                            <div className="segmentStation destination">

                                                                                <strong>
                                                                                    {to}
                                                                                </strong>

                                                                            </div>

                                                                        </div>


                                                                        <div className="segmentDetails">

                                                                            <span className="classPill">
                                                                                {classCode}
                                                                            </span>

                                                                            {coach && (
                                                                                <span>
                                                                                    Coach {coach}
                                                                                </span>
                                                                            )}

                                                                            {berth && (
                                                                                <span>
                                                                                    Berth {berth}
                                                                                </span>
                                                                            )}

                                                                        </div>

                                                                    </div>

                                                                </div>
                                                            );
                                                        }
                                                    )}

                                                </div>

                                            ) : (

                                                <div className="noTicketData">
                                                    Ticket-level details are
                                                    not available for this
                                                    recommendation yet.
                                                </div>

                                            )}

                                        </section>


                                        {/* =================================
                                            BOOKING INSTRUCTIONS
                                        ================================= */}

                                        {instructions.length > 0 && (

                                            <section className="instructionBlock">

                                                <div className="sectionLabel">
                                                    <span>
                                                        04
                                                    </span>

                                                    Booking steps
                                                </div>

                                                <ol className="instructionList">

                                                    {instructions.map(
                                                        (
                                                            instruction,
                                                            instructionIndex
                                                        ) => (

                                                            <li
                                                                key={
                                                                    instructionIndex
                                                                }
                                                            >

                                                                <span className="instructionNumber">
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
                                        ================================= */}

                                        {warnings.length > 0 && (

                                            <section className="warningBlock">

                                                <div className="warningTitle">

                                                    <span>
                                                        ⚠️
                                                    </span>

                                                    <div>

                                                        <strong>
                                                            Important before booking
                                                        </strong>

                                                        <span>
                                                            Check these conditions
                                                            before purchasing the
                                                            tickets.
                                                        </span>

                                                    </div>

                                                </div>


                                                <ul>

                                                    {warnings.map(
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


                                        {/* =================================
                                            CARD FOOTER
                                        ================================= */}

                                        <div className="recommendationFooter">

                                            <span>
                                                Generated from current
                                                railway availability
                                            </span>

                                            <span>
                                                {tickets.length > 0
                                                    ? `${tickets.length} ticket ${
                                                        tickets.length === 1
                                                            ? "segment"
                                                            : "segments"
                                                    }`
                                                    : "Availability based"}
                                            </span>

                                        </div>

                                    </article>
                                );
                            }
                        )}

                    </div>


                    {/* =================================================
                        FOOTER NOTE
                    ================================================= */}

                    <section className="recommendationNote">

                        <span className="noteIcon">
                            ℹ️
                        </span>

                        <p>
                            Railway availability can change at any time.
                            ERJA's recommendations represent the vacancy
                            detected during the latest monitoring cycle.
                            Verify the final availability and booking rules
                            on the official railway booking system before
                            completing your reservation.
                        </p>

                    </section>

                </main>

            )}

        </div>
    );
}

export default Recommendation;