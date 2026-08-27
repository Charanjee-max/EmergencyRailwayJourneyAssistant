class DirectStrategy {

    execute(graph, journey) {

        const solutions = [];

        const preferredClasses = journey.preferredClasses || [];

        for (const travelClass of preferredClasses) {

            const edge = graph.edges.find(e =>
                e.from === journey.source &&
                e.to === journey.destination &&
                e.class === travelClass
            );

            if (!edge) continue;

            edge.opportunities.forEach(opportunity => {

                opportunity.berths.forEach(berth => {

                    solutions.push({

                        success: true,

                        strategy: "DIRECT",

                        score: 100,

                        tickets: [

                            {
                                from: edge.from,
                                to: edge.to,
                                class: edge.class,
                                coach: opportunity.coach,
                                berth
                            }

                        ],

                        reason: "Direct reservation available."

                    });

                });

            });

        }

        return solutions;

    }

}

module.exports = new DirectStrategy();