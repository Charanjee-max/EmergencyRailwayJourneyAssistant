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

// Mock modules are kept only for explicit testing.
const mockChart =
    require("../mock/mockChart");

const mockVacancies =
    require("../mock/mockVacancies");


class ChartWorkflowService {

    // =========================================================
    // GET DATABASE TRAIN ROUTE
    // =========================================================

    async getDatabaseRoute(trainNumber) {

        const normalizedTrainNumber =
            String(trainNumber).trim();

        const stops =
            await TrainStop.find({
                trainNumber: normalizedTrainNumber
            })
                .lean();

        if (!stops.length) {

            console.log(
                `⚠️ No timetable found in trainStops for train ${normalizedTrainNumber}.`
            );

            return [];
        }

        // ---------------------------------------------------------
        // Convert timetable "no" into numeric route order.
        //
        // Examples:
        // "1"   -> 1
        // "1.1" -> 1.1
        // "1.2" -> 1.2
        // "33"  -> 33
        // ---------------------------------------------------------

        const orderedStops =
            stops
                .map((stop) => ({
                    ...stop,

                    routeOrder:
                        Number.parseFloat(stop.no)
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


        // ---------------------------------------------------------
        // Convert database timetable records into the format
        // expected by ReservationGraphBuilder.
        // ---------------------------------------------------------

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
                    stop.routeOrder
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


    // =========================================================
    // CLEAR RECOMMENDATIONS
    // =========================================================

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

        } catch (clearError) {

            console.log(
                "⚠️ Could not clear old recommendations:",
                clearError.message
            );
        }
    }


    // =========================================================
    // PROCESS JOURNEY
    // =========================================================

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


            // =====================================================
            // GET ENABLED CLASS
            // =====================================================

            const enabledClass =
                journey.allowedClasses?.find(
                    (cls) => cls.enabled
                );


            if (!enabledClass) {

                console.log(
                    "❌ No enabled class found."
                );

                return null;
            }


            console.log(
                "Preferred Class:",
                enabledClass.class
            );


            // =====================================================
            // EXPLICIT MOCK MODE
            // =====================================================

            /*
             * Mock data is ONLY enabled when:
             *
             * USE_MOCK_CHART=true
             *
             * NODE_ENV=development alone will NOT enable mocks.
             */

            const useMockData =
                process.env.USE_MOCK_CHART === "true";


            if (useMockData) {

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


            // =====================================================
            // MOCK WORKFLOW
            // =====================================================

            if (useMockData) {

                console.log(
                    "\n🧪 USING DYNAMIC MOCK CHART DATA"
                );


                const mockChartData = {

                    chartPrepared: true,

                    cdd:
                        mockChart.cdd || [],

                    chartOneTime: null,

                    chartTwoTime: null,

                    coaches:
                        mockChart.cdd || []
                };


                console.log(
                    "Mock Source:",
                    journey.boardingStation
                );

                console.log(
                    "Mock Destination:",
                    journey.destinationStation
                );

                console.log(
                    "Mock Class:",
                    enabledClass.class
                );


                // =================================================
                // GENERATE MOCK VACANCIES
                // =================================================

                const vacantBerths =
                    mockVacancies.generateVacancies({

                        source:
                            journey.boardingStation,

                        destination:
                            journey.destinationStation,

                        travelClass:
                            enabledClass.class,

                        allowMixedClass:
                            journey.allowMixedClass || false
                    });


                console.log(
                    "\n========== MOCK VACANCIES =========="
                );


                console.dir(
                    vacantBerths,
                    {
                        depth: null
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


            // =====================================================
            // REAL IRCTC WORKFLOW
            // =====================================================

            const journeyDate =
                new Date(journey.journeyDate)
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


            // =====================================================
            // GET DATABASE TIMETABLE
            // =====================================================

            let databaseRoute = [];

            try {

                databaseRoute =
                    await this.getDatabaseRoute(
                        journey.trainNumber
                    );

            } catch (error) {

                console.log(
                    "⚠️ Could not load database timetable:",
                    error.message
                );
            }


            // =====================================================
            // CHART PREPARATION TIME CHECK
            //
            // December 2025 Railway Board rule.
            //
            // IMPORTANT:
            // We do NOT use RailWise as an HTTP dependency.
            //
            // The rule is implemented locally in
            // chartTiming.service.js.
            //
            // IRCTC remains the final authority.
            // =====================================================

            let chartTiming = null;


            if (databaseRoute.length > 0) {

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
                    originDeparture || "NOT AVAILABLE"
                );


                // -------------------------------------------------
                // Only calculate when timetable contains a valid
                // departure time.
                // -------------------------------------------------

                if (originDeparture) {

                    try {

                        chartTiming =
                            calculateChartTiming({

                                journeyDate,

                                originDeparture
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


                    } catch (timingError) {

                        console.log(
                            "⚠️ Chart timing calculation failed:",
                            timingError.message
                        );


                        console.log(
                            "⚠️ Falling back to actual IRCTC chart-status check."
                        );


                        chartTiming = null;
                    }

                } else {

                    console.log(
                        "⚠️ Origin departure time unavailable."
                    );

                    console.log(
                        "⚠️ Falling back to actual IRCTC chart-status check."
                    );
                }
            }


            // =====================================================
            // BEFORE EXPECTED CHART TIME
            //
            // DO NOT CALL IRCTC YET.
            // =====================================================

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
                    "Train:",
                    journey.trainNumber
                );


                console.log(
                    "Journey Date:",
                    journeyDate
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
                    "🧠 Running Journey Optimizer for WAIT_FOR_CHART recommendation."
                );


                // -------------------------------------------------
                // We deliberately pass an empty vacancy array.
                //
                // This allows WaitChartStrategy to generate:
                //
                // WAIT_FOR_CHART
                // -------------------------------------------------

                const waitChartData = {

                    chartPrepared: false,

                    chartOneTime:
                        chartTiming.firstChartTime,

                    chartTwoTime:
                        chartTiming.finalChartTime,

                    firstChartTime:
                        chartTiming.firstChartTime,

                    finalChartTime:
                        chartTiming.finalChartTime,

                    reason:
                        "BEFORE_EXPECTED_CHART_TIME"
                };


                return await this.runOptimizer(
                    journey,
                    waitChartData,
                    []
                );
            }


            // =====================================================
            // IRCTC CHART API
            //
            // We reached the expected chart window.
            // Now IRCTC becomes the final authority.
            // =====================================================

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


            // =====================================================
            // FETCH REAL CHART
            // =====================================================

            try {

                chart =
                    await chartService.fetchAndCacheChart(
                        journey.trainNumber,
                        journeyDate,
                        journey.boardingStation
                    );

            } catch (error) {

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


            // =====================================================
            // EMPTY RESPONSE
            // =====================================================

            if (!chart) {

                console.log(
                    "⚠️ Empty IRCTC chart response."
                );


                await this.clearRecommendations(
                    journey._id
                );


                return null;
            }


            // =====================================================
            // REAL CHART STATUS
            // =====================================================

            console.log(
                "\n============= REAL CHART STATUS ============="
            );


            console.log(
                "Chart Prepared:",
                chart.chartPrepared
            );


            // =====================================================
            // CHART NOT PREPARED
            // =====================================================

            if (!chart.chartPrepared) {

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
                    "Expected chart window has been reached,"
                );


                console.log(
                    "but IRCTC says the chart is still not prepared."
                );


                console.log(
                    "No vacancy API call will be made."
                );


                console.log(
                    "No mock vacancies will be generated."
                );


                console.log(
                    "🧠 Running Journey Optimizer for WAIT_FOR_CHART recommendation."
                );


                // -------------------------------------------------
                // IMPORTANT
                //
                // Do NOT clear recommendations here.
                //
                // The optimizer can create:
                //
                // WAIT_FOR_CHART
                // -------------------------------------------------

                return await this.runOptimizer(
                    journey,
                    chart,
                    []
                );
            }


            // =====================================================
            // REAL CHART PREPARED
            // =====================================================

            console.log(
                "\n========================================"
            );

            console.log(
                "🟢 REAL IRCTC CHART PREPARED"
            );

            console.log(
                "========================================"
            );


            // =====================================================
            // FETCH REAL VACANT BERTHS
            // =====================================================

            let vacancyResponse;


            try {

                console.log(
                    "\n========================================"
                );

                console.log(
                    "🚆 Calling IRCTC Vacant Berth API"
                );

                console.log(
                    "========================================"
                );


                // -------------------------------------------------
                // IMPORTANT:
                //
                // chartType MUST be 1.
                //
                // The captured IRCTC request uses:
                //
                // chartType: 1
                // -------------------------------------------------

                vacancyResponse =
                    await chartService.fetchVacantBerth(

                        journey.trainNumber,

                        journeyDate,

                        journey.boardingStation,

                        enabledClass.class,

                        1
                    );


            } catch (error) {

                console.log(
                    "\n========================================"
                );

                console.log(
                    "⚠️ IRCTC VACANCY REQUEST FAILED"
                );

                console.log(
                    "========================================"
                );


                console.log(
                    "Error:",
                    error.message
                );


                // -------------------------------------------------
                // Do NOT fallback to mock vacancy data.
                // -------------------------------------------------

                await this.clearRecommendations(
                    journey._id
                );


                return null;
            }


            // =====================================================
            // EXTRACT REAL VACANCIES
            // =====================================================

            const vacantBerths =
                vacancyResponse?.vbd || [];


            console.log(
                "\n✅ REAL VACANT BERTHS RECEIVED:",
                vacantBerths.length
            );


            console.dir(
                vacantBerths,
                {
                    depth: null
                }
            );


            // =====================================================
            // NO VACANCIES
            // =====================================================

            if (!vacantBerths.length) {

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


            // =====================================================
            // RUN OPTIMIZER
            // =====================================================

            return await this.runOptimizer(
                journey,
                chart,
                vacantBerths
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
        // GET REAL DATABASE ROUTE
        // =====================================================

        let databaseRoute = [];


        try {

            databaseRoute =
                await this.getDatabaseRoute(
                    journey.trainNumber
                );

        } catch (error) {

            console.log(
                "⚠️ Could not load database timetable:",
                error.message
            );
        }


        // =====================================================
        // SELECT ROUTE
        // =====================================================

        let routeStations;


        if (databaseRoute.length > 0) {

            console.log(
                "\n🚆 USING MONGODB TRAIN TIMETABLE"
            );


            console.log(
                "Train:",
                journey.trainNumber
            );


            console.log(
                "Stops:",
                databaseRoute.length
            );


            routeStations =
                databaseRoute;

        } else {

            // -------------------------------------------------
            // IMPORTANT:
            //
            // chartData.cdd contains TRAIN COACH COMPOSITION.
            //
            // Example:
            // A1, B1, B2, S1, S2...
            //
            // It is NOT the station timetable.
            //
            // Therefore NEVER use cdd as routeStations.
            // -------------------------------------------------

            console.log(
                "\n⚠️ MONGODB TIMETABLE NOT AVAILABLE"
            );


            console.log(
                `⚠️ No station timetable available for train ${journey.trainNumber}.`
            );


            console.log(
                "❌ IRCTC coach composition will NOT be used as timetable."
            );


            console.log(
                "❌ Journey Optimizer will NOT run without a valid station route."
            );


            await this.clearRecommendations(
                journey._id
            );


            return null;
        }


        // =====================================================
        // SAFETY VALIDATION
        // =====================================================

        const validRoute =
            Array.isArray(routeStations) &&
            routeStations.length > 0 &&
            routeStations.every(
                (station) =>
                    station &&
                    typeof station.code === "string" &&
                    station.code.trim().length > 0
            );


        if (!validRoute) {

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
        // VERIFY JOURNEY SOURCE + DESTINATION
        // =====================================================

        const sourceCode =
            String(
                journey.boardingStation || ""
            )
                .trim()
                .toUpperCase();


        const destinationCode =
            String(
                journey.destinationStation || ""
            )
                .trim()
                .toUpperCase();


        const sourceIndex =
            routeStations.findIndex(
                (station) =>
                    String(
                        station.code
                    )
                        .trim()
                        .toUpperCase() === sourceCode
            );


        const destinationIndex =
            routeStations.findIndex(
                (station) =>
                    String(
                        station.code
                    )
                        .trim()
                        .toUpperCase() === destinationCode
            );


        if (sourceIndex === -1) {

            console.log(
                `❌ Source station ${sourceCode} is not on train ${journey.trainNumber}.`
            );


            await this.clearRecommendations(
                journey._id
            );


            return null;
        }


        if (destinationIndex === -1) {

            console.log(
                `❌ Destination station ${destinationCode} is not on train ${journey.trainNumber}.`
            );


            await this.clearRecommendations(
                journey._id
            );


            return null;
        }


        if (sourceIndex >= destinationIndex) {

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
            routeStations.length
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
            routeStations[0]
        );


        console.log(
            "Route end:",
            routeStations[
                routeStations.length - 1
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
                        routeStations
                },

                chart:
                    chartData,

                vacancies:
                    Array.isArray(vacantBerths)
                        ? vacantBerths
                        : (
                            vacantBerths?.vbd ||
                            []
                        )
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