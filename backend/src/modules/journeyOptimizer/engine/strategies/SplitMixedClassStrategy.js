const scoreEngine =
    require("../../scoring/ScoreEngine");

const {
    normalizeCode,
    getStationOrder,
    edgeCoversSegment
} = require("../reservationCoverage");

class SplitMixedClassStrategy {

    execute(graph, journey) {

        const solutions = [];

        if (!journey.allowMixedClass) {
            console.log(
                "⛔ Mixed class disabled."
            );

            return [];
        }

        const source =
            normalizeCode(journey.source);

        const destination =
            normalizeCode(journey.destination);

        const preferredClasses =
            journey.preferredClasses || [];

        const sourceOrder =
            getStationOrder(graph, source);

        const destinationOrder =
            getStationOrder(
                graph,
                destination
            );

        if (
            sourceOrder === null ||
            destinationOrder === null
        ) {
            return [];
        }

        const availableClasses = [
            ...new Set(
                graph.edges
                    .map(
                        (edge) =>
                            normalizeCode(
                                edge.class
                            )
                    )
                    .filter(Boolean)
            )
        ];

        console.log(
            "\n========== SPLIT MIXED CLASS =========="
        );

        console.log(
            "Available Classes:",
            availableClasses
        );

        for (
            const firstClass
            of preferredClasses
        ) {

            const normalizedFirstClass =
                normalizeCode(firstClass);

            const secondClasses =
                availableClasses.filter(
                    (className) =>
                        className !==
                        normalizedFirstClass
                );

            for (
                const secondClass
                of secondClasses
            ) {

                const splitStations =
                    (graph.nodes || []).filter(
                        (node) => {

                            const order =
                                Number(node.order);

                            return (
                                order >
                                    sourceOrder &&
                                order <
                                    destinationOrder
                            );
                        }
                    );

                for (
                    const split
                    of splitStations
                ) {

                    const splitCode =
                        normalizeCode(
                            split.code
                        );

                    const firstLegs =
                        graph.edges.filter(
                            (edge) =>
                                normalizeCode(
                                    edge.class
                                ) ===
                                    normalizedFirstClass &&
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
                                normalizeCode(
                                    edge.class
                                ) ===
                                    secondClass &&
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

                    firstLegs.sort(
                        (a, b) =>
                            (b.totalAvailable || 0) -
                            (a.totalAvailable || 0)
                    );

                    secondLegs.sort(
                        (a, b) =>
                            (b.totalAvailable || 0) -
                            (a.totalAvailable || 0)
                    );

                    const first =
                        firstLegs[0];

                    const second =
                        secondLegs[0];

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
                            class:
                                normalizedFirstClass,
                            coach:
                                firstOpportunity.coach,
                            berth:
                                firstOpportunity.berths[0]
                        },
                        {
                            from: splitCode,
                            to: destination,
                            class: secondClass,
                            coach:
                                secondOpportunity.coach,
                            berth:
                                secondOpportunity.berths[0]
                        }
                    ];

                    const sameCoach =
                        firstOpportunity.coach ===
                        secondOpportunity.coach;

                    solutions.push({

                        success: true,

                        strategy:
                            "SPLIT_MIXED_CLASS",

                        score:
                            scoreEngine.calculate({
                                strategy:
                                    "SPLIT_MIXED_CLASS",
                                tickets,
                                sameCoach,
                                sameClass: false
                            }),

                        tickets,

                        reason:
                            `Mixed-class split at ${splitCode}: ` +
                            `${normalizedFirstClass} → ${secondClass}.`

                    });

                    /*
                     * Only one best mixed strategy.
                     */
                    return solutions;
                }
            }
        }

        console.log(
            "TOTAL MIXED CLASS SOLUTIONS:",
            solutions.length
        );

        return solutions;
    }
}

module.exports =
    new SplitMixedClassStrategy();