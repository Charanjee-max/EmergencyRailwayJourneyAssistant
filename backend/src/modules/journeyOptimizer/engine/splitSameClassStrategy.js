class SplitSameClassStrategy {

    execute(graph, journey) {

        const solutions = [];

        const source = journey.source;
        const destination = journey.destination;

        const preferredClasses = journey.preferredClasses || [];

        for (const travelClass of preferredClasses) {

            // First Ticket
            const firstLegs = graph.edges.filter(edge =>
                edge.from === source &&
                edge.class === travelClass
            );

            firstLegs.forEach(first => {

                // Second Ticket
                const secondLegs = graph.edges.filter(edge =>
                    edge.from === first.to &&
                    edge.to === destination &&
                    edge.class === travelClass
                );

                secondLegs.forEach(second => {

                    first.opportunities.forEach(firstCoach => {

                        second.opportunities.forEach(secondCoach => {

                            firstCoach.berths.forEach(firstBerth => {

                                secondCoach.berths.forEach(secondBerth => {

                                    const sameCoach =
                                        firstCoach.coach === secondCoach.coach;

                                    solutions.push({

                                        success: true,

                                        strategy: "SPLIT_SAME_CLASS",

                                        score: sameCoach ? 97 : 95,

                                        tickets: [

                                            {
                                                from: first.from,
                                                to: first.to,
                                                class: first.class,
                                                coach: firstCoach.coach,
                                                berth: firstBerth
                                            },

                                            {
                                                from: second.from,
                                                to: second.to,
                                                class: second.class,
                                                coach: secondCoach.coach,
                                                berth: secondBerth
                                            }

                                        ],

                                        reason: sameCoach
                                            ? "Same-class split reservation (same coach)."
                                            : "Same-class split reservation."

                                    });

                                });

                            });

                        });

                    });

                });

            });

        }

        return solutions;

    }

}

module.exports = new SplitSameClassStrategy();