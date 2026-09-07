const scoreEngine =
    require("../../scoring/ScoreEngine");

const {
    normalizeCode,
    getStationOrder,
    edgeCoversSegment
} = require("../reservationCoverage");

class SplitSameClassStrategy {

    execute(graph, journey) {

        const solutions = [];

        const source =
            normalizeCode(journey.source);

        const destination =
            normalizeCode(journey.destination);

        const preferredClasses =
            journey.preferredClasses || [];

        const sourceOrder =
            getStationOrder(graph, source);

        const destinationOrder =
            getStationOrder(graph, destination);

        console.log(
            "\n========== SPLIT SAME CLASS =========="
        );

        if (
            sourceOrder === null ||
            destinationOrder === null
        ) {
            return [];
        }

        for (const travelClass of preferredClasses) {

            const normalizedClass =
                normalizeCode(travelClass);

            /*
             * Split station must be strictly between
             * source and destination.
             */
            const splitStations =
                (graph.nodes || []).filter(
                    (node) => {

                        const order =
                            Number(node.order);

                        return (
                            order > sourceOrder &&
                            order < destinationOrder
                        );
                    }
                );

            for (const split of splitStations) {

                const splitCode =
                    normalizeCode(split.code);

                const firstLegs =
                    graph.edges.filter(
                        (edge) =>
                            normalizeCode(edge.class) ===
                                normalizedClass &&
                            edgeCoversSegment(
                                graph,
                                edge,
                                source,
                                splitCode
                            )
                    );

                const secondLegs =
                    graph.edges.filter(
                        (edge) =>
                            normalizeCode(edge.class) ===
                                normalizedClass &&
                            edgeCoversSegment(
                                graph,
                                edge,
                                splitCode,
                                destination
                            )
                    );

                if (
                    !firstLegs.length ||
                    !secondLegs.length
                ) {
                    continue;
                }

                const first =
                    firstLegs.sort(
                        (a, b) =>
                            (b.totalAvailable || 0) -
                            (a.totalAvailable || 0)
                    )[0];

                const second =
                    secondLegs.sort(
                        (a, b) =>
                            (b.totalAvailable || 0) -
                            (a.totalAvailable || 0)
                    )[0];

                const firstOpportunity =
                    (first.opportunities || [])
                        .find(
                            (opportunity) =>
                                opportunity.berths &&
                                opportunity.berths.length
                        );

                const secondOpportunity =
                    (second.opportunities || [])
                        .find(
                            (opportunity) =>
                                opportunity.berths &&
                                opportunity.berths.length
                        );

                if (
                    !firstOpportunity ||
                    !secondOpportunity
                ) {
                    continue;
                }

                const tickets = [
                    {
                        from: source,
                        to: splitCode,
                        class: normalizedClass,
                        coach:
                            firstOpportunity.coach,
                        berth:
                            firstOpportunity.berths[0]
                    },
                    {
                        from: splitCode,
                        to: destination,
                        class: normalizedClass,
                        coach:
                            secondOpportunity.coach,
                        berth:
                            secondOpportunity.berths[0]
                    }
                ];

                const sameCoach =
                    firstOpportunity.coach ===
                    secondOpportunity.coach;

                const solution = {

                    success: true,

                    strategy:
                        "SPLIT_SAME_CLASS",

                    score:
                        scoreEngine.calculate({
                            strategy:
                                "SPLIT_SAME_CLASS",
                            tickets,
                            sameCoach,
                            sameClass: true
                        }),

                    tickets,

                    reason:
                        sameCoach
                            ? `Same-class split at ${splitCode}; both tickets use the same coach.`
                            : `Same-class split at ${splitCode}.`

                };

                solutions.push(solution);

                /*
                 * We only need the best same-class
                 * split strategy.
                 */
                break;
            }

            if (solutions.length) {
                break;
            }
        }

        console.log(
            "TOTAL SAME-CLASS SOLUTIONS:",
            solutions.length
        );

        return solutions;
    }
}

module.exports =
    new SplitSameClassStrategy();