class RecommendationFormatter {

    format(recommendations = []) {

        return recommendations.map((recommendation, index) => ({

            rank: index + 1,

            title: this.getTitle(recommendation.strategy),

            confidence: `${recommendation.score}%`,

            strategy: recommendation.strategy,

            reason: recommendation.reason,

            tickets: recommendation.tickets.map(ticket => ({

                from: ticket.from,

                to: ticket.to,

                class: ticket.class,

                coach: ticket.coach,

                berth: ticket.berth

            })),

            instructions: this.buildInstructions(recommendation),

            warnings: this.buildWarnings(recommendation)

        }));

    }

    getTitle(strategy) {

        switch (strategy) {

            case "SPLIT_SAME_CLASS":
                return "Book Two Tickets (Same Class)";

            case "SPLIT_MIXED_CLASS":
                return "Book Two Tickets (Mixed Class)";

            case "THREE_SPLIT":
                return "Book Three Split Tickets";

            default:
                return "Reservation Recommendation";

        }

    }

    buildInstructions(recommendation) {

        return recommendation.tickets.map((ticket, index) =>

            `Ticket ${index + 1}: ${ticket.from} → ${ticket.to} | ${ticket.class} | Coach ${ticket.coach} | Berth ${ticket.berth}`

        );

    }

    buildWarnings(recommendation) {

        const warnings = [];

        if (recommendation.tickets.length > 1) {

            warnings.push(
                "Book all tickets immediately to avoid losing availability."
            );

        }

        const classes = [
            ...new Set(
                recommendation.tickets.map(ticket => ticket.class)
            )
        ];

        if (classes.length > 1) {

            warnings.push(
                "Journey includes multiple travel classes."
            );

        }

        return warnings;

    }

}

module.exports = new RecommendationFormatter();