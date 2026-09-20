import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";

import "./Help.css";


const helpTopics = [
    {
        id: "how",
        icon: "🚆",
        title: "How ERJA works",
        description:
            "Understand how ERJA monitors your railway journey.",
    },
    {
        id: "chart",
        icon: "📋",
        title: "Chart preparation",
        description:
            "Learn what happens before and after the railway chart is prepared.",
    },
    {
        id: "recommendations",
        icon: "💡",
        title: "Seat recommendations",
        description:
            "Understand direct, split and mixed-class recommendations.",
    },
    {
        id: "notifications",
        icon: "🔔",
        title: "Notifications",
        description:
            "Learn about chart and journey update notifications.",
    },
    {
        id: "mixed",
        icon: "🔀",
        title: "Mixed class",
        description:
            "Understand how mixed-class monitoring works.",
    },
    {
        id: "troubleshooting",
        icon: "🛠",
        title: "Troubleshooting",
        description:
            "Common issues and what you can check first.",
    },
];


const faqs = [
    {
        question: "What does ERJA monitor?",
        answer:
            "ERJA monitors a specific railway journey that you add to the system. It processes railway chart and vacancy information for the selected train, date, stations and class.",
    },
    {
        question:
            "What happens before the chart is prepared?",
        answer:
            "Before chart preparation, ERJA keeps the journey under monitoring and waits for the railway chart information to become available.",
    },
    {
        question:
            "What happens when the chart is prepared?",
        answer:
            "Once the chart is prepared, ERJA can process the available vacancy information and analyze the journey for possible travel strategies.",
    },
    {
        question:
            "Why might I see no recommendation?",
        answer:
            "A recommendation depends on the vacancy information available for the selected journey. If there is no usable vacancy or a complete journey strategy cannot be formed, ERJA may not display a recommendation.",
    },
    {
        question:
            "What is a direct seat recommendation?",
        answer:
            "A direct recommendation represents availability that can cover the complete boarding-to-destination journey without requiring a split journey.",
    },
    {
        question:
            "What is a split journey recommendation?",
        answer:
            "A split recommendation uses available seats across different journey segments. The segments are analyzed against the train route so that the complete journey can be covered.",
    },
    {
        question:
            "What does mixed class mean?",
        answer:
            "Mixed class allows ERJA to consider more than one travel class when analyzing available journey segments. This option is only considered when mixed-class monitoring is enabled for the journey.",
    },
    {
        question:
            "How will I know when the chart is prepared?",
        answer:
            "ERJA can create a chart update notification when the monitored journey reaches the chart-prepared state.",
    },
    {
        question:
            "Can I monitor more than one journey?",
        answer:
            "Yes. You can add multiple railway journeys and view them from the Journeys section.",
    },
];


function Help() {

    const navigate = useNavigate();

    const [activeTopic, setActiveTopic] =
        useState("how");

    const [openFaq, setOpenFaq] =
        useState(null);


    const handleTopicClick = (
        topicId
    ) => {

        setActiveTopic(topicId);

        const section =
            document.getElementById(
                `help-${topicId}`
            );

        if (section) {

            section.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });

        }

    };


    const toggleFaq = (
        index
    ) => {

        setOpenFaq(
            openFaq === index
                ? null
                : index
        );

    };


    return (

        <div className="help-page">

            <Navbar />


            <main className="help-container">

                {/* =================================================
                    PAGE HEADER
                ================================================= */}

                <section className="help-header">

                    <div className="help-header-content">

                        <div className="help-eyebrow">
                            <span className="help-live-dot" />
                            ERJA SUPPORT CENTER
                        </div>


                        <h1>
                            How can we help?
                        </h1>


                        <p>
                            Learn how ERJA monitors railway
                            journeys, processes availability
                            and presents journey strategies.
                        </p>

                    </div>


                    <div className="help-header-icon">
                        ?
                    </div>

                </section>


                {/* =================================================
                    TOPIC CARDS
                ================================================= */}

                <section className="help-topic-grid">

                    {helpTopics.map(
                        (topic) => (

                            <button
                                type="button"
                                key={topic.id}
                                className={`help-topic-card ${
                                    activeTopic ===
                                    topic.id
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() =>
                                    handleTopicClick(
                                        topic.id
                                    )
                                }
                            >

                                <div className="help-topic-icon">
                                    {topic.icon}
                                </div>


                                <div className="help-topic-content">

                                    <strong>
                                        {topic.title}
                                    </strong>

                                    <span>
                                        {
                                            topic.description
                                        }
                                    </span>

                                </div>


                                <span className="help-topic-arrow">
                                    →
                                </span>

                            </button>

                        )
                    )}

                </section>


                {/* =================================================
                    HOW ERJA WORKS
                ================================================= */}

                <section
                    id="help-how"
                    className="help-main-card"
                >

                    <div className="help-main-card-header">

                        <div>

                            <span className="help-section-label">
                                JOURNEY MONITORING
                            </span>

                            <h2>
                                How ERJA works
                            </h2>

                            <p>
                                ERJA is designed to monitor
                                a specific railway journey
                                and analyze available
                                railway data for that journey.
                            </p>

                        </div>

                    </div>


                    <div className="help-process-grid">

                        <div className="help-process-card">

                            <span className="help-process-number">
                                01
                            </span>

                            <div>

                                <strong>
                                    Add your journey
                                </strong>

                                <p>
                                    Enter the train,
                                    journey date,
                                    boarding station,
                                    destination and
                                    preferred class.
                                </p>

                            </div>

                        </div>


                        <div className="help-process-card">

                            <span className="help-process-number">
                                02
                            </span>

                            <div>

                                <strong>
                                    ERJA monitors
                                </strong>

                                <p>
                                    Your journey remains
                                    under monitoring while
                                    railway information is
                                    being processed.
                                </p>

                            </div>

                        </div>


                        <div className="help-process-card">

                            <span className="help-process-number">
                                03
                            </span>

                            <div>

                                <strong>
                                    Chart preparation
                                </strong>

                                <p>
                                    ERJA checks whether
                                    the railway chart
                                    has been prepared.
                                </p>

                            </div>

                        </div>


                        <div className="help-process-card">

                            <span className="help-process-number">
                                04
                            </span>

                            <div>

                                <strong>
                                    Vacancy analysis
                                </strong>

                                <p>
                                    Available vacancy
                                    information is
                                    processed against
                                    the train route.
                                </p>

                            </div>

                        </div>


                        <div className="help-process-card">

                            <span className="help-process-number">
                                05
                            </span>

                            <div>

                                <strong>
                                    Recommendation
                                </strong>

                                <p>
                                    ERJA presents usable
                                    journey strategies
                                    when the available
                                    data supports them.
                                </p>

                            </div>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    CHART PREPARATION
                ================================================= */}

                <section
                    id="help-chart"
                    className="help-information-card"
                >

                    <div className="help-information-icon">
                        📋
                    </div>

                    <div>

                        <span className="help-section-label">
                            CHART PREPARATION
                        </span>

                        <h2>
                            Railway chart status
                        </h2>

                        <p>
                            ERJA first checks the chart
                            state for your monitored journey.
                            Before the chart is prepared,
                            vacancy information required
                            for the recommendation process
                            may not be available.
                        </p>

                        <div className="help-status-flow">

                            <div className="help-status-step">

                                <span>
                                    01
                                </span>

                                <strong>
                                    Journey added
                                </strong>

                                <small>
                                    Monitoring starts
                                </small>

                            </div>


                            <div className="help-status-line" />


                            <div className="help-status-step">

                                <span>
                                    02
                                </span>

                                <strong>
                                    Chart pending
                                </strong>

                                <small>
                                    ERJA keeps checking
                                </small>

                            </div>


                            <div className="help-status-line" />


                            <div className="help-status-step ready">

                                <span>
                                    03
                                </span>

                                <strong>
                                    Chart prepared
                                </strong>

                                <small>
                                    Vacancy analysis starts
                                </small>

                            </div>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    RECOMMENDATIONS
                ================================================= */}

                <section
                    id="help-recommendations"
                    className="help-information-card"
                >

                    <div className="help-information-icon blue">
                        💡
                    </div>

                    <div>

                        <span className="help-section-label">
                            SEAT RECOMMENDATIONS
                        </span>

                        <h2>
                            How recommendations work
                        </h2>

                        <p>
                            ERJA analyzes available railway
                            vacancy information against the
                            route of your selected journey.
                        </p>


                        <div className="help-option-grid">

                            <div className="help-option-card">

                                <div className="help-option-icon">
                                    ✓
                                </div>

                                <div>

                                    <strong>
                                        Direct
                                    </strong>

                                    <p>
                                        Availability covering
                                        the complete journey.
                                    </p>

                                </div>

                            </div>


                            <div className="help-option-card">

                                <div className="help-option-icon">
                                    ⇄
                                </div>

                                <div>

                                    <strong>
                                        Split
                                    </strong>

                                    <p>
                                        Different available
                                        seats covering
                                        separate segments.
                                    </p>

                                </div>

                            </div>


                            <div className="help-option-card">

                                <div className="help-option-icon">
                                    🔀
                                </div>

                                <div>

                                    <strong>
                                        Mixed class
                                    </strong>

                                    <p>
                                        Different classes can
                                        be considered when
                                        the option is enabled.
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    NOTIFICATIONS
                ================================================= */}

                <section
                    id="help-notifications"
                    className="help-information-card"
                >

                    <div className="help-information-icon green">
                        🔔
                    </div>

                    <div>

                        <span className="help-section-label">
                            NOTIFICATIONS
                        </span>

                        <h2>
                            Stay updated
                        </h2>

                        <p>
                            ERJA can notify you about important
                            changes related to your monitored
                            railway journeys, including chart
                            preparation and journey updates.
                        </p>


                        <div className="help-notification-note">

                            <span>
                                ✓
                            </span>

                            <div>

                                <strong>
                                    Chart Prepared
                                </strong>

                                <p>
                                    A chart update notification
                                    can appear when the monitored
                                    train chart has been prepared.
                                </p>

                            </div>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    MIXED CLASS
                ================================================= */}

                <section
                    id="help-mixed"
                    className="help-information-card"
                >

                    <div className="help-information-icon purple">
                        🔀
                    </div>

                    <div>

                        <span className="help-section-label">
                            MIXED CLASS
                        </span>

                        <h2>
                            Mixed-class monitoring
                        </h2>

                        <p>
                            When mixed class is enabled for a
                            journey, ERJA can consider availability
                            from more than one travel class while
                            analyzing possible journey combinations.
                        </p>


                        <div className="help-warning-box">

                            <span>
                                i
                            </span>

                            <p>
                                Mixed-class recommendations
                                are only considered when the
                                option is enabled for the journey.
                            </p>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    TROUBLESHOOTING
                ================================================= */}

                <section
                    id="help-troubleshooting"
                    className="help-information-card"
                >

                    <div className="help-information-icon orange">
                        🛠
                    </div>

                    <div>

                        <span className="help-section-label">
                            TROUBLESHOOTING
                        </span>

                        <h2>
                            Something not showing?
                        </h2>

                        <p>
                            If a journey does not show a
                            recommendation, check the journey
                            details, chart status and available
                            vacancy information first.
                        </p>


                        <div className="help-troubleshooting-grid">

                            <div>
                                <strong>
                                    Chart not prepared
                                </strong>

                                <span>
                                    ERJA may still be waiting
                                    for chart information.
                                </span>
                            </div>


                            <div>
                                <strong>
                                    No recommendation
                                </strong>

                                <span>
                                    Available vacancy may not
                                    form a complete journey.
                                </span>
                            </div>


                            <div>
                                <strong>
                                    No vacancy
                                </strong>

                                <span>
                                    Railway vacancy data may
                                    currently contain no
                                    usable seats.
                                </span>
                            </div>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    FAQ
                ================================================= */}

                <section className="help-faq-section">

                    <div className="help-faq-header">

                        <div>

                            <span className="help-section-label">
                                COMMON QUESTIONS
                            </span>

                            <h2>
                                Frequently Asked{" "}
                                <span>
                                    Questions
                                </span>
                            </h2>

                        </div>

                        <p>
                            Quick answers to common
                            ERJA questions.
                        </p>

                    </div>


                    <div className="help-faq-list">

                        {faqs.map(
                            (
                                faq,
                                index
                            ) => {

                                const isOpen =
                                    openFaq ===
                                    index;


                                return (

                                    <div
                                        className={`help-faq-item ${
                                            isOpen
                                                ? "open"
                                                : ""
                                        }`}
                                        key={
                                            faq.question
                                        }
                                    >

                                        <button
                                            type="button"
                                            className="help-faq-question"
                                            onClick={() =>
                                                toggleFaq(
                                                    index
                                                )
                                            }
                                        >

                                            <span>
                                                {
                                                    faq.question
                                                }
                                            </span>

                                            <strong>
                                                {
                                                    isOpen
                                                        ? "−"
                                                        : "+"
                                                }
                                            </strong>

                                        </button>


                                        {isOpen && (

                                            <div className="help-faq-answer">

                                                <p>
                                                    {
                                                        faq.answer
                                                    }
                                                </p>

                                            </div>

                                        )}

                                    </div>

                                );

                            }
                        )}

                    </div>

                </section>


                {/* =================================================
                    QUICK ACTION
                ================================================= */}

                <section className="help-action-card">

                    <div>

                        <span>
                            NEED JOURNEY MONITORING?
                        </span>

                        <strong>
                            Start monitoring a railway journey.
                        </strong>

                    </div>


                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/add-journey"
                            )
                        }
                    >
                        Add Journey →
                    </button>

                </section>


                {/* =================================================
                    FOOTER
                ================================================= */}

                <div className="help-footer">

                    <span>
                        ERJA
                    </span>

                    <p>
                        Emergency Railway Journey Assistant
                    </p>

                </div>

            </main>

        </div>

    );

}


export default Help;