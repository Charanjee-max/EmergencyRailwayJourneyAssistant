const scoreEngine = require("../../scoring/ScoreEngine");

class SplitMixedClassStrategy {
    execute(graph, journey) {
        const solutions = [];

        const source = journey.source;
        const destination = journey.destination;
        const preferredClasses = journey.preferredClasses || [];

        console.log("\n========== SPLIT MIXED CLASS ==========");
        console.log("Source:", source);
        console.log("Destination:", destination);
        console.log("Preferred Classes:", preferredClasses);
        console.log("Allow Mixed Class:", journey.allowMixedClass);

        // Mixed class is only allowed when the user explicitly enabled it.
        if (!journey.allowMixedClass) {
            console.log("⛔ Mixed class disabled by user.");
            return solutions;
        }

        for (const firstClass of preferredClasses) {
            for (const secondClass of preferredClasses) {

                if (firstClass === secondClass) {
                    continue;
                }

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

                                        const sameCoach =
                                            firstCoach.coach === secondCoach.coach;

                                        console.log("✅ Mixed Strategy Found");
                                        console.dir(tickets, { depth: null });

                                        solutions.push({
                                            success: true,

                                            strategy: "SPLIT_MIXED_CLASS",

                                            score: scoreEngine.calculate({
                                                strategy: "SPLIT_MIXED_CLASS",
                                                tickets,
                                                sameCoach,
                                                sameClass: false
                                            }),

                                            tickets,

                                            reason: sameCoach
                                                ? "Split reservation using different classes in the same coach."
                                                : "Split reservation using different travel classes."
                                        });

                                    });

                                });

                            });

                        });

                    });

                });

            }
        }

        console.log(
            "\nTOTAL MIXED CLASS SOLUTIONS:",
            solutions.length
        );

        return solutions;
    }
}

module.exports = new SplitMixedClassStrategy();