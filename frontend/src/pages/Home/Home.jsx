import {
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import "./Home.css";


const faqItems = [

    {
        question: "What is ERJA?",
        answer:
            "ERJA stands for Emergency Railway Journey Assistant. It analyzes railway journey information and identifies possible booking strategies when a direct reservation may not be available."
    },

    {
        question: "Does ERJA book railway tickets?",
        answer:
            "No. ERJA is designed to analyze railway information and present possible journey strategies. Actual ticket booking remains the user's responsibility through authorized railway booking channels."
    },

    {
        question: "What happens after chart preparation?",
        answer:
            "Once the relevant reservation chart is prepared, ERJA can analyze available vacancy information and use its strategy engine to look for possible ways to cover the requested journey."
    },

    {
        question: "What is a split journey strategy?",
        answer:
            "A split journey strategy uses separate reservations for different portions of the same train journey when one reservation does not cover the complete requested journey."
    },

    {
        question: "What is mixed class?",
        answer:
            "Mixed class allows ERJA to consider combinations involving different travel classes, such as 2A and 3A, when the user explicitly enables that option."
    },

    {
        question: "Does ERJA guarantee a confirmed ticket?",
        answer:
            "No. Railway availability can change because of bookings, cancellations, chart preparation and other operational changes. ERJA recommendations should therefore be treated as information to evaluate rather than a guarantee of confirmation."
    },

];


function Home() {

    const navigate = useNavigate();

    const [openFaq, setOpenFaq] = useState(null);


    const scrollToSection = (id) => {

        document
            .getElementById(id)
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });

    };


    const toggleFaq = (index) => {

        setOpenFaq(
            openFaq === index
                ? null
                : index
        );

    };


    return (

        <main className="home-page">


            {/* =================================================
                BACKGROUND ATMOSPHERE
            ================================================= */}

            <div className="home-orb home-orb-one" />
            <div className="home-orb home-orb-two" />
            <div className="home-orb home-orb-three" />


            {/* =================================================
                TOP NAVIGATION
            ================================================= */}

            <header className="home-navbar">

                <button
                    className="home-brand"
                    onClick={() => scrollToSection("top")}
                    type="button"
                >

                    <span className="home-brand-icon">
                        🚆
                    </span>

                    <span>
                        ERJA
                    </span>

                </button>


                <nav className="home-nav-links">

                    <button
                        onClick={() => scrollToSection("how-it-works")}
                        type="button"
                    >
                        How it works
                    </button>

                    <button
                        onClick={() => scrollToSection("core")}
                        type="button"
                    >
                        Core
                    </button>

                    <button
                        onClick={() => scrollToSection("faq")}
                        type="button"
                    >
                        FAQ
                    </button>

                </nav>


                <div className="home-nav-actions">

                    <button
                        className="home-login-btn"
                        onClick={() => navigate("/login")}
                        type="button"
                    >
                        Login
                    </button>

                    <button
                        className="home-start-btn"
                        onClick={() => navigate("/login")}
                        type="button"
                    >
                        Get Started
                        <span>→</span>
                    </button>

                </div>

            </header>


            {/* =================================================
                RAILWAY TICKER
            ================================================= */}

            <div className="railway-ticker">

                <div className="ticker-track">

                    <span>
                        🚆 ERJA — Emergency Railway Journey Assistant
                    </span>

                    <span>
                        •
                    </span>

                    <span>
                        Monitor
                    </span>

                    <span>
                        →
                    </span>

                    <span>
                        Analyze
                    </span>

                    <span>
                        →
                    </span>

                    <span>
                        Discover
                    </span>

                    <span>
                        →
                    </span>

                    <span>
                        Travel
                    </span>

                    <span>
                        •
                    </span>

                    <span>
                        Chart Monitoring
                    </span>

                    <span>
                        •
                    </span>

                    <span>
                        Vacancy Analysis
                    </span>

                    <span>
                        •
                    </span>

                    <span>
                        Journey Strategies
                    </span>

                </div>

            </div>


            {/* =================================================
                HERO
            ================================================= */}

            <section
                className="hero-section"
                id="top"
            >

                <div className="hero-content">

                    <div className="hero-eyebrow">

                        <span className="live-dot" />

                        RAILWAY JOURNEY INTELLIGENCE

                    </div>


                    <h1>

                        Don't just search
                        <br />

                        for a seat.

                        <span>
                            Find a way to travel.
                        </span>

                    </h1>


                    <p className="hero-description">

                        ERJA monitors railway reservation information,
                        analyzes available berths and identifies possible
                        journey strategies when a direct reservation may
                        not cover your complete journey.

                    </p>


                    <div className="hero-actions">

                        <button
                            className="hero-primary-btn"
                            onClick={() => navigate("/login")}
                            type="button"
                        >

                            Start Your Journey

                            <span>
                                →
                            </span>

                        </button>


                        <button
                            className="hero-secondary-btn"
                            onClick={() =>
                                scrollToSection("how-it-works")
                            }
                            type="button"
                        >

                            Explore ERJA

                            <span>
                                ↓
                            </span>

                        </button>

                    </div>


                    <div className="hero-trust-row">

                        <div>
                            <span>01</span>
                            Chart Monitoring
                        </div>

                        <div>
                            <span>02</span>
                            Vacancy Analysis
                        </div>

                        <div>
                            <span>03</span>
                            Strategy Engine
                        </div>

                    </div>

                </div>


                {/* =================================================
                    HERO RAILWAY VISUAL
                ================================================= */}

                <div className="hero-visual">

                    <div className="map-glow" />

                    <div className="rail-map">

                        <div className="map-label">
                            INDIA
                        </div>


                        <div className="route-route route-one">

                            <span className="station station-a" />
                            <span className="station station-b" />
                            <span className="station station-c" />

                            <span className="moving-train">
                                🚆
                            </span>

                        </div>


                        <div className="route-route route-two">

                            <span className="station station-d" />
                            <span className="station station-e" />

                        </div>


                        <div className="map-route-label label-one">
                            SC
                        </div>

                        <div className="map-route-label label-two">
                            BDCR
                        </div>

                        <div className="map-route-label label-three">
                            MUGR
                        </div>

                    </div>


                    {/* =================================================
                        CHART CARD
                    ================================================= */}

                    <div className="hero-glass-card chart-card">

                        <div className="mini-card-top">

                            <span>
                                CHART STATUS
                            </span>

                            <span className="mini-live">
                                LIVE
                            </span>

                        </div>


                        <div className="chart-status-row">

                            <div className="chart-ring">

                                <span>
                                    ✓
                                </span>

                            </div>


                            <div>

                                <strong>
                                    Chart Prepared
                                </strong>

                                <small>
                                    Vacancy analysis active
                                </small>

                            </div>

                        </div>


                        <div className="scan-line" />

                    </div>


                    {/* =================================================
                        VACANCY CARD
                    ================================================= */}

                    <div className="hero-glass-card vacancy-card">

                        <span className="vacancy-icon">
                            ◈
                        </span>

                        <div>

                            <strong>
                                Vacancy Scan
                            </strong>

                            <small>
                                Searching journey segments
                            </small>

                        </div>

                        <span className="pulse-bars">
                            <i />
                            <i />
                            <i />
                            <i />
                        </span>

                    </div>


                    {/* =================================================
                        TICKET CARD
                    ================================================= */}

                    <div className="hero-ticket-card">

                        <div className="ticket-header">

                            <span>
                                ERJA
                            </span>

                            <span>
                                JOURNEY
                            </span>

                        </div>

                        <div className="ticket-route">

                            <strong>
                                MUGR
                            </strong>

                            <span>
                                ─────✦─────
                            </span>

                            <strong>
                                SC
                            </strong>

                        </div>

                        <div className="ticket-meta">

                            <span>
                                TRAIN 12746
                            </span>

                            <span>
                                SL
                            </span>

                            <span>
                                ANALYZING
                            </span>

                        </div>

                    </div>

                </div>

            </section>


            {/* =================================================
                PROBLEM / VALUE
            ================================================= */}

            <section className="problem-section">

                <div className="section-container">

                    <div className="section-kicker">
                        THE PROBLEM
                    </div>


                    <div className="problem-grid">

                        <div>

                            <h2>
                                A full journey isn't
                                always a full availability.
                            </h2>

                        </div>


                        <div>

                            <p>
                                A train may have vacant berths between
                                certain stations even when a direct
                                reservation for the entire journey is
                                unavailable.
                            </p>

                            <p>
                                ERJA is designed around that problem —
                                looking beyond a simple available /
                                unavailable result.
                            </p>

                        </div>

                    </div>

                </div>

            </section>


            {/* =================================================
                HOW ERJA WORKS
            ================================================= */}

            <section
                className="how-section"
                id="how-it-works"
            >

                <div className="section-container">

                    <div className="section-heading">

                        <span>
                            HOW ERJA WORKS
                        </span>

                        <h2>
                            From journey request
                            <br />
                            to journey strategy.
                        </h2>

                        <p>
                            ERJA connects railway information,
                            chart monitoring, vacancy analysis and
                            strategy generation into one workflow.
                        </p>

                    </div>


                    <div className="process-grid">

                        <div className="process-card">

                            <div className="process-number">
                                01
                            </div>

                            <div className="process-icon">
                                🎫
                            </div>

                            <h3>
                                Journey Request
                            </h3>

                            <p>
                                Enter your train, journey date,
                                boarding station, destination and
                                preferred class.
                            </p>

                        </div>


                        <div className="process-connector">
                            →
                        </div>


                        <div className="process-card">

                            <div className="process-number">
                                02
                            </div>

                            <div className="process-icon">
                                ◉
                            </div>

                            <h3>
                                Monitor
                            </h3>

                            <p>
                                ERJA monitors the selected journey
                                and checks relevant railway information.
                            </p>

                        </div>


                        <div className="process-connector">
                            →
                        </div>


                        <div className="process-card">

                            <div className="process-number">
                                03
                            </div>

                            <div className="process-icon">
                                📊
                            </div>

                            <h3>
                                Analyze
                            </h3>

                            <p>
                                After chart preparation, available
                                vacancy information is analyzed.
                            </p>

                        </div>


                        <div className="process-connector">
                            →
                        </div>


                        <div className="process-card">

                            <div className="process-number">
                                04
                            </div>

                            <div className="process-icon">
                                🧠
                            </div>

                            <h3>
                                Optimize
                            </h3>

                            <p>
                                ERJA evaluates possible journey
                                strategies using the reservation graph.
                            </p>

                        </div>


                        <div className="process-connector">
                            →
                        </div>


                        <div className="process-card">

                            <div className="process-number">
                                05
                            </div>

                            <div className="process-icon">
                                ✦
                            </div>

                            <h3>
                                Recommend
                            </h3>

                            <p>
                                Possible strategies are presented
                                clearly for the passenger to evaluate.
                            </p>

                        </div>

                    </div>

                </div>

            </section>


            {/* =================================================
                CORE
            ================================================= */}

            <section
                className="core-section"
                id="core"
            >

                <div className="section-container">

                    <div className="section-heading">

                        <span>
                            THE CORE OF ERJA
                        </span>

                        <h2>
                            Railway data meets
                            journey intelligence.
                        </h2>

                    </div>


                    <div className="core-layout">

                        <div className="core-visual">

                            <div className="core-node node-top">
                                Railway Data
                            </div>

                            <div className="core-line line-one" />

                            <div className="core-node node-middle">
                                Chart Monitoring
                            </div>

                            <div className="core-line line-two" />

                            <div className="core-node node-middle">
                                Vacancy Analysis
                            </div>

                            <div className="core-line line-three" />

                            <div className="core-node node-main">
                                Reservation Graph
                            </div>

                            <div className="core-line line-four" />

                            <div className="core-node node-bottom">
                                Strategy Engine
                            </div>

                            <div className="core-line line-five" />

                            <div className="core-node node-result">
                                Recommendation
                            </div>

                        </div>


                        <div className="core-copy">

                            <div className="glass-info-card">

                                <span>
                                    WHY IT MATTERS
                                </span>

                                <h3>
                                    ERJA looks at the journey
                                    as a network.
                                </h3>

                                <p>
                                    Instead of treating availability as
                                    only a single number, ERJA can model
                                    journey segments and available berths
                                    as connected information.
                                </p>

                            </div>


                            <div className="core-points">

                                <div>
                                    <span>✓</span>
                                    Direct availability analysis
                                </div>

                                <div>
                                    <span>✓</span>
                                    Segment-based journey analysis
                                </div>

                                <div>
                                    <span>✓</span>
                                    Same-class strategies
                                </div>

                                <div>
                                    <span>✓</span>
                                    Optional mixed-class strategies
                                </div>

                                <div>
                                    <span>✓</span>
                                    Seat-change-aware possibilities
                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </section>


            {/* =================================================
                USEFULNESS
            ================================================= */}

            <section className="useful-section">

                <div className="section-container">

                    <div className="section-heading">

                        <span>
                            WHY ERJA
                        </span>

                        <h2>
                            Built for difficult
                            railway journeys.
                        </h2>

                    </div>


                    <div className="useful-grid">

                        <article className="useful-card">

                            <span className="useful-card-number">
                                01
                            </span>

                            <div className="useful-card-icon">
                                🔎
                            </div>

                            <h3>
                                Look beyond direct availability
                            </h3>

                            <p>
                                A direct journey result may not tell
                                the whole story. ERJA can analyze
                                available journey segments.
                            </p>

                        </article>


                        <article className="useful-card">

                            <span className="useful-card-number">
                                02
                            </span>

                            <div className="useful-card-icon">
                                🔗
                            </div>

                            <h3>
                                Connect available segments
                            </h3>

                            <p>
                                The reservation graph allows the system
                                to reason about connected station-to-station
                                availability.
                            </p>

                        </article>


                        <article className="useful-card">

                            <span className="useful-card-number">
                                03
                            </span>

                            <div className="useful-card-icon">
                                🧠
                            </div>

                            <h3>
                                Compare possible strategies
                            </h3>

                            <p>
                                Different strategies can be evaluated
                                instead of showing only a basic
                                availability response.
                            </p>

                        </article>


                        <article className="useful-card">

                            <span className="useful-card-number">
                                04
                            </span>

                            <div className="useful-card-icon">
                                🔔
                            </div>

                            <h3>
                                Keep monitoring
                            </h3>

                            <p>
                                ERJA can continue monitoring a selected
                                journey so users do not need to repeatedly
                                check the same information manually.
                            </p>

                        </article>

                    </div>

                </div>

            </section>


            {/* =================================================
                LIVE RAILWAY STATUS VISUAL
            ================================================= */}

            <section className="status-section">

                <div className="section-container">

                    <div className="status-dashboard">

                        <div className="status-header">

                            <div>

                                <span>
                                    ERJA MONITORING ENGINE
                                </span>

                                <h3>
                                    Journey intelligence in motion
                                </h3>

                            </div>

                            <div className="status-live">
                                <i />
                                ACTIVE
                            </div>

                        </div>


                        <div className="status-flow">

                            <div className="status-item active">
                                <span>01</span>
                                <strong>Journey</strong>
                                <small>12746</small>
                            </div>

                            <div className="status-arrow">
                                →
                            </div>

                            <div className="status-item active">
                                <span>02</span>
                                <strong>Chart</strong>
                                <small>Prepared</small>
                            </div>

                            <div className="status-arrow">
                                →
                            </div>

                            <div className="status-item scanning">
                                <span>03</span>
                                <strong>Vacancy</strong>
                                <small>Scanning</small>
                            </div>

                            <div className="status-arrow">
                                →
                            </div>

                            <div className="status-item">
                                <span>04</span>
                                <strong>Strategy</strong>
                                <small>Analyzing</small>
                            </div>

                            <div className="status-arrow">
                                →
                            </div>

                            <div className="status-item">
                                <span>05</span>
                                <strong>Result</strong>
                                <small>Ready</small>
                            </div>

                        </div>

                    </div>

                </div>

            </section>


            {/* =================================================
                FAQ
            ================================================= */}

            <section
                className="faq-section"
                id="faq"
            >

                <div className="section-container">

                    <div className="faq-layout">

                        <div className="faq-intro">

                            <span>
                                FREQUENTLY ASKED QUESTIONS
                            </span>

                            <h2>
                                Questions before
                                your journey?
                            </h2>

                            <p>
                                Learn what ERJA does, how it works
                                and what its recommendations mean.
                            </p>


                            <button
                                className="faq-help-btn"
                                onClick={() => navigate("/login")}
                                type="button"
                            >
                                Start with ERJA
                                <span>→</span>
                            </button>

                        </div>


                        <div className="faq-list">

                            {faqItems.map(
                                (item, index) => {

                                    const isOpen =
                                        openFaq === index;

                                    return (

                                        <div
                                            className={`faq-item ${
                                                isOpen
                                                    ? "open"
                                                    : ""
                                            }`}
                                            key={item.question}
                                        >

                                            <button
                                                className="faq-question"
                                                onClick={() =>
                                                    toggleFaq(index)
                                                }
                                                type="button"
                                            >

                                                <span>
                                                    {item.question}
                                                </span>

                                                <span className="faq-plus">
                                                    {isOpen
                                                        ? "−"
                                                        : "+"
                                                    }
                                                </span>

                                            </button>


                                            <div
                                                className="faq-answer"
                                                aria-hidden={!isOpen}
                                            >

                                                <p>
                                                    {item.answer}
                                                </p>

                                            </div>

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    </div>

                </div>

            </section>


            {/* =================================================
                DISCLAIMER TICKER
            ================================================= */}

            <div className="disclaimer-ticker">

                <div className="disclaimer-track">

                    <span>
                        IMPORTANT
                    </span>

                    <span>
                        ERJA is an independent project.
                    </span>

                    <span>
                        ERJA does not guarantee ticket confirmation.
                    </span>

                    <span>
                        Availability may change.
                    </span>

                    <span>
                        Verify final booking information through
                        authorized railway channels.
                    </span>

                    <span>
                        ERJA is not affiliated with IRCTC,
                        CRIS or Indian Railways.
                    </span>

                </div>

            </div>


            {/* =================================================
                FINAL CTA
            ================================================= */}

            <section className="final-cta-section">

                <div className="final-cta-card">

                    <div className="cta-orbit orbit-one" />
                    <div className="cta-orbit orbit-two" />

                    <div className="final-cta-content">

                        <span>
                            YOUR JOURNEY. ANALYZED.
                        </span>

                        <h2>
                            Let ERJA look beyond
                            the obvious.
                        </h2>

                        <p>
                            Create a monitored journey and let
                            ERJA analyze railway information and
                            possible travel strategies.
                        </p>

                        <button
                            onClick={() => navigate("/login")}
                            type="button"
                        >
                            Get Started
                            <span>→</span>
                        </button>

                    </div>

                </div>

            </section>


            {/* =================================================
                FOOTER
            ================================================= */}

            <footer className="home-footer">

                <div className="footer-grid">

                    <div className="footer-brand">

                        <div className="footer-logo">

                            <span>
                                🚆
                            </span>

                            ERJA

                        </div>

                        <p>
                            Emergency Railway Journey Assistant
                        </p>

                        <small>
                            Railway journey intelligence for
                            difficult travel situations.
                        </small>

                    </div>


                    <div className="footer-column">

                        <h4>
                            Explore
                        </h4>

                        <button
                            onClick={() =>
                                scrollToSection("how-it-works")
                            }
                            type="button"
                        >
                            How ERJA Works
                        </button>

                        <button
                            onClick={() =>
                                scrollToSection("core")
                            }
                            type="button"
                        >
                            Core of ERJA
                        </button>

                        <button
                            onClick={() =>
                                scrollToSection("faq")
                            }
                            type="button"
                        >
                            FAQ
                        </button>

                    </div>


                    <div className="footer-column">

                        <h4>
                            Product
                        </h4>

                        <button
                            onClick={() => navigate("/dashboard")}
                            type="button"
                        >
                            Dashboard
                        </button>

                        <button
                            onClick={() => navigate("/journeys")}
                            type="button"
                        >
                            My Journeys
                        </button>

                        <button
                            onClick={() => navigate("/notifications")}
                            type="button"
                        >
                            Notifications
                        </button>

                    </div>


                    <div className="footer-column">

                        <h4>
                            Information
                        </h4>

                        <button
                            onClick={() => navigate("/login")}
                            type="button"
                        >
                            Get Started
                        </button>

                        <button
                            onClick={() => navigate("/login")}
                            type="button"
                        >
                            Privacy
                        </button>

                        <button
                            onClick={() => navigate("/login")}
                            type="button"
                        >
                            Terms
                        </button>

                    </div>

                </div>


                <div className="footer-bottom">

                    <span>
                        © {new Date().getFullYear()} ERJA
                    </span>

                    <span>
                        Independent railway assistance project
                    </span>

                    <span>
                        Not affiliated with IRCTC, CRIS or
                        Indian Railways
                    </span>

                </div>

            </footer>

        </main>

    );

}


export default Home;