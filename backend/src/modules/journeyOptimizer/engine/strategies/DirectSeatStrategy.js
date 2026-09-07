const {
    normalizeCode,
    edgeCoversJourney
} = require("../reservationCoverage");

class DirectSeatStrategy {

    execute(graph, journey) {

        const solutions = [];

        const source =
            normalizeCode(journey.source);

        const destination =
            normalizeCode(journey.destination);

        const preferredClasses =
            journey.preferredClasses || [];

        console.log(
            "\n========== DIRECT SEAT STRATEGY =========="
        );

        console.log("Source:", source);
        console.log("Destination:", destination);
        console.log(
            "Preferred Classes:",
            preferredClasses
        );

        for (const travelClass of preferredClasses) {

            const normalizedClass =
                normalizeCode(travelClass);

            const coveringEdges =
                graph.edges.filter((edge) =>
                    normalizeCode(edge.class) ===
                        normalizedClass &&
                    edgeCoversJourney(
                        graph,
                        edge,
                        source,
                        destination
                    )
                );

            if (!coveringEdges.length) {
                console.log(
                    `❌ No ${normalizedClass} direct coverage`
                );
                continue;
            }

            /*
             * Find the edge with the largest availability.
             */
            coveringEdges.sort(
                (a, b) =>
                    (b.totalAvailable || 0) -
                    (a.totalAvailable || 0)
            );

            const bestEdge =
                coveringEdges[0];

            let bestOpportunity = null;

            for (
                const opportunity
                of bestEdge.opportunities || []
            ) {

                if (
                    !opportunity.berths ||
                    !opportunity.berths.length
                ) {
                    continue;
                }

                if (
                    !bestOpportunity ||
                    opportunity.berths.length >
                        bestOpportunity.berths.length
                ) {
                    bestOpportunity =
                        opportunity;
                }
            }

            if (!bestOpportunity) {
                continue;
            }

            const bestBerth =
                bestOpportunity.berths[0];

            const solution = {

                success: true,

                strategy: "DIRECT_SEAT",

                score: 100,

                tickets: [
                    {
                        from: source,
                        to: destination,
                        class: normalizedClass,
                        coach:
                            bestOpportunity.coach,
                        berth: bestBerth
                    }
                ],

                reason:
                    `${bestEdge.totalAvailable} vacant ` +
                    `${normalizedClass} berths cover ` +
                    `${source} → ${destination}. ` +
                    `Best available option: ` +
                    `${bestOpportunity.coach}/${bestBerth}.`

            };

            console.log(
                "✅ Direct journey coverage found"
            );

            console.dir(
                solution,
                { depth: null }
            );

            solutions.push(solution);

            /*
             * Only one DIRECT_SEAT recommendation.
             */
            break;
        }

        console.log(
            "\nDIRECT SEAT RECOMMENDATIONS:",
            solutions.length
        );

        console.log(
            "================================\n"
        );

        return solutions;
    }
}

module.exports =
    new DirectSeatStrategy();