class DirectSeatStrategy {
    execute(graph, journey) {

        const solutions = [];

        const source = journey.source;
        const destination = journey.destination;
        const preferredClasses = journey.preferredClasses || [];

        console.log("\n========== DIRECT SEAT STRATEGY ==========");
        console.log("Source:", source);
        console.log("Destination:", destination);
        console.log("Preferred Classes:", preferredClasses);

        for (const travelClass of preferredClasses) {

            console.log("\nChecking Class:", travelClass);

            const directEdges = graph.edges.filter(edge =>
                edge.from === source &&
                edge.to === destination &&
                edge.class === travelClass
            );

            console.log("Direct Edges:");
            console.dir(directEdges, { depth: null });

            directEdges.forEach(edge => {

                edge.opportunities.forEach(opportunity => {

                    opportunity.berths.forEach(berth => {

                        console.log("✅ Direct Seat Found");

                        solutions.push({

                            success: true,

                            strategy: "DIRECT_SEAT",

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

                            reason: "Direct seat available."

                        });

                    });

                });

            });

        }

        console.log("\n================================");
        console.log("DIRECT SEAT SOLUTIONS:", solutions.length);
        console.log("================================");

        return solutions;
    }
}

module.exports = new DirectSeatStrategy();