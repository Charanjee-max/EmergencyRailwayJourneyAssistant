class ReservationGraphBuilder {

    build(analyzedData) {

        const nodes = this.buildNodes(analyzedData.route.stations);
        const edges = this.buildEdges(analyzedData.vacancies);

        return {
            nodes,
            edges
        };

    }

    buildNodes(stations = []) {

        return stations.map((station, index) => ({

            code: station.code || station.stationCode || station,

            name: station.name || station.stationName || "",

            order: index + 1

        }));

    }

    buildEdges(vacancies = []) {

        const edgeMap = new Map();

        vacancies.forEach(vacancy => {

            const from =
                vacancy.from ||
                vacancy.fromStation ||
                vacancy.fromStn;

            const to =
                vacancy.to ||
                vacancy.toStation ||
                vacancy.toStn;

            const travelClass =
                vacancy.class ||
                vacancy.cls;

            const coach =
                vacancy.coach ||
                vacancy.coachName;

            const berth =
                vacancy.berth ||
                vacancy.berthNumber;

            if (!from || !to || !travelClass || !coach)
                return;

            const edgeKey =
                `${from}_${to}_${travelClass}`;

            if (!edgeMap.has(edgeKey)) {

                edgeMap.set(edgeKey, {

                    from,

                    to,

                    class: travelClass,

                    totalAvailable: 0,

                    opportunities: []

                });

            }

            const edge = edgeMap.get(edgeKey);

            let coachGroup = edge.opportunities.find(

                opportunity =>
                    opportunity.coach === coach

            );

            if (!coachGroup) {

                coachGroup = {

                    coach,

                    availableCount: 0,

                    berths: []

                };

                edge.opportunities.push(coachGroup);

            }

            coachGroup.berths.push(berth);

            coachGroup.availableCount++;

            edge.totalAvailable++;

        });

        return Array.from(edgeMap.values());

    }

    getOutgoingEdges(graph, stationCode) {

        return graph.edges.filter(edge =>
            edge.from === stationCode
        );

    }

    getIncomingEdges(graph, stationCode) {

        return graph.edges.filter(edge =>
            edge.to === stationCode
        );

    }

    getDirectEdge(graph, from, to, travelClass) {

        return graph.edges.find(edge =>

            edge.from === from &&
            edge.to === to &&
            edge.class === travelClass

        );

    }

}

module.exports = new ReservationGraphBuilder();