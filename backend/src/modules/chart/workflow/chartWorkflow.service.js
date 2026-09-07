const chartService = require("../chart.service");

const {
    calculateChartTiming,
} = require("../chartTiming.service");

const journeyOptimizer =
    require("../../journeyOptimizer/journeyOptimizer.service");

const recommendationService =
    require("../../recommendation/recommendation.service");

const TrainStop =
    require("../../train/trainStop.model");

// =========================================================
// CONFIGURATION
// =========================================================

const RESERVATION_CLASSES = [
    "1A",
    "2A",
    "3A",
    "3E",
    "SL",
];

// =========================================================
// CHART WORKFLOW SERVICE
// =========================================================

class ChartWorkflowService {

    // =====================================================
    // GET DATABASE TRAIN ROUTE
    // =====================================================

    async getDatabaseRoute(trainNumber) {

        const normalizedTrainNumber =
            String(trainNumber).trim();

        const stops =
            await TrainStop.find({
                trainNumber: normalizedTrainNumber,
            })
                .lean();

        if (!stops.length) {

            console.log(
                `⚠️ No timetable found in trainStops for train ${normalizedTrainNumber}.`
            );

            return [];
        }

        const orderedStops =
            stops
                .map((stop) => ({
                    ...stop,

                    routeOrder:
                        Number.parseFloat(
                            stop.no
                        ),
                }))
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

        const route =
            orderedStops.map((stop) => ({

                code:
                    String(
                        stop.code || ""
                    )
                        .trim()
                        .toUpperCase(),

                name:
                    stop.station || "",

                stationCode:
                    String(
                        stop.code || ""
                    )
                        .trim()
                        .toUpperCase(),

                stationName:
                    stop.station || "",

                arrival:
                    stop.arrival || "",

                departure:
                    stop.departure || "",

                halt:
                    stop.halt || "",

                platform:
                    stop.pf || "",

                day:
                    stop.day || "",

                distanceKm:
                    stop.km || "",

                routeOrder:
                    stop.routeOrder,
            }));

        console.log(
            `✅ Database timetable loaded: ${route.length} stops`
        );

        if (route.length > 0) {

            console.log(
                "First stop:",
                route[0].code,
                route[0].name
            );

            console.log(
                "Last stop:",
                route[route.length - 1].code,
                route[route.length - 1].name
            );
        }

        return route;
    }

    // =====================================================
    // CLEAR RECOMMENDATIONS
    // =====================================================

    async clearRecommendations(journeyId) {

        try {

            await recommendationService
                .saveRecommendations(
                    journeyId,
                    []
                );

            console.log(
                "🧹 Old recommendations cleared."
            );

        } catch (error) {

            console.log(
                "⚠️ Could not clear old recommendations:",
                error.message
            );
        }
    }

    // =====================================================
    // NORMALIZE VACANCY
    // =====================================================

    normalizeVacancy(
        vacancy,
        classCode
    ) {

        if (!vacancy) {
            return null;
        }

        const from =
            String(
                vacancy.from ||
                vacancy.fromStation ||
                vacancy.fromStn ||
                ""
            )
                .trim()
                .toUpperCase();

        const to =
            String(
                vacancy.to ||
                vacancy.toStation ||
                vacancy.toStn ||
                ""
            )
                .trim()
                .toUpperCase();

        const travelClass =
            String(
                vacancy.class ||
                vacancy.cls ||
                classCode ||
                ""
            )
                .trim()
                .toUpperCase();

        const coach =
            vacancy.coach ||
            vacancy.coachName ||
            null;

        const berth =
            vacancy.berth ??
            vacancy.berthNumber ??
            vacancy.berthCode ??
            null;

        if (
            !from ||
            !to ||
            !travelClass ||
            !coach
        ) {

            return null;
        }

        return {

            ...vacancy,

            from,

            to,

            class:
                travelClass,

            coach,

            berth,

            berthCode:
                vacancy.berthCode ||
                null,
        };
    }

    // =====================================================
    // ROUTE ORDER HELPER
    // =====================================================

    getRouteOrder(route, stationCode) {

        const normalizedCode =
            String(
                stationCode || ""
            )
                .trim()
                .toUpperCase();

        const station =
            route.find(
                (item) =>
                    String(
                        item.code || ""
                    )
                        .trim()
                        .toUpperCase() ===
                    normalizedCode
            );

        if (!station) {
            return null;
        }

        return Number.isFinite(
            Number(station.routeOrder)
        )
            ? Number(station.routeOrder)
            : null;
    }

    // =====================================================
    // DOES VACANCY COVER COMPLETE JOURNEY?
    // =====================================================

    vacancyCoversJourney(
        vacancy,
        route,
        source,
        destination
    ) {

        const sourceOrder =
            this.getRouteOrder(
                route,
                source
            );

        const destinationOrder =
            this.getRouteOrder(
                route,
                destination
            );

        const vacancyFromOrder =
            this.getRouteOrder(
                route,
                vacancy.from
            );

        const vacancyToOrder =
            this.getRouteOrder(
                route,
                vacancy.to
            );

        if (
            sourceOrder === null ||
            destinationOrder === null ||
            vacancyFromOrder === null ||
            vacancyToOrder === null
        ) {
            return false;
        }

        return (
            vacancyFromOrder <= sourceOrder &&
            vacancyToOrder >= destinationOrder
        );
    }

    // =====================================================
    // COUNT JOURNEY-COVERING VACANCIES
    // =====================================================

    countJourneyCoveringVacancies(
        vacancies,
        route,
        journey,
        classCode
    ) {

        const source =
            String(
                journey.boardingStation || ""
            )
                .trim()
                .toUpperCase();

        const destination =
            String(
                journey.destinationStation || ""
            )
                .trim()
                .toUpperCase();

        const covering =
            vacancies.filter(
                (vacancy) =>
                    String(
                        vacancy.class || ""
                    )
                        .trim()
                        .toUpperCase() ===
                    classCode &&
                    this.vacancyCoversJourney(
                        vacancy,
                        route,
                        source,
                        destination
                    )
            );

        /*
         * Count unique berth identities.
         *
         * The same berth may appear more than once
         * in IRCTC's response for different intervals.
         */
        const uniqueBerths =
            new Set();

        for (const vacancy of covering) {

            const berthIdentity =
                [
                    classCode,
                    String(
                        vacancy.coach || ""
                    )
                        .trim()
                        .toUpperCase(),

                    String(
                        vacancy.berth ??
                        vacancy.berthNumber ??
                        vacancy.berthCode ??
                        ""
                    )
                        .trim()
                        .toUpperCase(),
                ].join("|");

            uniqueBerths.add(
                berthIdentity
            );
        }

        return uniqueBerths.size;
    }

    // =====================================================
    // FETCH VACANCIES FOR ALL CLASSES
    // =====================================================

    async fetchAllClassVacancies(
        journey,
        journeyDate,
        databaseRoute
    ) {

        const allVacantBerths = [];

        const vacancySummary = [];

        console.log(
            "\n========================================"
        );

        console.log(
            "🚆 IRCTC VACANCY CHECK - ALL CLASSES"
        );

        console.log(
            "========================================"
        );

        for (
            const classCode
            of RESERVATION_CLASSES
        ) {

            try {

                console.log(
                    `\n🔎 Checking IRCTC class: ${classCode}`
                );

                const response =
                    await chartService
                        .fetchVacantBerth(
                            journey.trainNumber,
                            journeyDate,
                            journey.boardingStation,
                            classCode,
                            1
                        );

                const rawVacancies =
                    Array.isArray(
                        response?.vbd
                    )
                        ? response.vbd
                        : [];

                const normalizedVacancies =
                    rawVacancies
                        .map(
                            (vacancy) =>
                                this.normalizeVacancy(
                                    vacancy,
                                    classCode
                                )
                        )
                        .filter(Boolean);

                allVacantBerths.push(
                    ...normalizedVacancies
                );

                // -----------------------------------------
                // TOTAL RECORDS
                // -----------------------------------------

                const totalVacancies =
                    normalizedVacancies.length;

                // -----------------------------------------
                // JOURNEY COVERING RECORDS
                // -----------------------------------------

                const journeyCoveringVacancies =
                    this.countJourneyCoveringVacancies(
                        normalizedVacancies,
                        databaseRoute,
                        journey,
                        classCode
                    );

                const status =
    totalVacancies > 0
        ? "AVAILABLE"
        : "ERROR";

                vacancySummary.push({

                    class:
                        classCode,

                    /*
                     * Kept as `count` for backward
                     * compatibility with existing UI/code.
                     */
                    count:
                        totalVacancies,

                    totalVacancies,

                    journeyCoveringVacancies,

                    status,

                    error:
                        "",
                });

                console.log(
                    `✅ ${classCode}: ${totalVacancies} total vacancy records`
                );

                console.log(
                    `   🎯 ${classCode}: ${journeyCoveringVacancies} berths cover ${journey.boardingStation} → ${journey.destinationStation}`
                );

            } catch (error) {

                console.log(
                    `⚠️ ${classCode} vacancy request failed:`,
                    error.message
                );

                vacancySummary.push({

                    class:
                        classCode,

                    count:
                        0,

                    totalVacancies:
                        0,

                    journeyCoveringVacancies:
                        0,

                    status:
                        "ERROR",

                    error:
                        error.message,
                });
            }
        }

        console.log(
            "\n========================================"
        );

        console.log(
            "📊 IRCTC VACANCY SUMMARY"
        );

        console.log(
            "========================================"
        );

        console.table(
            vacancySummary
        );

        console.log(
            "Total usable vacancy records:",
            allVacantBerths.length
        );

        return {

            vacancies:
                allVacantBerths,

            vacancySummary,
        };
    }

    // =====================================================
    // PROCESS JOURNEY
    // =====================================================

    async processJourney(journey) {

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
            // ENABLED CLASSES
            // =================================================

            const enabledClasses =
                Array.isArray(
                    journey.allowedClasses
                )
                    ? journey.allowedClasses
                        .filter(
                            (cls) =>
                                cls.enabled
                        )
                        .map(
                            (cls) =>
                                String(
                                    cls.class
                                )
                                    .trim()
                                    .toUpperCase()
                        )
                    : [];

            if (
                enabledClasses.length === 0
            ) {

                console.log(
                    "❌ No enabled class found."
                );

                return null;
            }

            console.log(
                "Preferred Classes:",
                enabledClasses
            );

            // =================================================
            // MOCK MODE
            // =================================================

            const useMockData =
                process.env.USE_MOCK_CHART ===
                "true";

            if (useMockData) {

                console.log(
                    "\n🧪 MOCK MODE ENABLED"
                );

                console.log(
                    "⚠️ Real IRCTC data will not be used."
                );

                return await this.runOptimizer(
                    journey,
                    {
                        chartPrepared:
                            true,
                    },
                    [],
                    []
                );
            }

            // =================================================
            // JOURNEY DATE
            // =================================================

            const journeyDate =
                new Date(
                    journey.journeyDate
                )
                    .toISOString()
                    .split("T")[0];

            // =================================================
            // DATABASE ROUTE
            // =================================================

            const databaseRoute =
                await this.getDatabaseRoute(
                    journey.trainNumber
                );

            if (
                !Array.isArray(
                    databaseRoute
                ) ||
                databaseRoute.length === 0
            ) {

                console.log(
                    "❌ Train timetable unavailable."
                );

                await this.clearRecommendations(
                    journey._id
                );

                return null;
            }

            // =================================================
            // VALIDATE USER ROUTE
            // =================================================

            const sourceCode =
                String(
                    journey.boardingStation ||
                    ""
                )
                    .trim()
                    .toUpperCase();

            const destinationCode =
                String(
                    journey.destinationStation ||
                    ""
                )
                    .trim()
                    .toUpperCase();

            const sourceIndex =
                databaseRoute.findIndex(
                    (station) =>
                        station.code ===
                        sourceCode
                );

            const destinationIndex =
                databaseRoute.findIndex(
                    (station) =>
                        station.code ===
                        destinationCode
                );

            if (
                sourceIndex === -1 ||
                destinationIndex === -1 ||
                sourceIndex >= destinationIndex
            ) {

                console.log(
                    `❌ Invalid route ${sourceCode} → ${destinationCode}`
                );

                await this.clearRecommendations(
                    journey._id
                );

                return null;
            }

            // =================================================
            // CHART TIMING
            // =================================================

            const originDeparture =
                databaseRoute[0]?.departure;

            let chartTiming = null;

            if (originDeparture) {

                try {

                    chartTiming =
                        calculateChartTiming({

                            journeyDate,

                            originDeparture,
                        });

                    console.log(
                        "\n========== CHART TIMING =========="
                    );

                    console.log(
                        "Expected First Chart:",
                        chartTiming.firstChartTime
                    );

                    console.log(
                        "Expected Final Chart:",
                        chartTiming.finalChartTime
                    );

                    console.log(
                        "Should Check:",
                        chartTiming.shouldCheckChart
                    );

                } catch (error) {

                    console.log(
                        "⚠️ Chart timing failed:",
                        error.message
                    );

                    chartTiming = null;
                }
            }

            // =================================================
            // BEFORE EXPECTED CHART
            // =================================================

            if (
                chartTiming &&
                !chartTiming.shouldCheckChart
            ) {

                console.log(
                    "\n⏳ TOO EARLY FOR CHART CHECK"
                );

                const waitChartData = {

                    chartPrepared:
                        false,

                    chartOneTime:
                        chartTiming.firstChartTime,

                    chartTwoTime:
                        chartTiming.finalChartTime,

                    firstChartTime:
                        chartTiming.firstChartTime,

                    finalChartTime:
                        chartTiming.finalChartTime,

                    reason:
                        "BEFORE_EXPECTED_CHART_TIME",
                };

                return await this.runOptimizer(
                    journey,
                    waitChartData,
                    [],
                    []
                );
            }

            // =================================================
            // FETCH IRCTC CHART
            // =================================================

            console.log(
                "\n🚆 Calling IRCTC Train Composition API"
            );

            let chart;

            try {

                chart = await chartService.fetchAndCacheChart(
  journey.trainNumber,
  journeyDate,
  journey.boardingStation,
  {
    journeyId: journey._id,

    firstChartTime:
      chartTiming?.firstChartTime || null,

    finalChartTime:
      chartTiming?.finalChartTime || null,

    boardingStationName:
      databaseRoute.find(
        (stop) =>
          String(stop.code).trim().toUpperCase() ===
          String(journey.boardingStation).trim().toUpperCase()
      )?.station || "",

    finalChartStationCode:
      null,

    finalChartStationName:
      "",
  }
);

            } catch (error) {

                console.log(
                    "❌ IRCTC chart request failed:",
                    error.message
                );

                await this.clearRecommendations(
                    journey._id
                );

                return null;
            }

            if (!chart) {

                console.log(
                    "❌ Empty IRCTC chart response."
                );

                await this.clearRecommendations(
                    journey._id
                );

                return null;
            }

            console.log(
                "\n============= REAL CHART STATUS ============="
            );

            console.log(
                "Chart Prepared:",
                chart.chartPrepared
            );

            // =================================================
            // CHART NOT PREPARED
            // =================================================

            if (!chart.chartPrepared) {

                console.log(
                    "🟡 IRCTC chart is not prepared."
                );

                return await this.runOptimizer(
                    journey,
                    chart,
                    [],
                    []
                );
            }

            // =================================================
            // CHART PREPARED
            // =================================================

            console.log(
                "\n🟢 REAL IRCTC CHART PREPARED"
            );

            // =================================================
            // FETCH ALL CLASS VACANCIES
            // =================================================

            const {
                vacancies,
                vacancySummary,

            } =
                await this.fetchAllClassVacancies(
                    journey,
                    journeyDate,
                    databaseRoute
                );

            // =================================================
            // NO USABLE VACANCIES
            // =================================================

            if (
                vacancies.length === 0
            ) {

                console.log(
                    "\nℹ️ IRCTC returned no usable vacant berths."
                );

                return await this.runOptimizer(
                    journey,
                    chart,
                    [],
                    vacancySummary
                );
            }

            // =================================================
            // RUN OPTIMIZER
            // =================================================

            return await this.runOptimizer(
                journey,
                chart,
                vacancies,
                vacancySummary
            );

        } catch (error) {

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

            if (error.stack) {
                console.log(
                    error.stack
                );
            }

            throw error;
        }
    }

    // =====================================================
    // RUN JOURNEY OPTIMIZER
    // =====================================================

    async runOptimizer(
        journey,
        chartData,
        vacantBerths,
        vacancySummary = []
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

        const databaseRoute =
            await this.getDatabaseRoute(
                journey.trainNumber
            );

        if (
            !Array.isArray(
                databaseRoute
            ) ||
            databaseRoute.length === 0
        ) {

            console.log(
                "❌ No database timetable available."
            );

            await this.clearRecommendations(
                journey._id
            );

            return null;
        }

        // =================================================
        // ROUTE SAFETY
        // =================================================

        const routeStations =
            databaseRoute;

        const sourceCode =
            String(
                journey.boardingStation ||
                ""
            )
                .trim()
                .toUpperCase();

        const destinationCode =
            String(
                journey.destinationStation ||
                ""
            )
                .trim()
                .toUpperCase();

        const sourceIndex =
            routeStations.findIndex(
                (station) =>
                    station.code ===
                    sourceCode
            );

        const destinationIndex =
            routeStations.findIndex(
                (station) =>
                    station.code ===
                    destinationCode
            );

        if (
            sourceIndex === -1 ||
            destinationIndex === -1 ||
            sourceIndex >= destinationIndex
        ) {

            console.log(
                `❌ Invalid route ${sourceCode} → ${destinationCode}`
            );

            await this.clearRecommendations(
                journey._id
            );

            return null;
        }

        console.log(
            "\n========== OPTIMIZER ROUTE =========="
        );

        console.log(
            "Train:",
            journey.trainNumber
        );

        console.log(
            "Source:",
            sourceCode
        );

        console.log(
            "Destination:",
            destinationCode
        );

        console.log(
            "Source Position:",
            sourceIndex + 1
        );

        console.log(
            "Destination Position:",
            destinationIndex + 1
        );

        console.log(
            "Route Stops:",
            routeStations.length
        );

        // =================================================
        // OPTIMIZER
        // =================================================

        const recommendations =
            await journeyOptimizer.optimize({

                journey,

                route: {
                    stations:
                        routeStations,
                },

                chart:
                    chartData,

                vacancies:
                    Array.isArray(
                        vacantBerths
                    )
                        ? vacantBerths
                        : [],

                vacancySummary:
                    Array.isArray(
                        vacancySummary
                    )
                        ? vacancySummary
                        : [],
            });

        console.log(
            "\n✅ Journey Optimizer Completed"
        );

        console.log(
            "Recommendations Generated:",
            recommendations?.length || 0
        );

        return recommendations;
    }
}

// =========================================================
// EXPORT
// =========================================================

module.exports =
    new ChartWorkflowService();