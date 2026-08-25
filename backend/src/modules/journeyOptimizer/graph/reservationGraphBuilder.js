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

        vacancies.forEach(v => {

            const from = v.from;
            const to = v.to;
            const travelClass = v.class || v.cls;
            const coach = v.coach || v.coachName;
            const berth = v.berth || v.berthNumber;

            const key = `${from}-${to}-${travelClass}`;

            if (!edgeMap.has(key)) {

                edgeMap.set(key, {

                    from,
                    to,
                    class: travelClass,
                    opportunities: []

                });

            }

            const edge = edgeMap.get(key);

            let coachObj = edge.opportunities.find(
                c => c.coach === coach
            );

            if (!coachObj) {

                coachObj = {

                    coach,
                    berths: []

                };

                edge.opportunities.push(coachObj);

            }

            coachObj.berths.push(berth);

        });

        return Array.from(edgeMap.values());

    }

}

module.exports = new ReservationGraphBuilder();