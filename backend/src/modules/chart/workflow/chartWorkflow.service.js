const chartService = require("../chart.service");

const journeyOptimizer =
    require("../../journeyOptimizer/journeyOptimizer.service");

const recommendationService =
    require("../../recommendation/recommendation.service");

// Mock modules are kept only for explicit testing.
const mockChart = require("../mock/mockChart");
const mockVacancies = require("../mock/mockVacancies");


class ChartWorkflowService {

    // =========================================================
    // PROCESS JOURNEY
    // =========================================================

    async processJourney(journey) {

        try {

            console.log("\n========================================");
            console.log("🚆 CHART WORKFLOW STARTED");
            console.log("========================================");

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
                    cls => cls.enabled
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


                // =================================================
                // IMPORTANT
                // =================================================
                //
                // Do NOT:
                // - generate mock data
                // - mark chart prepared
                // - run optimizer
                //
                // Clear old recommendations so that
                // stale recommendations are not displayed.
                // =================================================

                try {

                    await recommendationService
                        .saveRecommendations(
                            journey._id,
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


                return null;
            }


            // =====================================================
            // EMPTY RESPONSE
            // =====================================================

            if (!chart) {

                console.log(
                    "⚠️ Empty IRCTC chart response."
                );


                try {

                    await recommendationService
                        .saveRecommendations(
                            journey._id,
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
                    "Chart is not ready yet."
                );

                console.log(
                    "No vacancy API call will be made."
                );

                console.log(
                    "No mock vacancies will be generated."
                );

                console.log(
                    "Journey Optimizer will NOT run."
                );


                // =================================================
                // CLEAR STALE RECOMMENDATIONS
                // =================================================

                try {

                    await recommendationService
                        .saveRecommendations(
                            journey._id,
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


                return null;
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


                vacancyResponse =
                    await chartService.fetchVacantBerth(

                        journey.trainNumber,

                        journeyDate,

                        journey.boardingStation,

                        enabledClass.class,

                        2

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


                // =================================================
                // Do NOT fallback to mock vacancy data.
                // =================================================

                try {

                    await recommendationService
                        .saveRecommendations(
                            journey._id,
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


                try {

                    await recommendationService
                        .saveRecommendations(
                            journey._id,
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


        const recommendations =
            await journeyOptimizer.optimize({

                journey,

                route: {

                    stations:
                        chartData.cdd || []

                },

                chart:
                    chartData,

                vacancies:
                    vacantBerths || []

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