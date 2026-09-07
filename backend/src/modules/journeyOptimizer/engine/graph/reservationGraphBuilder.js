const {
    normalizeCode
} = require("../reservationCoverage");

class ReservationGraphBuilder {

    build(analyzedData) {

        const nodes =
            this.buildNodes(
                analyzedData.route.stations
            );

        const edges =
            this.buildEdges(
                analyzedData.vacancies
            );

        console.log(
            "\n========== GRAPH BUILDER =========="
        );

        console.log(
            "Chart Prepared:",
            analyzedData.chart.prepared
        );

        console.log(
            "Nodes:",
            nodes.length
        );

        console.log(
            "Edges:",
            edges.length
        );

        return {

            chartPrepared:
                analyzedData.chart.prepared,

            nodes,

            edges

        };
    }

    buildNodes(stations = []) {

        return stations.map(
            (station, index) => ({

                code: normalizeCode(
                    station.code ||
                    station.stationCode ||
                    station
                ),

                name:
                    station.name ||
                    station.stationName ||
                    "",

                order: index + 1

            })
        );
    }

    buildEdges(vacancies = []) {

        const edgeMap = new Map();

        vacancies.forEach(
            (vacancy) => {

                const from =
                    normalizeCode(
                        vacancy.from ||
                        vacancy.fromStation ||
                        vacancy.fromStn
                    );

                const to =
                    normalizeCode(
                        vacancy.to ||
                        vacancy.toStation ||
                        vacancy.toStn
                    );

                const travelClass =
                    normalizeCode(
                        vacancy.class ||
                        vacancy.cls
                    );

                const coach =
                    vacancy.coach ||
                    vacancy.coachName;

                const berth =
                    vacancy.berth ||
                    vacancy.berthNumber;

                if (
                    !from ||
                    !to ||
                    !travelClass ||
                    !coach
                ) {
                    return;
                }

                const edgeKey =
                    `${from}_${to}_${travelClass}`;

                if (
                    !edgeMap.has(edgeKey)
                ) {

                    edgeMap.set(
                        edgeKey,
                        {

                            from,

                            to,

                            class:
                                travelClass,

                            totalAvailable: 0,

                            opportunities: []

                        }
                    );
                }

                const edge =
                    edgeMap.get(
                        edgeKey
                    );

                let coachGroup =
                    edge.opportunities.find(
                        (opportunity) =>
                            opportunity.coach ===
                            coach
                    );

                if (!coachGroup) {

                    coachGroup = {

                        coach,

                        availableCount: 0,

                        berths: []

                    };

                    edge.opportunities.push(
                        coachGroup
                    );
                }

                if (
                    berth !== undefined &&
                    berth !== null &&
                    berth !== ""
                ) {

                    coachGroup.berths.push(
                        berth
                    );
                }

                coachGroup.availableCount++;

                edge.totalAvailable++;

            }
        );

        return Array.from(
            edgeMap.values()
        );
    }

    getOutgoingEdges(
        graph,
        stationCode
    ) {

        const code =
            normalizeCode(
                stationCode
            );

        return graph.edges.filter(
            (edge) =>
                normalizeCode(edge.from) ===
                code
        );
    }

    getIncomingEdges(
        graph,
        stationCode
    ) {

        const code =
            normalizeCode(
                stationCode
            );

        return graph.edges.filter(
            (edge) =>
                normalizeCode(edge.to) ===
                code
        );
    }

    getDirectEdge(
        graph,
        from,
        to,
        travelClass
    ) {

        const normalizedFrom =
            normalizeCode(from);

        const normalizedTo =
            normalizeCode(to);

        const normalizedClass =
            normalizeCode(travelClass);

        return graph.edges.find(
            (edge) =>
                normalizeCode(edge.from) ===
                    normalizedFrom &&
                normalizeCode(edge.to) ===
                    normalizedTo &&
                normalizeCode(edge.class) ===
                    normalizedClass
        );
    }
}

module.exports =
    new ReservationGraphBuilder();