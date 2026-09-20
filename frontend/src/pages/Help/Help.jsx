import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";

import "./Help.css";

function Help() {
    const navigate = useNavigate();

    const [openFaq, setOpenFaq] = useState(0);

    const faqs = [
        {
            question: "How does ERJA monitor my journey?",
            answer:
                "After you create a journey, ERJA periodically checks railway chart and vacancy information for the selected train, date, stations and class. When useful availability is detected, ERJA analyzes possible journey combinations and displays them as recommendations.",
        },
        {
            question: "What happens after the chart is prepared?",
            answer:
                "Once the railway chart is prepared, ERJA begins checking the available berth information. The system can then analyze direct and segmented availability according to the options you selected when creating the journey.",
        },
        {
            question: "Can ERJA find a journey when there is no direct seat?",
            answer:
                "ERJA is designed to look beyond a simple available or unavailable result. Depending on the available berth information and your journey settings, it can identify possible segment-based or mixed-class travel strategies.",
        },
        {
            question: "What does mixed class mean?",
            answer:
                "Mixed class allows ERJA to consider more than one travel class when analyzing a journey. For example, one segment may be available in one class while another segment is available in a different class.",
        },
        {
            question: "How often is my journey checked?",
            answer:
                "The monitoring workflow periodically checks the configured journey. The exact checking interval is controlled by the ERJA backend monitoring service.",
        },
        {
            question: "Can I delete a journey?",
            answer:
                "Yes. Open My Journeys, select the journey and use the available delete action. Deleting a journey stops it from being treated as an active journey by ERJA.",
        },
        {
            question: "What are notifications used for?",
            answer:
                "Notifications keep you informed about important journey events such as chart preparation and availability-related updates. You can open Notifications from the navigation bar.",
        },
        {
            question: "Does ERJA book the ticket automatically?",
            answer:
                "No. ERJA provides journey availability information and practical booking strategies. You should verify the current availability and complete the actual reservation through the official railway booking system.",
        },
    ];

    const features = [
        {
            icon: "🔎",
            title: "Monitor",
            text: "Track your railway journey after it is added to ERJA.",
        },
        {
            icon: "📊",
            title: "Analyze",
            text: "Analyze chart and vacancy information for your journey.",
        },
        {
            icon: "🎯",
            title: "Recommend",
            text: "Discover possible ways to cover your complete journey.",
        },
        {
            icon: "🔔",
            title: "Notify",
            text: "Receive updates when important journey events occur.",
        },
    ];

    const quickLinks = [
        {
            icon: "🚆",
            title: "Add a Journey",
            text: "Start monitoring a new train journey.",
            action: () => navigate("/add-journey"),
        },
        {
            icon: "🧳",
            title: "My Journeys",
            text: "View your active and previous journeys.",
            action: () => navigate("/journeys"),
        },
        {
            icon: "🔔",
            title: "Notifications",
            text: "Check chart and journey updates.",
            action: () => navigate("/notifications"),
        },
        {
            icon: "🎫",
            title: "PNR Status",
            text: "Check and manage saved PNRs.",
            action: () => navigate("/pnr"),
        },
    ];

    const toggleFaq = (index) => {
        setOpenFaq((current) =>
            current === index ? -1 : index
        );
    };

    return (
        <div className="help-page">
            <Navbar />

            <main className="help-main">

                <div className="help-background-orb help-orb-one" />
                <div className="help-background-orb help-orb-two" />

                <section className="help-hero">

                    <div className="help-hero-content">

                        <button
                            className="help-back-button"
                            onClick={() => navigate("/dashboard")}
                        >
                            ← Dashboard
                        </button>

                        <div className="help-eyebrow">
                            <span className="help-live-dot" />
                            ERJA HELP CENTER
                        </div>

                        <h1>
                            How can we
                            <span>help you?</span>
                        </h1>

                        <p>
                            Everything you need to understand
                            ERJA, monitor your railway journey
                            and use journey recommendations.
                        </p>

                    </div>

                    <div className="help-hero-visual">

                        <div className="help-glass-orbit orbit-one" />
                        <div className="help-glass-orbit orbit-two" />

                        <div className="help-visual-card">

                            <div className="help-visual-icon">
                                🚆
                            </div>

                            <div className="help-visual-line">
                                <span />
                                <span />
                                <span />
                            </div>

                            <strong>
                                ERJA
                            </strong>

                            <small>
                                Journey Intelligence
                            </small>

                        </div>

                    </div>

                </section>

                <section className="help-feature-grid">

                    {features.map((feature) => (
                        <div
                            className="help-feature-card"
                            key={feature.title}
                        >
                            <div className="help-feature-icon">
                                {feature.icon}
                            </div>

                            <div>
                                <h3>
                                    {feature.title}
                                </h3>

                                <p>
                                    {feature.text}
                                </p>
                            </div>
                        </div>
                    ))}

                </section>

                <section className="help-content-grid">

                    <div className="help-faq-section">

                        <div className="help-section-heading">
                            <div>
                                <small>
                                    FREQUENTLY ASKED
                                </small>

                                <h2>
                                    Frequently Asked Questions
                                </h2>
                            </div>
                        </div>

                        <div className="help-faq-list">

                            {faqs.map((faq, index) => {
                                const isOpen =
                                    openFaq === index;

                                return (
                                    <div
                                        className={`help-faq-item ${
                                            isOpen
                                                ? "open"
                                                : ""
                                        }`}
                                        key={faq.question}
                                    >

                                        <button
                                            className="help-faq-question"
                                            onClick={() =>
                                                toggleFaq(
                                                    index
                                                )
                                            }
                                        >
                                            <span>
                                                {faq.question}
                                            </span>

                                            <span className="help-faq-toggle">
                                                {isOpen
                                                    ? "−"
                                                    : "+"}
                                            </span>
                                        </button>

                                        {isOpen && (
                                            <div className="help-faq-answer">
                                                <p>
                                                    {faq.answer}
                                                </p>
                                            </div>
                                        )}

                                    </div>
                                );
                            })}

                        </div>

                    </div>

                    <aside className="help-sidebar">

                        <div className="help-sidebar-card">

                            <div className="help-sidebar-label">
                                QUICK ACCESS
                            </div>

                            <h2>
                                Go directly to
                                <span> ERJA tools</span>
                            </h2>

                            <div className="help-quick-links">

                                {quickLinks.map((item) => (
                                    <button
                                        className="help-quick-link"
                                        key={item.title}
                                        onClick={item.action}
                                    >

                                        <span className="help-quick-icon">
                                            {item.icon}
                                        </span>

                                        <span className="help-quick-content">
                                            <strong>
                                                {item.title}
                                            </strong>

                                            <small>
                                                {item.text}
                                            </small>
                                        </span>

                                        <span className="help-quick-arrow">
                                            →
                                        </span>

                                    </button>
                                ))}

                            </div>

                        </div>

                        <div className="help-support-card">

                            <div className="help-support-icon">
                                💡
                            </div>

                            <div>
                                <strong>
                                    Need to understand a result?
                                </strong>

                                <p>
                                    Open the relevant journey
                                    recommendation to see the
                                    detected availability and
                                    booking segments.
                                </p>
                            </div>

                        </div>

                    </aside>

                </section>

                <section className="help-bottom-note">

                    <div className="help-note-icon">
                        ℹ
                    </div>

                    <div>
                        <strong>
                            Railway availability can change
                        </strong>

                        <p>
                            ERJA recommendations are based on
                            the latest availability detected by
                            the monitoring workflow. Always
                            verify the latest availability and
                            booking rules before making a
                            reservation.
                        </p>
                    </div>

                </section>

            </main>
        </div>
    );
}

export default Help;