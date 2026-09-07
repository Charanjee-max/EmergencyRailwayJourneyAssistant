// =========================================================
// RECOMMENDATION FORMATTER
// =========================================================

class RecommendationFormatter {

    // =====================================================
    // FORMAT
    // =====================================================

    format(
        recommendations = []
    ) {

        return recommendations.map(
            (recommendation, index) => {

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

                return {

                    rank:
                        index + 1,

                    title:
                        this.getTitle(
                            recommendation.strategy
                        ),

                    confidence:
                        `${recommendation.score}%`,

                    strategy:
                        recommendation.strategy,

                    reason:
                        recommendation.reason || "",

                    // =====================================
                    // VACANCIES BY CLASS
                    // =====================================

                    vacancySummary:
                        vacancySummary.map(
                            (item) => ({

                                class:
                                    item.class,

                                count:
                                    item.count,

                                status:
                                    item.status,

                                error:
                                    item.error || "",
                            })
                        ),

                    // =====================================
                    // TICKETS
                    // =====================================

                    tickets:
                        tickets.map(
                            (ticket) => ({

                                from:
                                    ticket.from,

                                to:
                                    ticket.to,

                                class:
                                    ticket.class,

                                coach:
                                    ticket.coach,

                                berth:
                                    ticket.berth,
                            })
                        ),

                    instructions:
                        this.buildInstructions(
                            {
                                ...recommendation,

                                tickets,
                            }
                        ),

                    warnings:
                        this.buildWarnings(
                            {
                                ...recommendation,

                                tickets,
                            }
                        ),
                };
            }
        );
    }

    // =====================================================
    // TITLE
    // =====================================================

    getTitle(strategy) {

        switch (strategy) {

            case "DIRECT_SEAT":

                return "Direct Seat Available";

            case "SPLIT_SAME_CLASS":

                return "Book Split Tickets - Same Class";

            case "SPLIT_MIXED_CLASS":

                return "Book Split Tickets - Mixed Class";

            case "MULTI_HOP":

                return "Multi-Hop Reservation";

            case "WAIT_FOR_CHART":

                return "Wait for Chart Preparation";

            case "TTE_RECOMMENDATION":

                return "TTE Recommendation";

            case "TTE":

                return "TTE Recommendation";

            default:

                return "Reservation Recommendation";
        }
    }

    // =====================================================
    // INSTRUCTIONS
    // =====================================================

    buildInstructions(
        recommendation
    ) {

        const tickets =
            Array.isArray(
                recommendation.tickets
            )
                ? recommendation.tickets
                : [];

        if (
            tickets.length === 0
        ) {

            return [];
        }

        return tickets.map(
            (ticket, index) =>

                `Ticket ${index + 1}: ` +
                `${ticket.from} → ${ticket.to} | ` +
                `${ticket.class} | ` +
                `Coach ${ticket.coach || "N/A"} | ` +
                `Berth ${ticket.berth || "N/A"}`
        );
    }

    // =====================================================
    // WARNINGS
    // =====================================================

    buildWarnings(
        recommendation
    ) {

        const warnings = [];

        const tickets =
            Array.isArray(
                recommendation.tickets
            )
                ? recommendation.tickets
                : [];

        // -------------------------------------------------
        // Multiple tickets
        // -------------------------------------------------

        if (
            tickets.length > 1
        ) {

            warnings.push(
                "Book all tickets immediately to avoid losing availability."
            );
        }

        // -------------------------------------------------
        // Multiple classes
        // -------------------------------------------------

        const classes = [
            ...new Set(
                tickets
                    .map(
                        (ticket) =>
                            ticket.class
                    )
                    .filter(Boolean)
            ),
        ];

        if (
            classes.length > 1
        ) {

            warnings.push(
                "Journey includes multiple travel classes."
            );
        }

        return warnings;
    }
}

// =========================================================
// EXPORT
// =========================================================

module.exports =
    new RecommendationFormatter();