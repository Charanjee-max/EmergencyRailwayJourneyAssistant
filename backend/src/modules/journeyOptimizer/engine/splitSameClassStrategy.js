class SplitSameClassStrategy {

    execute(graph, journey) {

        const source = journey.source;
        const destination = journey.destination;

        const preferredClasses = journey.preferredClasses || [];

        for (const travelClass of preferredClasses) {

            // First Leg
            const firstLegs = graph.edges.filter(edge =>
                edge.from === source &&
                edge.class === travelClass
            );

            for (const first of firstLegs) {

                // Second Leg
                const second = graph.edges.find(edge =>
                    edge.from === first.to &&
                    edge.to === destination &&
                    edge.class === travelClass
                );

                if (second) {

                    return {

                        success: true,

                        strategy: "SPLIT_SAME_CLASS",

                        score: 95,

                        tickets: [

                            {
                                from: first.from,
                                to: first.to,
                                class: first.class,
                                coach: first.opportunities[0].coach,
                                berth: first.opportunities[0].berths[0]
                            },

                            {
                                from: second.from,
                                to: second.to,
                                class: second.class,
                                coach: second.opportunities[0].coach,
                                berth: second.opportunities[0].berths[0]
                            }

                        ],

                        reason: "Same-class split reservation found."

                    };

                }

            }

        }

        return {

            success: false,

            strategy: "SPLIT_SAME_CLASS",

            score: 0,

            tickets: [],

            reason: "No same-class split reservation available."

        };

    }

}

module.exports = new SplitSameClassStrategy();