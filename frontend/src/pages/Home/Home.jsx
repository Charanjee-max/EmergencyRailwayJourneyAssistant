import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="home-page">

            {/* Navigation */}
            <header className="home-navbar">

                <div className="home-logo">
                    🚆 <span>ERJA</span>
                </div>

                <div className="home-nav-actions">
                    <button
                        className="home-login-btn"
                        onClick={() => navigate("/login")}
                    >
                        Login
                    </button>

                    <button
                        className="home-start-btn"
                        onClick={() => navigate("/login")}
                    >
                        Get Started
                    </button>
                </div>

            </header>


            {/* Hero Section */}
            <section className="hero-section">

                <div className="hero-content">

                    <div className="hero-badge">
                        🚆 Emergency Railway Assistance
                    </div>

                    <h1>
                        Never Give Up on Your
                        <span> Railway Journey</span>
                    </h1>

                    <p>
                        ERJA helps you find alternative booking possibilities
                        when your preferred railway ticket is unavailable.
                    </p>

                    <div className="hero-actions">

                        <button
                            className="primary-hero-btn"
                            onClick={() => navigate("/login")}
                        >
                            Get Started →
                        </button>

                        <button
                            className="secondary-hero-btn"
                            onClick={() => {
                                document
                                    .getElementById("how-it-works")
                                    ?.scrollIntoView({
                                        behavior: "smooth",
                                    });
                            }}
                        >
                            How It Works
                        </button>

                    </div>

                </div>


                {/* Hero Visual */}
                <div className="hero-visual">

                    <div className="train-card">

                        <div className="train-icon">
                            🚆
                        </div>

                        <div>
                            <strong>Journey Assistance</strong>
                            <span>
                                Intelligent railway availability analysis
                            </span>
                        </div>

                    </div>

                    <div className="floating-card availability-card">
                        <span>🔍</span>
                        <div>
                            <strong>Monitor</strong>
                            <small>Availability</small>
                        </div>
                    </div>

                    <div className="floating-card recommendation-card">
                        <span>🎯</span>
                        <div>
                            <strong>Recommend</strong>
                            <small>Best Strategy</small>
                        </div>
                    </div>

                </div>

            </section>


            {/* How ERJA Helps */}
            <section
                className="features-section"
                id="how-it-works"
            >

                <div className="section-heading">

                    <span>HOW ERJA WORKS</span>

                    <h2>
                        From unavailable tickets
                        <br />
                        to possible journeys
                    </h2>

                    <p>
                        ERJA continuously analyzes your monitored journey
                        and identifies useful booking possibilities.
                    </p>

                </div>


                <div className="feature-grid">

                    <div className="feature-card">

                        <div className="feature-icon">
                            🔍
                        </div>

                        <h3>Monitor</h3>

                        <p>
                            Monitor your railway journey and availability
                            for the selected train, route and class.
                        </p>

                    </div>


                    <div className="feature-card">

                        <div className="feature-icon">
                            📊
                        </div>

                        <h3>Analyze</h3>

                        <p>
                            Analyze available seats, journey segments,
                            classes and chart information.
                        </p>

                    </div>


                    <div className="feature-card">

                        <div className="feature-icon">
                            🧠
                        </div>

                        <h3>Optimize</h3>

                        <p>
                            Evaluate different booking strategies to
                            find a practical way to complete your journey.
                        </p>

                    </div>


                    <div className="feature-card">

                        <div className="feature-icon">
                            🎯
                        </div>

                        <h3>Recommend</h3>

                        <p>
                            Receive clear recommendations showing
                            exactly how the journey can be booked.
                        </p>

                    </div>

                </div>

            </section>


            {/* Workflow */}
            <section className="workflow-section">

                <div className="section-heading">

                    <span>ERJA WORKFLOW</span>

                    <h2>
                        One journey.
                        <br />
                        Multiple possibilities.
                    </h2>

                </div>


                <div className="workflow">

                    <div className="workflow-step">
                        <div>1</div>
                        <strong>Journey Request</strong>
                        <span>Enter your journey details</span>
                    </div>

                    <div className="workflow-line" />

                    <div className="workflow-step">
                        <div>2</div>
                        <strong>Monitoring</strong>
                        <span>Track availability</span>
                    </div>

                    <div className="workflow-line" />

                    <div className="workflow-step">
                        <div>3</div>
                        <strong>Chart Analysis</strong>
                        <span>Analyze vacant berths</span>
                    </div>

                    <div className="workflow-line" />

                    <div className="workflow-step">
                        <div>4</div>
                        <strong>Optimization</strong>
                        <span>Find booking strategies</span>
                    </div>

                    <div className="workflow-line" />

                    <div className="workflow-step">
                        <div>5</div>
                        <strong>Recommendation</strong>
                        <span>Get the best option</span>
                    </div>

                </div>

            </section>


            {/* CTA */}
            <section className="cta-section">

                <div className="cta-card">

                    <div>
                        <span className="cta-label">
                            READY TO START?
                        </span>

                        <h2>
                            Let ERJA assist your next journey.
                        </h2>

                        <p>
                            Create your journey and let ERJA monitor
                            and analyze available booking possibilities.
                        </p>
                    </div>

                    <button
                        onClick={() => navigate("/login")}
                    >
                        Start Your Journey →
                    </button>

                </div>

            </section>


            {/* Footer */}
            <footer className="home-footer">

                <div className="footer-logo">
                    🚆 ERJA
                </div>

                <p>
                    Emergency Railway Journey Assistant
                </p>

                <span>
                    © {new Date().getFullYear()} ERJA
                </span>

            </footer>

        </div>
    );
}