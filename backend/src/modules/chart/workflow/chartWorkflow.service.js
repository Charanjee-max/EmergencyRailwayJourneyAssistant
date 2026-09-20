const chartService =
    require("../chart.service");

const {
    calculateChartTiming,
} = require("../chartTiming.service");

const journeyOptimizer =
    require("../../journeyOptimizer/journeyOptimizer.service");

const recommendationService =
    require("../../recommendation/recommendation.service");

const TrainStop =
    require("../../train/trainStop.model");

const Journey =
    require("../../journey/journey.model");

const notificationService =
    require("../../notification/notification.service");


// =========================================================
// NTES TIMETABLE SYNC
// =========================================================

let syncNtesTrainStopsService = null;

try {

    ({
        syncNtesTrainStopsService,
    } = require("../../train/ntes.service"));

} catch (error) {

    console.log(
        "⚠️ NTES timetable sync service is not available."
    );
}


// =========================================================
// MOCK MODULES
// =========================================================

const mockChart =
    require("../mock/mockChart");

const mockVacancies =
    require("../mock/mockVacancies");


class ChartWorkflowService {


    // =========================================================
    // GET DATABASE TRAIN ROUTE
    // =========================================================

    async getDatabaseRoute(
        trainNumber
    ) {

        const normalizedTrainNumber =
            String(trainNumber)
                .trim();


        const stops =
            await TrainStop.find({
                trainNumber:
                    normalizedTrainNumber,
            })
                .lean();


        if (
            !stops.length
        ) {

            console.log(
                `⚠️ No timetable found in trainStops for train ${normalizedTrainNumber}.`
            );

            return [];
        }


        // =====================================================
        // CONVERT ROUTE ORDER
        // =====================================================

        const orderedStops =
            stops
                .map(
                    (stop) => ({

                        ...stop,

                        routeOrder:
                            Number.parseFloat(
                                stop.no
                            ),
                    })
                )
                .filter(
                    (stop) =>
                        Number.isFinite(
                            stop.routeOrder
                        )
                )
                .sort(
                    (a, b) =>
                        a.routeOrder -
                        b.routeOrder
                );


        // =====================================================
        // CONVERT TO ERJA ROUTE FORMAT
        // =====================================================

        const route =
            orderedStops.map(
                (stop) => ({

                    code:
                        String(
                            stop.code ||
                            ""
                        )
                            .trim()
                            .toUpperCase(),

                    name:
                        stop.station ||
                        "",

                    stationCode:
                        String(
                            stop.code ||
                            ""
                        )
                            .trim()
                            .toUpperCase(),

                    stationName:
                        stop.station ||
                        "",

                    arrival:
                        stop.arrival ||
                        "",

                    departure:
                        stop.departure ||
                        "",

                    halt:
                        stop.halt ||
                        "",

                    platform:
                        stop.pf ||
                        "",

                    day:
                        stop.day ||
                        "",

                    distanceKm:
                        stop.km ||
                        "",

                    routeOrder:
                        stop.routeOrder,
                })
            );


        console.log(
            `✅ Database timetable loaded: ${route.length} stops`
        );


        if (
            route.length > 0
        ) {

            console.log(
                "First stop:",
                route[0].code,
                route[0].name
            );


            console.log(
                "Last stop:",
                route[
                    route.length - 1
                ].code,
                route[
                    route.length - 1
                ].name
            );
        }


        return route;
    }


    // =========================================================
    // LOAD ROUTE WITH NTES FALLBACK
    // =========================================================

    async loadTrainRoute(
        trainNumber,
        journeyDate
    ) {

        let route =
            await this.getDatabaseRoute(
                trainNumber
            );


        // =====================================================
        // DATABASE ROUTE EXISTS
        // =====================================================

        if (
            route.length > 0
        ) {

            return route;
        }


        // =====================================================
        // NTES SERVICE NOT AVAILABLE
        // =====================================================

        if (
            typeof syncNtesTrainStopsService !==
            "function"
        ) {

            console.log(
                "⚠️ NTES sync service unavailable."
            );

            return [];
        }


        // =====================================================
        // NTES FALLBACK
        // =====================================================

        console.log(
            "\n========================================"
        );


        console.log(
            "🚆 NTES TIMETABLE FALLBACK"
        );


        console.log(
            "========================================"
        );


        console.log(
            `Train: ${trainNumber}`
        );


        try {

            await syncNtesTrainStopsService(
                String(trainNumber)
                    .trim(),

                journeyDate
            );


            console.log(
                "✅ NTES timetable sync completed."
            );

        } catch (
            error
        ) {

            console.log(
                "❌ NTES timetable sync failed:"
            );


            console.log(
                error.message
            );


            return [];
        }


        // =====================================================
        // LOAD AGAIN FROM DATABASE
        // =====================================================

        route =
            await this.getDatabaseRoute(
                trainNumber
            );


        if (
            route.length === 0
        ) {

            console.log(
                `❌ Timetable still unavailable for train ${trainNumber}.`
            );
        }


        return route;
    }


    // =========================================================
    // GET CHART CLASSES
    // =========================================================

    getChartClasses(chart = {}, preferredClass = "") {

        const classes = new Set();

        const addClass = (value) => {
            const normalized = String(value || "")
                .trim()
                .toUpperCase();

            if (normalized) {
                classes.add(normalized);
            }
        };

        const prefixMap = {
            H: "1A",
            A: "2A",
            B: "3A",
            M: "3E",
            S: "SL",
            D: "2S",
            C: "CC",
            E: "EC",
        };

        const scan = (item) => {
            if (!item) return;

            if (typeof item === "string") {
                const text = item.trim().toUpperCase();
                const matches = text.match(/\b(?:H|A|B|M|S|D|C|E)\d{1,2}\b/g) || [];
                matches.forEach((coach) => addClass(prefixMap[coach.charAt(0)]));
                return;
            }

            if (typeof item !== "object") return;

            addClass(
                item.classCode ||
                item.class ||
                item.className ||
                item.travelClass ||
                item.cls
            );

            const coachName = String(
                item.coachName ||
                item.coach ||
                item.coachCode ||
                item.code ||
                ""
            ).trim().toUpperCase();

            const matches = coachName.match(/\b(?:H|A|B|M|S|D|C|E)\d{1,2}\b/g) || [];
            matches.forEach((coach) => addClass(prefixMap[coach.charAt(0)]));
        };

        if (Array.isArray(chart.coaches)) chart.coaches.forEach(scan);
        if (Array.isArray(chart.cdd)) chart.cdd.forEach(scan);

        // Keep the user's preferred class in the request even if the
        // composition payload did not expose it in a directly parseable field.
        addClass(preferredClass);

        const order = ["1A", "2A", "3A", "3E", "SL", "2S", "CC", "EC"];
        return Array.from(classes).sort(
            (a, b) => (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) -
                      (order.indexOf(b) === -1 ? 99 : order.indexOf(b))
        );
    }


    // =========================================================
    // CLEAR RECOMMENDATIONS
    // =========================================================

    async clearRecommendations(
        journeyId
    ) {

        try {

            await recommendationService
                .saveRecommendations(
                    journeyId,
                    []
                );


            console.log(
                "🧹 Old recommendations cleared."
            );

        } catch (
            clearError
        ) {

            console.log(
                "⚠️ Could not clear old recommendations:",
                clearError.message
            );
        }
    }


    // =========================================================
    // PROCESS JOURNEY
    // =========================================================

    async processJourney(
        journey
    ) {

        try {

            console.log(
                "\n========================================"
            );


            console.log(
                "🚆 CHART WORKFLOW STARTED"
            );


            console.log(
                "========================================"
            );


            console.log(
                "Journey ID:",
                journey._id
            );


            console.log(
                "Train Number:",
                journey.trainNumber
            );


            console.log(
                "Journey Date:",
                journey.journeyDate
            );


            console.log(
                "Source:",
                journey.boardingStation
            );


            console.log(
                "Destination:",
                journey.destinationStation
            );


            // =================================================
            // ENABLED CLASS
            // =================================================

            const enabledClass =
                journey.allowedClasses?.find(
                    (cls) =>
                        cls.enabled
                );


            if (
                !enabledClass
            ) {

                console.log(
                    "❌ No enabled class found."
                );

                return null;
            }


            console.log(
                "Preferred Class:",
                enabledClass.class
            );


            // =================================================
            // MOCK MODE
            // =================================================

            const useMockData =
                process.env.USE_MOCK_CHART ===
                "true";


            if (
                useMockData
            ) {

                console.log(
                    "\n🧪 EXPLICIT MOCK MODE"
                );


                console.log(
                    "⚠️ Real IRCTC chart data will NOT be used."
                );

            } else {

                console.log(
                    "\n🚆 REAL IRCTC MODE"
                );
            }


            // =================================================
            // MOCK WORKFLOW
            // =================================================

            if (
                useMockData
            ) {

                const mockChartData = {

                    chartPrepared:
                        true,

                    cdd:
                        mockChart.cdd ||
                        [],

                    chartOneTime:
                        null,

                    chartTwoTime:
                        null,

                    coaches:
                        mockChart.cdd ||
                        [],
                };


                const vacantBerths =
                    mockVacancies.generateVacancies({

                        source:
                            journey.boardingStation,

                        destination:
                            journey.destinationStation,

                        travelClass:
                            enabledClass.class,

                        allowMixedClass:
                            journey.allowMixedClass ||
                            false,
                    });


                console.log(
                    "\n========== MOCK VACANCIES =========="
                );


                console.dir(
                    vacantBerths,
                    {
                        depth: null,
                    }
                );


                console.log(
                    "\n⚠️ Mock vacancies are TEST DATA only."
                );


                return await this.runOptimizer(
                    journey,
                    mockChartData,
                    vacantBerths
                );
            }


            // =================================================
            // REAL WORKFLOW
            // =================================================

            const journeyDate =
                new Date(
                    journey.journeyDate
                )
                    .toISOString()
                    .split("T")[0];


            console.log(
                "\n========================================"
            );


            console.log(
                "🚆 REAL IRCTC CHART WORKFLOW"
            );


            console.log(
                "========================================"
            );


            // =================================================
            // LOAD TRAIN TIMETABLE
            // =================================================

            let databaseRoute = [];


            try {

                databaseRoute =
                    await this.loadTrainRoute(
                        journey.trainNumber,
                        journeyDate
                    );

            } catch (
                error
            ) {

                console.log(
                    "⚠️ Could not load timetable:",
                    error.message
                );
            }


            // =================================================
            // NO TIMETABLE
            // =================================================

            if (
                databaseRoute.length ===
                0
            ) {

                console.log(
                    "\n❌ TRAIN TIMETABLE UNAVAILABLE"
                );


                console.log(
                    `Train ${journey.trainNumber} cannot be analyzed until a valid timetable is available.`
                );


                await this.clearRecommendations(
                    journey._id
                );


                return null;
            }


            // =================================================
            // CHART PREPARATION TIME
            // =================================================

            let chartTiming =
                null;


            const originStop =
                databaseRoute[0];


            const originDeparture =
                originStop.departure;


            console.log(
                "\n========== CHART TIMING CHECK =========="
            );


            console.log(
                "Train:",
                journey.trainNumber
            );


            console.log(
                "Origin Station:",
                originStop.code
            );


            console.log(
                "Origin Name:",
                originStop.name
            );


            console.log(
                "Origin Departure:",
                originDeparture ||
                "NOT AVAILABLE"
            );


            if (
                originDeparture
            ) {

                try {

                    chartTiming =
                        calculateChartTiming({

                            journeyDate,

                            originDeparture,
                        });


                    console.log(
                        "Expected First Chart:",
                        chartTiming.firstChartTime
                    );


                    console.log(
                        "Expected Final Chart:",
                        chartTiming.finalChartTime
                    );


                    console.log(
                        "Should Check IRCTC:",
                        chartTiming.shouldCheckChart
                    );

                } catch (
                    timingError
                ) {

                    console.log(
                        "⚠️ Chart timing calculation failed:",
                        timingError.message
                    );


                    console.log(
                        "⚠️ Falling back to actual IRCTC chart-status check."
                    );


                    chartTiming =
                        null;
                }

            } else {

                console.log(
                    "⚠️ Origin departure time unavailable."
                );


                console.log(
                    "⚠️ Falling back to actual IRCTC chart-status check."
                );
            }


            // =================================================
            // BEFORE EXPECTED CHART
            // =================================================

            if (
                chartTiming &&
                !chartTiming.shouldCheckChart
            ) {

                console.log(
                    "\n========================================"
                );


                console.log(
                    "⏳ TOO EARLY FOR CHART CHECK"
                );


                console.log(
                    "========================================"
                );


                console.log(
                    "Expected First Chart:",
                    chartTiming.firstChartTime
                );


                console.log(
                    "No IRCTC chart API call will be made yet."
                );


                console.log(
                    "No vacant berth API call will be made."
                );


                console.log(
                    "🛑 Journey Optimizer will NOT run."
                );


                await this.clearRecommendations(
                    journey._id
                );


                return null;
            }


            // =================================================
            // CALL IRCTC CHART API
            // =================================================

            console.log(
                "\n========================================"
            );


            console.log(
                "🚆 Calling IRCTC Train Composition API"
            );


            console.log(
                "========================================"
            );


            let chart;


            try {

                chart =
                    await chartService
                        .fetchAndCacheChart(
                            journey.trainNumber,

                            journeyDate,

                            journey.boardingStation
                        );

            } catch (
                error
            ) {

                console.log(
                    "\n========================================"
                );


                console.log(
                    "⚠️ IRCTC CHART REQUEST FAILED"
                );


                console.log(
                    "========================================"
                );


                console.log(
                    "Error:",
                    error.message
                );


                await this.clearRecommendations(
                    journey._id
                );


                return null;
            }


            // =================================================
            // EMPTY RESPONSE
            // =================================================

            if (
                !chart
            ) {

                console.log(
                    "⚠️ Empty IRCTC chart response."
                );


                await this.clearRecommendations(
                    journey._id
                );


                return null;
            }


            // =================================================
            // REAL CHART STATUS
            // =================================================

            console.log(
                "\n============= REAL CHART STATUS ============="
            );


            console.log(
                "Chart Prepared:",
                chart.chartPrepared
            );


            console.log(
                "Chart One Date:",
                chart.chartOneDate ||
                null
            );


            console.log(
                "Chart Two Date:",
                chart.chartTwoDate ||
                null
            );


            // =================================================
            // CHART NOT PREPARED
            // =================================================

            if (
                !chart.chartPrepared
            ) {

                console.log(
                    "\n========================================"
                );


                console.log(
                    "🟡 IRCTC CHART NOT PREPARED"
                );


                console.log(
                    "========================================"
                );


                console.log(
                    "Expected chart window has been reached."
                );


                console.log(
                    "But IRCTC says the chart is still not prepared."
                );


                console.log(
                    "No vacancy API call will be made."
                );


                console.log(
                    "🛑 Journey Optimizer will NOT run."
                );


                await this.clearRecommendations(
                    journey._id
                );


                return null;
            }


            // =================================================
            // CHART PREPARED
            // =================================================

            console.log(
                "\n========================================"
            );


            console.log(
                "🟢 REAL IRCTC CHART PREPARED"
            );


            console.log(
                "========================================"
            );


            // =================================================
            // UPDATE JOURNEY STATUS + CREATE ALERT
            // =================================================
            //
            // The database update is atomic.
            //
            // Only the first monitoring cycle that changes
            // the journey from a non-prepared state to
            // CHART_PREPARED will create the notification.
            //
            // Repeated monitoring cycles will NOT create
            // duplicate chart-prepared notifications.
            // =================================================

            let chartPreparedTransition =
                false;


            try {

                const updatedJourney =
                    await Journey.findOneAndUpdate(
                        {
                            _id:
                                journey._id,

                            status: {
                                $ne:
                                    "CHART_PREPARED",
                            },
                        },

                        {
                            $set: {

                                status:
                                    "CHART_PREPARED",

                                lastCheckedAt:
                                    new Date(),
                            },
                        },

                        {
                            new: true,
                        }
                    ).lean();


                if (updatedJourney) {

                    chartPreparedTransition =
                        true;


                    journey.status =
                        "CHART_PREPARED";


                    journey.lastCheckedAt =
                        updatedJourney.lastCheckedAt;


                    console.log(
                        "🔔 Chart-prepared transition detected."
                    );


                    // =================================================
                    // CREATE IN-APP NOTIFICATION
                    // =================================================

                    try {

                        const trainNumber =
                            String(
                                journey.trainNumber ||
                                ""
                            )
                                .trim();


                        const boardingStation =
                            String(
                                journey.boardingStation ||
                                ""
                            )
                                .trim()
                                .toUpperCase();


                        const destinationStation =
                            String(
                                journey.destinationStation ||
                                ""
                            )
                                .trim()
                                .toUpperCase();


                        await notificationService
                            .createNotification({

                                userId:
                                    journey.userId,

                                type:
                                    "CHART_UPDATE",

                                title:
                                    "Chart Prepared",

                                message:
                                    `Chart is prepared for train ${trainNumber}. ` +
                                    `${boardingStation} → ${destinationStation}. ` +
                                    `ERJA is now checking seat availability.`,

                                journeyId:
                                    journey._id,
                            });


                        console.log(
                            "🔔 In-app chart-prepared notification created."
                        );


                    } catch (
                        notificationError
                    ) {

                        console.log(
                            "⚠️ Could not create chart-prepared notification:",
                            notificationError.message
                        );
                    }


                } else {

                    console.log(
                        "ℹ️ Chart was already marked as prepared. No duplicate alert created."
                    );
                }


            } catch (
                statusError
            ) {

                console.log(
                    "⚠️ Could not update journey chart-prepared status:",
                    statusError.message
                );
            }


            // =================================================
            // FETCH REAL VACANT BERTHS
            // =================================================
            //
            // Always fetch the preferred class first. If mixed-class
            // travel is explicitly enabled, also fetch every class
            // exposed by the prepared chart composition. This allows
            // the optimizer to find split/mixed-class paths even when
            // the preferred class has no direct berth covering the
            // complete journey.
            // =================================================

            let vacantBerths = [];

            const chartClasses =
                this.getChartClasses(
                    chart,
                    enabledClass.class
                );

            const classesToCheck =
                journey.allowMixedClass
                    ? chartClasses
                    : [enabledClass.class];

            console.log(
                "\n========== VACANCY CLASSES TO CHECK =========="
            );

            console.log(
                "Mixed Class Enabled:",
                Boolean(journey.allowMixedClass)
            );

            console.log(
                "Classes:",
                classesToCheck
            );

            for (const classCode of classesToCheck) {
                try {
                    console.log(
                        `\n🚆 Fetching IRCTC vacant berths for class ${classCode}`
                    );

                    const vacancyResponse =
                        await chartService.fetchVacantBerth(
                            journey.trainNumber,
                            journeyDate,
                            journey.boardingStation,
                            classCode,
                            1
                        );

                    const classVacancies =
                        Array.isArray(vacancyResponse?.vbd)
                            ? vacancyResponse.vbd
                            : [];

                    console.log(
                        `✅ ${classCode}: ${classVacancies.length} vacant berth records`
                    );

                    vacantBerths.push(
                        ...classVacancies.map((vacancy) => ({
                            ...vacancy,
                            classCode:
                                vacancy.classCode ||
                                vacancy.class ||
                                vacancy.travelClass ||
                                vacancy.cls ||
                                classCode,
                        }))
                    );
                } catch (error) {
                    console.log(
                        `⚠️ Vacancy request failed for class ${classCode}:`,
                        error.message
                    );

                    // Preferred-class failure remains fatal when mixed
                    // class is disabled. For mixed mode, continue so a
                    // different available class can still form a valid
                    // recommendation.
                    if (!journey.allowMixedClass && classCode === enabledClass.class) {
                        await this.clearRecommendations(journey._id);
                        return null;
                    }
                }
            }

            // Remove exact duplicate vacancy records that can occur
            // when IRCTC exposes the same berth through multiple
            // composition entries.
            const vacancyMap = new Map();

            vacantBerths.forEach((vacancy) => {
                const key = JSON.stringify([
                    vacancy.coachName || vacancy.coach || vacancy.coachCode || "",
                    vacancy.berthNumber ?? vacancy.berth ?? vacancy.berthNo ?? "",
                    vacancy.from || vacancy.fromStation || vacancy.fromStn || vacancy.fromCode || "",
                    vacancy.to || vacancy.toStation || vacancy.toStn || vacancy.toCode || "",
                    vacancy.classCode || vacancy.class || vacancy.travelClass || vacancy.cls || "",
                    vacancy.splitNo ?? "",
                ]);

                if (!vacancyMap.has(key)) {
                    vacancyMap.set(key, vacancy);
                }
            });

            vacantBerths = Array.from(vacancyMap.values());

            // =================================================
            // FINAL VACANCY SET
            // =================================================

            console.log(
                "\n✅ REAL VACANT BERTHS RECEIVED:",
                vacantBerths.length
            );

            console.dir(
                vacantBerths,
                {
                    depth: null,
                }
            );

            // =================================================
            // NO VACANCIES
            // =================================================

            if (vacantBerths.length === 0) {

                console.log(
                    "\nℹ️ IRCTC returned no vacant berths."
                );


                console.log(
                    "Journey Optimizer will NOT run."
                );


                await this.clearRecommendations(
                    journey._id
                );


                return null;
            }


            // =================================================
            // RUN OPTIMIZER
            // =================================================

            return await this.runOptimizer(
                journey,
                chart,
                vacantBerths
            );

        } catch (
            error
        ) {

            console.log(
                "\n========================================"
            );


            console.log(
                "❌ CHART WORKFLOW FAILED"
            );


            console.log(
                "========================================"
            );


            console.log(
                "Error:",
                error.message
            );


            if (
                error.stack
            ) {

                console.log(
                    error.stack
                );
            }


            throw error;
        }
    }


    // =========================================================
    // JOURNEY OPTIMIZER
    // =========================================================

    async runOptimizer(
        journey,
        chartData,
        vacantBerths
    ) {

        console.log(
            "\n========================================"
        );


        console.log(
            "🧠 RUNNING JOURNEY OPTIMIZER"
        );


        console.log(
            "========================================"
        );


        // =====================================================
        // GET DATABASE ROUTE
        // =====================================================

        let databaseRoute =
            await this.loadTrainRoute(
                journey.trainNumber,
                journey.journeyDate
            );


        // =====================================================
        // ROUTE REQUIRED
        // =====================================================

        if (
            databaseRoute.length ===
            0
        ) {

            console.log(
                "\n❌ NO VALID TRAIN TIMETABLE"
            );


            console.log(
                "Optimizer requires a real station route."
            );


            await this.clearRecommendations(
                journey._id
            );


            return null;
        }


        // =====================================================
        // VALIDATE ROUTE
        // =====================================================

        const validRoute =
            Array.isArray(
                databaseRoute
            ) &&

            databaseRoute.length >
                0 &&

            databaseRoute.every(
                (station) =>
                    station &&

                    typeof station.code ===
                        "string" &&

                    station.code
                        .trim()
                        .length >
                        0
            );


        if (
            !validRoute
        ) {

            console.log(
                "\n❌ INVALID TRAIN TIMETABLE"
            );


            console.log(
                "Optimizer requires real station codes."
            );


            await this.clearRecommendations(
                journey._id
            );


            return null;
        }


        // =====================================================
        // SOURCE
        // =====================================================

        const sourceCode =
            String(
                journey.boardingStation ||
                ""
            )
                .trim()
                .toUpperCase();


        // =====================================================
        // DESTINATION
        // =====================================================

        const destinationCode =
            String(
                journey.destinationStation ||
                ""
            )
                .trim()
                .toUpperCase();


        // =====================================================
        // FIND SOURCE
        // =====================================================

        const sourceIndex =
            databaseRoute.findIndex(
                (station) =>
                    String(
                        station.code
                    )
                        .trim()
                        .toUpperCase() ===
                    sourceCode
            );


        // =====================================================
        // FIND DESTINATION
        // =====================================================

        const destinationIndex =
            databaseRoute.findIndex(
                (station) =>
                    String(
                        station.code
                    )
                        .trim()
                        .toUpperCase() ===
                    destinationCode
            );


        // =====================================================
        // SOURCE NOT FOUND
        // =====================================================

        if (
            sourceIndex ===
            -1
        ) {

            console.log(
                `❌ Source station ${sourceCode} is not on train ${journey.trainNumber}.`
            );


            await this.clearRecommendations(
                journey._id
            );


            return null;
        }


        // =====================================================
        // DESTINATION NOT FOUND
        // =====================================================

        if (
            destinationIndex ===
            -1
        ) {

            console.log(
                `❌ Destination station ${destinationCode} is not on train ${journey.trainNumber}.`
            );


            await this.clearRecommendations(
                journey._id
            );


            return null;
        }


        // =====================================================
        // WRONG DIRECTION
        // =====================================================

        if (
            sourceIndex >=
            destinationIndex
        ) {

            console.log(
                `❌ Invalid route: ${sourceCode} does not occur before ${destinationCode}.`
            );


            await this.clearRecommendations(
                journey._id
            );


            return null;
        }


        // =====================================================
        // LOG VALID ROUTE
        // =====================================================

        console.log(
            "\n========== OPTIMIZER ROUTE =========="
        );


        console.log(
            "Route station count:",
            databaseRoute.length
        );


        console.log(
            "Journey source:",
            sourceCode
        );


        console.log(
            "Journey destination:",
            destinationCode
        );


        console.log(
            "Source route position:",
            sourceIndex + 1
        );


        console.log(
            "Destination route position:",
            destinationIndex + 1
        );


        console.log(
            "Route start:",
            databaseRoute[0]
        );


        console.log(
            "Route end:",
            databaseRoute[
                databaseRoute.length - 1
            ]
        );


        // =====================================================
        // RUN JOURNEY OPTIMIZER
        // =====================================================

        const recommendations =
            await journeyOptimizer.optimize({

                journey,

                route: {
                    stations:
                        databaseRoute,
                },

                chart:
                    chartData,

                vacancies:
                    Array.isArray(
                        vacantBerths
                    )
                        ? vacantBerths
                        : (
                            vacantBerths?.vbd ||
                            []
                        ),
            });


        console.log(
            "\n✅ Journey Optimizer Completed"
        );


        console.log(
            "Recommendations Generated:",
            recommendations?.length ||
            0
        );


        return recommendations;
    }
}


// =========================================================
// EXPORT
// =========================================================

module.exports =
    new ChartWorkflowService();