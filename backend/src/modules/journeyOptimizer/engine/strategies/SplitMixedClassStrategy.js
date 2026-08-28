class SplitMixedClassStrategy {

    execute(graph, journey) {

        const solutions = [];

        const source = journey.source;
        const destination = journey.destination;
        const preferredClasses = journey.preferredClasses || [];

        console.log("\n========== SPLIT MIXED CLASS ==========");
        console.log("Source:", source);
        console.log("Destination:", destination);

        for (const firstClass of preferredClasses) {

            for (const secondClass of preferredClasses) {

                if (firstClass === secondClass) continue;

                console.log(`Checking ${firstClass} -> ${secondClass}`);

                const firstLegs = graph.edges.filter(edge =>
                    edge.from === source &&
                    edge.class === firstClass
                );

                firstLegs.forEach(first => {

                    const secondLegs = graph.edges.filter(edge =>
                        edge.from === first.to &&
                        edge.to === destination &&
                        edge.class === secondClass
                    );

                    secondLegs.forEach(second => {

                        first.opportunities.forEach(firstCoach => {

                            second.opportunities.forEach(secondCoach => {

                                firstCoach.berths.forEach(firstBerth => {

                                    secondCoach.berths.forEach(secondBerth => {

                                        console.log("✅ Mixed Strategy Found");

                                        solutions.push({

                                            success: true,

                                            strategy: "SPLIT_MIXED_CLASS",

                                            score: 92,

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

                                            reason:
                                                "Split reservation using different travel classes."

                                        });

                                    });

                                });

                            });

                        });

                    });

                });

            }

        }

        console.log("\nTOTAL MIXED CLASS SOLUTIONS:", solutions.length);

        return solutions;

    }

}

module.exports = new SplitMixedClassStrategy();