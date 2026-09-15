"use strict";

const {
    normalizeCode,
    edgeCoversJourney,
} = require("../reservationCoverage");

class DirectSeatStrategy {
    execute(graph, journey) {
        const solutions = [];

        if (!graph || !journey) {
            console.log(
                "❌ DirectSeatStrategy: Missing graph or journey."
            );

            return solutions;
        }

        const source = normalizeCode(
            journey.source
        );

        const destination = normalizeCode(
            journey.destination
        );

        const preferredClasses =
            Array.isArray(
                journey.preferredClasses
            )
                ? journey.preferredClasses
                : [];

        console.log(
            "\n========== DIRECT SEAT STRATEGY =========="
        );

        console.log(
            "Source:",
            source
        );

        console.log(
            "Destination:",
            destination
        );

        console.log(
            "Preferred Classes:",
            preferredClasses
        );

        /*
         * Basic validation.
         */
        if (!source || !destination) {
            console.log(
                "❌ Missing source or destination."
            );

            return solutions;
        }

        if (source === destination) {
            console.log(
                "❌ Source and destination are identical."
            );

            return solutions;
        }

        /*
         * Validate requested route direction
         * before processing vacancies.
         */
        const sourceNode = (
            graph.nodes || []
        ).find(
            (node) =>
                normalizeCode(node.code) ===
                source
        );

        const destinationNode = (
            graph.nodes || []
        ).find(
            (node) =>
                normalizeCode(node.code) ===
                destination
        );

        if (!sourceNode || !destinationNode) {
            console.log(
                "❌ Source or destination not found in graph."
            );

            return solutions;
        }

        const sourceOrder =
            Number(sourceNode.order);

        const destinationOrder =
            Number(destinationNode.order);

        if (
            !Number.isFinite(sourceOrder) ||
            !Number.isFinite(destinationOrder) ||
            sourceOrder >= destinationOrder
        ) {
            console.log(
                `❌ Invalid journey direction: ${source} → ${destination}`
            );

            return solutions;
        }

        /*
         * Process preferred classes one by one.
         */
        for (
            const travelClass of preferredClasses
        ) {
            const normalizedClass =
                normalizeCode(travelClass);

            if (!normalizedClass) {
                continue;
            }

            /*
             * Find graph edges matching the requested
             * class and covering the requested journey.
             */
            const coveringEdges = (
                graph.edges || []
            ).filter(
                (edge) =>
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
             * Prefer edges with the highest number
             * of available berths.
             */
            coveringEdges.sort(
                (a, b) =>
                    Number(
                        b.totalAvailable || 0
                    ) -
                    Number(
                        a.totalAvailable || 0
                    )
            );

            /*
             * Find an INDIVIDUAL berth that actually
             * covers the entire journey.
             *
             * This is important because the parent
             * graph edge can contain multiple berth
             * intervals.
             */
            let selectedEdge = null;
            let selectedOpportunity = null;
            let selectedBerth = null;

            for (
                const edge of coveringEdges
            ) {
                for (
                    const opportunity of
                        edge.opportunities || []
                ) {
                    if (
                        !Array.isArray(
                            opportunity.berths
                        )
                    ) {
                        continue;
                    }

                    for (
                        const berth of
                            opportunity.berths
                    ) {
                        if (!berth) {
                            continue;
                        }

                        const berthFrom =
                            normalizeCode(
                                berth.from
                            );

                        const berthTo =
                            normalizeCode(
                                berth.to
                            );

                        /*
                         * A berth without a valid
                         * vacancy interval cannot
                         * be recommended.
                         */
                        if (
                            !berthFrom ||
                            !berthTo
                        ) {
                            continue;
                        }

                        /*
                         * Validate the ACTUAL berth
                         * interval.
                         */
                        const berthEdge = {
                            from: berthFrom,
                            to: berthTo,
                        };

                        if (
                            !edgeCoversJourney(
                                graph,
                                berthEdge,
                                source,
                                destination
                            )
                        ) {
                            continue;
                        }

                        selectedEdge = edge;
                        selectedOpportunity =
                            opportunity;
                        selectedBerth = berth;

                        break;
                    }

                    if (selectedBerth) {
                        break;
                    }
                }

                if (selectedBerth) {
                    break;
                }
            }

            /*
             * No individual berth covers the complete
             * requested journey.
             */
            if (
                !selectedBerth ||
                !selectedOpportunity
            ) {
                console.log(
                    `❌ No individual ${normalizedClass} berth covers ` +
                    `${source} → ${destination}`
                );

                continue;
            }

            /*
             * Safely extract berth information.
             *
             * Never interpolate the whole berth object
             * into a string.
             */
            const berthNumber =
                selectedBerth.berthNumber ??
                selectedBerth.berthNo ??
                "";

            const berthCode =
                selectedBerth.berthCode ??
                selectedBerth.berthType ??
                "";

            const berthLabel =
                berthNumber !== ""
                    ? `${berthNumber}${berthCode}`
                    : berthCode ||
                      "Available berth";

            const actualFrom =
                normalizeCode(
                    selectedBerth.from
                );

            const actualTo =
                normalizeCode(
                    selectedBerth.to
                );

            const availableCount =
    Number(
        selectedEdge.totalAvailable
    ) || 0;

            /*
             * Build a clean vacancy summary.
             */
            const vacancySummary = [
                {
                    coach:
                        selectedOpportunity.coach ||
                        selectedBerth.coachName ||
                        "",

                    class: normalizedClass,

                    berthNumber,
                    berthCode,

                    from: actualFrom,
                    to: actualTo,

                    availableCount,
                },
            ];

            /*
             * Build recommendation.
             */
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
                            selectedOpportunity.coach ||
                            selectedBerth.coachName ||
                            "",

                        berth: selectedBerth,
                    },
                ],

                vacancySummary,

                reason:
    `${availableCount} vacant ` +
    `${normalizedClass} berth` +
    `${
        availableCount === 1
            ? ""
            : "s"
    } cover ` +
    `${source} → ${destination}. ` +
    `Example available berth: ` +
    `${
        selectedOpportunity.coach ||
        selectedBerth.coachName ||
        "Coach"
    }/${berthLabel}.`,
            };

            console.log(
                "✅ Direct journey coverage found"
            );

            console.log(
                "Coach:",
                selectedOpportunity.coach ||
                    selectedBerth.coachName ||
                    ""
            );

            console.log(
                "Berth:",
                berthLabel
            );

            console.log(
                "Actual vacancy:",
                `${actualFrom} → ${actualTo}`
            );

            console.log(
                "Passenger journey:",
                `${source} → ${destination}`
            );

            console.dir(
                solution,
                {
                    depth: null,
                }
            );

            solutions.push(solution);

            /*
             * Only one direct-seat recommendation
             * is required.
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