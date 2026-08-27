class SplitSameClassStrategy {

    execute(graph, journey) {

        const solutions = [];

        const source = journey.source;
        const destination = journey.destination;

        const preferredClasses = journey.preferredClasses || [];

        console.log("\n========== STRATEGY INPUT ==========");
        console.log("Source:", source);
        console.log("Destination:", destination);
        console.log("Preferred Classes:", preferredClasses);
        console.log("Graph Edges:");
        console.dir(graph.edges, { depth: null });

        for (const travelClass of preferredClasses) {

            console.log("\n================================");
            console.log("Checking Class:", travelClass);
            console.log("================================");

            // First Ticket
            const firstLegs = graph.edges.filter(edge =>
                edge.from === source &&
                edge.class === travelClass
            );

            console.log("First Legs:");
            console.dir(firstLegs, { depth: null });

            firstLegs.forEach(first => {

                // Second Ticket
                const secondLegs = graph.edges.filter(edge =>
                    edge.from === first.to &&
                    edge.to === destination &&
                    edge.class === travelClass
                );

                console.log("Second Legs:");
                console.dir(secondLegs, { depth: null });

                secondLegs.forEach(second => {

                    first.opportunities.forEach(firstCoach => {

                        second.opportunities.forEach(secondCoach => {

                            firstCoach.berths.forEach(firstBerth => {

                                secondCoach.berths.forEach(secondBerth => {

                                    const sameCoach =
                                        firstCoach.coach === secondCoach.coach;

                                    console.log("✅ Strategy Found");
                                    console.log({
                                        first: first.from + " -> " + first.to,
                                        second: second.from + " -> " + second.to,
                                        firstCoach: firstCoach.coach,
                                        secondCoach: secondCoach.coach
                                    });

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

        console.log("\n================================");
        console.log("TOTAL SOLUTIONS:", solutions.length);
        console.log("================================");

        return solutions;

    }

}

module.exports = new SplitSameClassStrategy();