const scoreEngine = require("../../scoring/ScoreEngine");

class SplitSameClassStrategy {

    execute(graph, journey) {

        const solutions = [];

        const source = journey.source;
        const destination = journey.destination;
        const preferredClasses = journey.preferredClasses || [];

        console.log("\n========== SPLIT SAME CLASS ==========");
        console.log("Source:", source);
        console.log("Destination:", destination);
        console.log("Preferred Classes:", preferredClasses);

        for (const travelClass of preferredClasses) {

            console.log(`\nChecking Class: ${travelClass}`);

            // First ticket
            const firstLegs = graph.edges.filter(edge =>
                edge.from === source &&
                edge.class === travelClass
            );

            console.log("First Legs:");
            console.dir(firstLegs, { depth: null });

            firstLegs.forEach(first => {

                // Second ticket
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
                                        first: `${first.from} -> ${first.to}`,
                                        second: `${second.from} -> ${second.to}`,
                                        firstCoach: firstCoach.coach,
                                        secondCoach: secondCoach.coach
                                    });

                                    const tickets = [
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
                                    ];

                                    solutions.push({
                                        success: true,
                                        strategy: "SPLIT_SAME_CLASS",

                                        score: scoreEngine.calculate({
                                            strategy: "SPLIT_SAME_CLASS",
                                            tickets,
                                            sameCoach,
                                            sameClass: true
                                        }),

                                        tickets,

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
        console.log("================================\n");

        return solutions;
    }

}

module.exports = new SplitSameClassStrategy();