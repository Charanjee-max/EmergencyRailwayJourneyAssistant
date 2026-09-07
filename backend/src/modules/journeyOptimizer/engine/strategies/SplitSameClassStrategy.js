const scoreEngine =
    require("../../scoring/ScoreEngine");

const {
    normalizeCode,
    getStationOrder,
    edgeCoversSegment,
} = require("../reservationCoverage");

class SplitSameClassStrategy {

    execute(graph, journey) {

        const solutions = [];

        const source =
            normalizeCode(
                journey.source
            );

        const destination =
            normalizeCode(
                journey.destination
            );

        const preferredClasses =
            journey.preferredClasses || [];

        const sourceOrder =
            getStationOrder(
                graph,
                source
            );

        const destinationOrder =
            getStationOrder(
                graph,
                destination
            );

        console.log(
            "\n========== SPLIT SAME CLASS =========="
        );

        if (
            sourceOrder === null ||
            destinationOrder === null
        ) {
            return [];
        }

        if (
            sourceOrder >= destinationOrder
        ) {
            return [];
        }

        for (
            const travelClass
            of preferredClasses
        ) {

            const normalizedClass =
                normalizeCode(
                    travelClass
                );

            /*
             * Split station must be strictly
             * between source and destination.
             */
            const splitStations =
                (graph.nodes || []).filter(
                    (node) => {

                        const order =
                            Number(
                                node.order
                            );

                        return (
                            Number.isFinite(order) &&
                            order > sourceOrder &&
                            order < destinationOrder
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

                // =================================================
                // FIRST LEG
                // =================================================

                const firstLegs =
                    graph.edges.filter(
                        (edge) =>
                            normalizeCode(
                                edge.class
                            ) ===
                            normalizedClass &&

                            edgeCoversSegment(
                                graph,
                                edge,
                                source,
                                splitCode
                            )
                    );

                // =================================================
                // SECOND LEG
                // =================================================

                const secondLegs =
                    graph.edges.filter(
                        (edge) =>
                            normalizeCode(
                                edge.class
                            ) ===
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

                /*
                 * Prefer edges with the largest
                 * availability.
                 */
                const sortedFirstLegs =
                    [...firstLegs].sort(
                        (a, b) =>
                            (b.totalAvailable || 0) -
                            (a.totalAvailable || 0)
                    );

                const sortedSecondLegs =
                    [...secondLegs].sort(
                        (a, b) =>
                            (b.totalAvailable || 0) -
                            (a.totalAvailable || 0)
                    );

                let selectedPair = null;

                // =================================================
                // FIND TWO VALID OPPORTUNITIES
                // =================================================

                for (
                    const first
                    of sortedFirstLegs
                ) {

                    const firstOpportunities =
                        (first.opportunities || [])
                            .filter(
                                (opportunity) =>
                                    opportunity.berths &&
                                    opportunity.berths.length
                            );

                    if (
                        !firstOpportunities.length
                    ) {
                        continue;
                    }

                    for (
                        const second
                        of sortedSecondLegs
                    ) {

                        const secondOpportunities =
                            (second.opportunities || [])
                                .filter(
                                    (opportunity) =>
                                        opportunity.berths &&
                                        opportunity.berths.length
                                );

                        if (
                            !secondOpportunities.length
                        ) {
                            continue;
                        }

                        /*
                         * We first try to find DIFFERENT
                         * berth identities.
                         *
                         * This prevents a recommendation
                         * such as:
                         *
                         * SC  -> CHZ   B1/38
                         * CHZ -> BDCR  B1/38
                         *
                         * from being treated as two
                         * independent tickets.
                         */
                        let foundDifferentBerths =
                            null;

                        for (
                            const firstOpportunity
                            of firstOpportunities
                        ) {

                            for (
                                const secondOpportunity
                                of secondOpportunities
                            ) {

                                const firstBerth =
                                    firstOpportunity
                                        .berths[0];

                                const secondBerth =
                                    secondOpportunity
                                        .berths[0];

                                const firstIdentity =
                                    this.getBerthIdentity(
                                        firstOpportunity,
                                        firstBerth
                                    );

                                const secondIdentity =
                                    this.getBerthIdentity(
                                        secondOpportunity,
                                        secondBerth
                                    );

                                if (
                                    firstIdentity !==
                                    secondIdentity
                                ) {

                                    foundDifferentBerths = {

                                        first,

                                        second,

                                        firstOpportunity,

                                        secondOpportunity,

                                        firstBerth,

                                        secondBerth,
                                    };

                                    break;
                                }
                            }

                            if (
                                foundDifferentBerths
                            ) {
                                break;
                            }
                        }

                        if (
                            foundDifferentBerths
                        ) {

                            selectedPair =
                                foundDifferentBerths;

                            break;
                        }
                    }

                    if (
                        selectedPair
                    ) {
                        break;
                    }
                }

                /*
                 * If we could not find two distinct
                 * berth identities, DO NOT create a
                 * split recommendation.
                 */
                if (
                    !selectedPair
                ) {

                    console.log(
                        `⚠️ No valid distinct-berth same-class split found at ${splitCode}.`
                    );

                    continue;
                }

                const {
                    first,
                    second,
                    firstOpportunity,
                    secondOpportunity,
                    firstBerth,
                    secondBerth,
                } =
                    selectedPair;

                // =================================================
                // BUILD TICKETS
                // =================================================

                const tickets = [

                    {
                        from:
                            source,

                        to:
                            splitCode,

                        class:
                            normalizedClass,

                        coach:
                            firstOpportunity.coach,

                        berth:
                            firstBerth,
                    },

                    {
                        from:
                            splitCode,

                        to:
                            destination,

                        class:
                            normalizedClass,

                        coach:
                            secondOpportunity.coach,

                        berth:
                            secondBerth,
                    },
                ];

                // =================================================
                // EXTRA SAFETY
                // =================================================

                const firstIdentity =
                    this.getBerthIdentity(
                        firstOpportunity,
                        firstBerth
                    );

                const secondIdentity =
                    this.getBerthIdentity(
                        secondOpportunity,
                        secondBerth
                    );

                if (
                    firstIdentity ===
                    secondIdentity
                ) {

                    console.log(
                        "⚠️ Same berth identity detected. Split recommendation rejected."
                    );

                    continue;
                }

                const sameCoach =
                    firstOpportunity.coach ===
                    secondOpportunity.coach;

                // =================================================
                // SCORE
                // =================================================

                const score =
                    scoreEngine.calculate({

                        strategy:
                            "SPLIT_SAME_CLASS",

                        tickets,

                        sameCoach,

                        sameClass:
                            true,
                    });

                // =================================================
                // SOLUTION
                // =================================================

                const solution = {

                    success:
                        true,

                    strategy:
                        "SPLIT_SAME_CLASS",

                    score,

                    tickets,

                    reason:
                        sameCoach
                            ? `Same-class split at ${splitCode}; two distinct berths in the same coach.`
                            : `Same-class split at ${splitCode}; two distinct available berths.`,

                };

                solutions.push(
                    solution
                );

                /*
                 * We only need the best
                 * same-class split strategy.
                 */
                break;
            }

            if (
                solutions.length
            ) {
                break;
            }
        }

        console.log(
            "TOTAL SAME-CLASS SOLUTIONS:",
            solutions.length
        );

        return solutions;
    }

    // =====================================================
    // BERTH IDENTITY
    // =====================================================

    getBerthIdentity(
        opportunity,
        berth
    ) {

        const coach =
            String(
                opportunity?.coach ||
                ""
            )
                .trim()
                .toUpperCase();

        const berthNumber =
            String(
                berth ??
                ""
            )
                .trim()
                .toUpperCase();

        return [
            coach,
            berthNumber,
        ].join("|");
    }
}

module.exports =
    new SplitSameClassStrategy();