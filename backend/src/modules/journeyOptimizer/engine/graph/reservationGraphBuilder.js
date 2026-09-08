// ============================================================
// reservationGraphBuilder.js
// ============================================================
//
// ERJA Reservation Graph Builder
//
// Converts:
//   1. Train route/stations
//   2. IRCTC vacant berth records
//   3. IRCTC coach composition
//
// into a reservation graph.
//
// REAL IRCTC VACANCY FORMAT:
//
// {
//     coachName: "A1",
//     cabinCoupe: null,
//     cabinCoupeNo: "7",
//     berthCode: "U",
//     berthNumber: 40,
//     from: "SC",
//     to: "BZA",
//     splitNo: 1
// }
//
// IMPORTANT:
// The real vacancy response does NOT contain:
//
//     vacancy.class
//
// The class must therefore be resolved from the chart coach
// composition:
//
//     A1 -> 2A
//     A2 -> 2A
//     B1 -> 3A
//     B2 -> 3A
//     S1 -> SL
//     M1 -> 3E
//
// ============================================================


class ReservationGraphBuilder {


    // ========================================================
    // BUILD COMPLETE GRAPH
    // ========================================================

    build(analyzedData = {}) {

        const route =
            analyzedData.route || {};

        const stations =
            Array.isArray(route.stations)
                ? route.stations
                : [];


        const vacancies =
            Array.isArray(
                analyzedData.vacancies
            )
                ? analyzedData.vacancies
                : [];


        const chart =
            analyzedData.chart || {};


        // ----------------------------------------------------
        // BUILD STATION NODES
        // ----------------------------------------------------

        const nodes =
            this.buildNodes(
                stations
            );


        // ----------------------------------------------------
        // BUILD RESERVATION EDGES
        // ----------------------------------------------------

        const edges =
            this.buildEdges(
                vacancies,
                chart
            );


        // ----------------------------------------------------
        // LOG GRAPH INFORMATION
        // ----------------------------------------------------

        console.log(
            "\n========== GRAPH BUILDER =========="
        );


        console.log(
            "Chart Prepared:",
            chart.prepared
        );


        console.log(
            "Nodes:",
            nodes.length
        );


        console.log(
            "Edges:",
            edges.length
        );


        // ----------------------------------------------------
        // PRINT EDGE SUMMARY
        // ----------------------------------------------------

        if (
            edges.length > 0
        ) {

            console.log(
                "\n========== GRAPH EDGES =========="
            );


            edges.forEach(
                (edge) => {

                    console.log(
                        `${edge.from} → ${edge.to} | ${edge.class} | ${edge.totalAvailable} berths`
                    );
                }
            );
        }


        return {

            chartPrepared:
                chart.prepared,

            nodes,

            edges,
        };
    }


    // ========================================================
    // BUILD NODES
    // ========================================================

    buildNodes(
        stations = []
    ) {

        if (
            !Array.isArray(stations)
        ) {

            return [];
        }


        return stations
            .map(
                (station, index) => {

                    // ------------------------------------------
                    // Station may be:
                    //
                    // "SC"
                    //
                    // OR:
                    //
                    // {
                    //     code: "SC",
                    //     name: "SECUNDERABAD JN"
                    // }
                    // ------------------------------------------

                    if (
                        typeof station ===
                        "string"
                    ) {

                        const code =
                            this.normalizeStationCode(
                                station
                            );


                        return {

                            code,

                            name: "",

                            order:
                                index + 1,
                        };
                    }


                    const code =
                        this.normalizeStationCode(
                            station.code ||
                            station.stationCode ||
                            station.station_code ||
                            ""
                        );


                    const name =
                        station.name ||
                        station.stationName ||
                        station.station_name ||
                        station.station ||
                        "";


                    return {

                        code,

                        name,

                        order:
                            Number.isFinite(
                                station.routeOrder
                            )
                                ? station.routeOrder
                                : index + 1,
                    };
                }
            )
            .filter(
                (node) =>
                    node.code
            );
    }


    // ========================================================
    // BUILD EDGES
    // ========================================================
    //
    // Each IRCTC vacancy becomes part of an edge:
    //
    //     SC → BZA | 2A
    //
    // Multiple berths on the same segment/class are grouped.
    //
    // ========================================================

    buildEdges(
        vacancies = [],
        chart = {}
    ) {

        if (
            !Array.isArray(vacancies) ||
            vacancies.length === 0
        ) {

            console.log(
                "⚠️ No vacancy records supplied to graph builder."
            );

            return [];
        }


        // ----------------------------------------------------
        // Build:
        //
        // coachName -> classCode
        //
        // from chart.coaches
        // ----------------------------------------------------

        const coachClassMap =
            this.buildCoachClassMap(
                chart
            );


        console.log(
            "\n========== COACH → CLASS MAP =========="
        );


        console.dir(
            Object.fromEntries(
                coachClassMap
            ),
            {
                depth: null,
            }
        );


        // ----------------------------------------------------
        // EDGE MAP
        // ----------------------------------------------------

        const edgeMap =
            new Map();


        // ----------------------------------------------------
        // STATISTICS
        // ----------------------------------------------------

        let processed =
            0;

        let skipped =
            0;

        let missingClass =
            0;

        let missingStation =
            0;

        let invalidRecords =
            0;


        // ====================================================
        // PROCESS EVERY VACANCY
        // ====================================================

        vacancies.forEach(
            (vacancy) => {

                // ------------------------------------------------
                // BASIC VALIDATION
                // ------------------------------------------------

                if (
                    !vacancy ||
                    typeof vacancy !==
                        "object"
                ) {

                    invalidRecords++;

                    return;
                }


                // ------------------------------------------------
                // SOURCE
                // ------------------------------------------------

                const from =
                    this.normalizeStationCode(
                        vacancy.from ||
                        vacancy.fromStation ||
                        vacancy.fromStn ||
                        vacancy.fromCode ||
                        ""
                    );


                // ------------------------------------------------
                // DESTINATION
                // ------------------------------------------------

                const to =
                    this.normalizeStationCode(
                        vacancy.to ||
                        vacancy.toStation ||
                        vacancy.toStn ||
                        vacancy.toCode ||
                        ""
                    );


                // ------------------------------------------------
                // COACH
                // ------------------------------------------------

                const coach =
                    this.normalizeCoach(
                        vacancy.coachName ||
                        vacancy.coach ||
                        vacancy.coachCode ||
                        ""
                    );


                // ------------------------------------------------
                // BERTH
                // ------------------------------------------------

                const berth =
                    vacancy.berthNumber ??
                    vacancy.berth ??
                    vacancy.berthNo ??
                    null;


                // ------------------------------------------------
                // CHECK SOURCE / DESTINATION
                // ------------------------------------------------

                if (
                    !from ||
                    !to
                ) {

                    missingStation++;

                    skipped++;

                    return;
                }


                // ------------------------------------------------
                // CHECK COACH
                // ------------------------------------------------

                if (
                    !coach
                ) {

                    invalidRecords++;

                    skipped++;

                    return;
                }


                // ------------------------------------------------
                // RESOLVE CLASS
                // ------------------------------------------------

                let travelClass =
                    this.resolveTravelClass(
                        vacancy,
                        coachClassMap
                    );


                // ------------------------------------------------
                // CLASS STILL UNKNOWN
                // ------------------------------------------------

                if (
                    !travelClass
                ) {

                    missingClass++;

                    skipped++;

                    return;
                }


                // ------------------------------------------------
                // NORMALIZE CLASS
                // ------------------------------------------------

                travelClass =
                    this.normalizeClassCode(
                        travelClass
                    );


                // ------------------------------------------------
                // PROCESSED
                // ------------------------------------------------

                processed++;


                // ------------------------------------------------
                // EDGE KEY
                // ------------------------------------------------

                const edgeKey =
                    `${from}_${to}_${travelClass}`;


                // ------------------------------------------------
                // CREATE EDGE
                // ------------------------------------------------

                if (
                    !edgeMap.has(
                        edgeKey
                    )
                ) {

                    edgeMap.set(
                        edgeKey,
                        {

                            from,

                            to,

                            class:
                                travelClass,

                            totalAvailable:
                                0,

                            opportunities:
                                [],

                        }
                    );
                }


                const edge =
                    edgeMap.get(
                        edgeKey
                    );


                // ------------------------------------------------
                // FIND COACH GROUP
                // ------------------------------------------------

                let coachGroup =
                    edge.opportunities.find(
                        (opportunity) =>
                            opportunity.coach ===
                            coach
                    );


                // ------------------------------------------------
                // CREATE COACH GROUP
                // ------------------------------------------------

                if (
                    !coachGroup
                ) {

                    coachGroup = {

                        coach,

                        availableCount:
                            0,

                        berths:
                            [],
                    };


                    edge.opportunities.push(
                        coachGroup
                    );
                }


                // ------------------------------------------------
                // CREATE BERTH OBJECT
                // ------------------------------------------------
                //
                // Keep the original IRCTC information so the
                // recommendation engine can later display:
                //
                // Coach
                // Berth
                // Berth type
                // Cabin/coupe
                // Segment
                // Split number
                //
                // ------------------------------------------------

                const berthObject = {

                    berthNumber:
                        berth,

                    berthCode:
                        vacancy.berthCode ||
                        vacancy.berthType ||
                        "",

                    cabinCoupe:
                        vacancy.cabinCoupe ??
                        null,

                    cabinCoupeNo:
                        vacancy.cabinCoupeNo ||
                        null,

                    from,

                    to,

                    splitNo:
                        vacancy.splitNo ??
                        null,

                    coach,

                    class:
                        travelClass,
                };


                // ------------------------------------------------
                // ADD BERTH
                // ------------------------------------------------

                coachGroup.berths.push(
                    berthObject
                );


                // ------------------------------------------------
                // UPDATE COUNTS
                // ------------------------------------------------

                coachGroup.availableCount++;

                edge.totalAvailable++;
            }
        );


        // ====================================================
        // CONVERT MAP TO ARRAY
        // ====================================================

        const edges =
            Array.from(
                edgeMap.values()
            );


        // ====================================================
        // SORT EDGES
        // ====================================================
        //
        // Stable deterministic ordering:
        //
        // 1. Source
        // 2. Destination
        // 3. Class
        //
        // ====================================================

        edges.sort(
            (a, b) => {

                const sourceCompare =
                    a.from.localeCompare(
                        b.from
                    );


                if (
                    sourceCompare !== 0
                ) {

                    return sourceCompare;
                }


                const destinationCompare =
                    a.to.localeCompare(
                        b.to
                    );


                if (
                    destinationCompare !== 0
                ) {

                    return destinationCompare;
                }


                return a.class.localeCompare(
                    b.class
                );
            }
        );


        // ====================================================
        // SORT OPPORTUNITIES
        // ====================================================

        edges.forEach(
            (edge) => {

                edge.opportunities.sort(
                    (a, b) =>
                        a.coach.localeCompare(
                            b.coach
                        )
                );


                edge.opportunities.forEach(
                    (opportunity) => {

                        opportunity.berths.sort(
                            (
                                a,
                                b
                            ) => {

                                const aNumber =
                                    Number(
                                        a.berthNumber
                                    );


                                const bNumber =
                                    Number(
                                        b.berthNumber
                                    );


                                if (
                                    Number.isFinite(
                                        aNumber
                                    ) &&
                                    Number.isFinite(
                                        bNumber
                                    )
                                ) {

                                    return (
                                        aNumber -
                                        bNumber
                                    );
                                }


                                return String(
                                    a.berthNumber ??
                                    ""
                                ).localeCompare(
                                    String(
                                        b.berthNumber ??
                                        ""
                                    )
                                );
                            }
                        );
                    }
                );
            }
        );


        // ====================================================
        // DEBUG STATISTICS
        // ====================================================

        console.log(
            "\n========== GRAPH VACANCY PROCESSING =========="
        );


        console.log(
            "Input vacancies:",
            vacancies.length
        );


        console.log(
            "Processed vacancies:",
            processed
        );


        console.log(
            "Skipped vacancies:",
            skipped
        );


        console.log(
            "Missing station records:",
            missingStation
        );


        console.log(
            "Missing class records:",
            missingClass
        );


        console.log(
            "Invalid records:",
            invalidRecords
        );


        console.log(
            "Final graph edges:",
            edges.length
        );


        return edges;
    }


    // ========================================================
    // BUILD COACH → CLASS MAP
    // ========================================================

    buildCoachClassMap(
        chart = {}
    ) {

        const map =
            new Map();


        const coaches =
            Array.isArray(
                chart.coaches
            )
                ? chart.coaches
                : [];


        coaches.forEach(
            (coachData) => {

                if (
                    !coachData ||
                    typeof coachData !==
                        "object"
                ) {

                    return;
                }


                const coach =
                    this.normalizeCoach(
                        coachData.coachName ||
                        coachData.coach ||
                        coachData.coachCode ||
                        ""
                    );


                const classCode =
                    this.normalizeClassCode(
                        coachData.classCode ||
                        coachData.class ||
                        coachData.travelClass ||
                        coachData.cls ||
                        ""
                    );


                if (
                    coach &&
                    classCode
                ) {

                    map.set(
                        coach,
                        classCode
                    );
                }
            }
        );


        return map;
    }


    // ========================================================
    // RESOLVE TRAVEL CLASS
    // ========================================================
    //
    // Priority:
    //
    // 1. Vacancy already contains class
    // 2. Coach class map
    //
    // ========================================================

    resolveTravelClass(
        vacancy,
        coachClassMap
    ) {

        // ----------------------------------------------------
        // Direct class from vacancy
        // ----------------------------------------------------

        const directClass =
            vacancy.class ||
            vacancy.classCode ||
            vacancy.travelClass ||
            vacancy.cls;


        if (
            directClass
        ) {

            return directClass;
        }


        // ----------------------------------------------------
        // Resolve using coach
        // ----------------------------------------------------

        const coach =
            this.normalizeCoach(
                vacancy.coachName ||
                vacancy.coach ||
                vacancy.coachCode ||
                ""
            );


        if (
            !coach
        ) {

            return null;
        }


        return (
            coachClassMap.get(
                coach
            ) ||
            null
        );
    }


    // ========================================================
    // NORMALIZE STATION CODE
    // ========================================================

    normalizeStationCode(
        value
    ) {

        if (
            value ===
            null ||
            value ===
            undefined
        ) {

            return "";
        }


        return String(value)
            .trim()
            .toUpperCase();
    }


    // ========================================================
    // NORMALIZE COACH
    // ========================================================

    normalizeCoach(
        value
    ) {

        if (
            value ===
            null ||
            value ===
            undefined
        ) {

            return "";
        }


        return String(value)
            .trim()
            .toUpperCase();
    }


    // ========================================================
    // NORMALIZE CLASS CODE
    // ========================================================

    normalizeClassCode(
        value
    ) {

        if (
            value ===
            null ||
            value ===
            undefined
        ) {

            return "";
        }


        return String(value)
            .trim()
            .toUpperCase();
    }


    // ========================================================
    // GET OUTGOING EDGES
    // ========================================================

    getOutgoingEdges(
        graph,
        stationCode
    ) {

        if (
            !graph ||
            !Array.isArray(
                graph.edges
            )
        ) {

            return [];
        }


        const normalizedStation =
            this.normalizeStationCode(
                stationCode
            );


        return graph.edges.filter(
            (edge) =>
                this.normalizeStationCode(
                    edge.from
                ) ===
                normalizedStation
        );
    }


    // ========================================================
    // GET INCOMING EDGES
    // ========================================================

    getIncomingEdges(
        graph,
        stationCode
    ) {

        if (
            !graph ||
            !Array.isArray(
                graph.edges
            )
        ) {

            return [];
        }


        const normalizedStation =
            this.normalizeStationCode(
                stationCode
            );


        return graph.edges.filter(
            (edge) =>
                this.normalizeStationCode(
                    edge.to
                ) ===
                normalizedStation
        );
    }


    // ========================================================
    // GET DIRECT EDGE
    // ========================================================

    getDirectEdge(
        graph,
        from,
        to,
        travelClass
    ) {

        if (
            !graph ||
            !Array.isArray(
                graph.edges
            )
        ) {

            return null;
        }


        const normalizedFrom =
            this.normalizeStationCode(
                from
            );


        const normalizedTo =
            this.normalizeStationCode(
                to
            );


        const normalizedClass =
            this.normalizeClassCode(
                travelClass
            );


        return (
            graph.edges.find(
                (edge) =>

                    this.normalizeStationCode(
                        edge.from
                    ) ===
                    normalizedFrom &&

                    this.normalizeStationCode(
                        edge.to
                    ) ===
                    normalizedTo &&

                    this.normalizeClassCode(
                        edge.class
                    ) ===
                    normalizedClass
            ) ||
            null
        );
    }


    // ========================================================
    // GET EDGES FOR CLASS
    // ========================================================

    getEdgesByClass(
        graph,
        travelClass
    ) {

        if (
            !graph ||
            !Array.isArray(
                graph.edges
            )
        ) {

            return [];
        }


        const normalizedClass =
            this.normalizeClassCode(
                travelClass
            );


        return graph.edges.filter(
            (edge) =>
                this.normalizeClassCode(
                    edge.class
                ) ===
                normalizedClass
        );
    }


    // ========================================================
    // GET AVAILABLE BERTHS
    // ========================================================

    getAvailableBerths(
        edge
    ) {

        if (
            !edge ||
            !Array.isArray(
                edge.opportunities
            )
        ) {

            return [];
        }


        const berths = [];


        edge.opportunities.forEach(
            (opportunity) => {

                if (
                    !Array.isArray(
                        opportunity.berths
                    )
                ) {

                    return;
                }


                opportunity.berths.forEach(
                    (berth) => {

                        berths.push(
                            berth
                        );
                    }
                );
            }
        );


        return berths;
    }


    // ========================================================
    // GET BEST BERTH
    // ========================================================
    //
    // Deterministic selection:
    //
    // 1. Lower berth
    // 2. Middle berth
    // 3. Upper berth
    // 4. Side Lower
    // 5. Side Upper
    //
    // If berth type is unavailable, berth number is used.
    //
    // ========================================================

    getBestBerth(
        edge
    ) {

        const berths =
            this.getAvailableBerths(
                edge
            );


        if (
            berths.length ===
            0
        ) {

            return null;
        }


        const preference = {

            L: 1,

            M: 2,

            U: 3,

            SL: 4,

            SU: 5,

            P: 6,

            R: 7,
        };


        const sorted =
            [...berths].sort(
                (a, b) => {

                    const aCode =
                        String(
                            a.berthCode ||
                            ""
                        )
                            .trim()
                            .toUpperCase();


                    const bCode =
                        String(
                            b.berthCode ||
                            ""
                        )
                            .trim()
                            .toUpperCase();


                    const aPreference =
                        preference[aCode] ||
                        99;


                    const bPreference =
                        preference[bCode] ||
                        99;


                    if (
                        aPreference !==
                        bPreference
                    ) {

                        return (
                            aPreference -
                            bPreference
                        );
                    }


                    const aNumber =
                        Number(
                            a.berthNumber
                        );


                    const bNumber =
                        Number(
                            b.berthNumber
                        );


                    if (
                        Number.isFinite(
                            aNumber
                        ) &&
                        Number.isFinite(
                            bNumber
                        )
                    ) {

                        return (
                            aNumber -
                            bNumber
                        );
                    }


                    return String(
                        a.berthNumber ??
                        ""
                    ).localeCompare(
                        String(
                            b.berthNumber ??
                            ""
                        )
                    );
                }
            );


        return sorted[0];
    }


    // ========================================================
    // CHECK WHETHER EDGE COVERS JOURNEY
    // ========================================================

    edgeCoversJourney(
        edge,
        source,
        destination,
        route = []
    ) {

        if (
            !edge
        ) {

            return false;
        }


        const sourceCode =
            this.normalizeStationCode(
                source
            );


        const destinationCode =
            this.normalizeStationCode(
                destination
            );


        const edgeFrom =
            this.normalizeStationCode(
                edge.from
            );


        const edgeTo =
            this.normalizeStationCode(
                edge.to
            );


        if (
            !edgeFrom ||
            !edgeTo
        ) {

            return false;
        }


        // ----------------------------------------------------
        // Direct exact coverage
        // ----------------------------------------------------

        if (
            edgeFrom ===
                sourceCode &&
            edgeTo ===
                destinationCode
        ) {

            return true;
        }


        // ----------------------------------------------------
        // Route-order coverage
        // ----------------------------------------------------

        if (
            !Array.isArray(
                route
            ) ||
            route.length ===
                0
        ) {

            return false;
        }


        const sourceIndex =
            this.findStationIndex(
                route,
                sourceCode
            );


        const destinationIndex =
            this.findStationIndex(
                route,
                destinationCode
            );


        const edgeFromIndex =
            this.findStationIndex(
                route,
                edgeFrom
            );


        const edgeToIndex =
            this.findStationIndex(
                route,
                edgeTo
            );


        if (
            sourceIndex ===
                -1 ||
            destinationIndex ===
                -1 ||
            edgeFromIndex ===
                -1 ||
            edgeToIndex ===
                -1
        ) {

            return false;
        }


        return (
            edgeFromIndex <=
                sourceIndex &&

            edgeToIndex >=
                destinationIndex
        );
    }


    // ========================================================
    // FIND STATION INDEX
    // ========================================================

    findStationIndex(
        route,
        stationCode
    ) {

        const normalizedCode =
            this.normalizeStationCode(
                stationCode
            );


        return route.findIndex(
            (station) => {

                if (
                    typeof station ===
                    "string"
                ) {

                    return (
                        this.normalizeStationCode(
                            station
                        ) ===
                        normalizedCode
                    );
                }


                return (
                    this.normalizeStationCode(
                        station.code ||
                        station.stationCode ||
                        station.station_code ||
                        ""
                    ) ===
                    normalizedCode
                );
            }
        );
    }
}


// ============================================================
// EXPORT SINGLETON
// ============================================================

module.exports =
    new ReservationGraphBuilder();