class DirectStrategy {

    execute(graph, journey) {

        const edge = graph.edges.find(e =>
            e.from === journey.source &&
            e.to === journey.destination &&
            journey.preferredClasses.includes(e.class)
        );

        if (!edge) {

            return {
                success: false,
                strategy: "DIRECT",
                score: 0,
                tickets: [],
                reason: "Direct reservation not available."
            };

        }

        const firstOpportunity = edge.opportunities[0];

        return {

            success: true,

            strategy: "DIRECT",

            score: 100,

            tickets: [
                {
                    from: edge.from,
                    to: edge.to,
                    class: edge.class,
                    coach: firstOpportunity.coach,
                    berth: firstOpportunity.berths[0]
                }
            ],

            reason: "Direct confirmed reservation available."

        };

    }

}

module.exports = new DirectStrategy();