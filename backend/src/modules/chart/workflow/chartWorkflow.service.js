const chartService = require("../chart.service");
const journeyOptimizer = require("../../journeyOptimizer/journeyOptimizer.service");

// Mock modules are kept for explicit development/testing only.
const mockChart = require("../mock/mockChart");
const mockVacancies = require("../mock/mockVacancies");

class ChartWorkflowService {

    async processJourney(journey) {

        try {

            console.log("\n========================================");
            console.log("🚆 CHART WORKFLOW STARTED");
            console.log("========================================");

            console.log("Journey ID:", journey._id);
            console.log("Train Number:", journey.trainNumber);
            console.log("Journey Date:", journey.journeyDate);

            console.log(
                "Source:",
                journey.boardingStation
            );

            console.log(
                "Destination:",
                journey.destinationStation
            );


            // ==========================================
            // Get enabled class
            // ==========================================

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


            // ==========================================
            // EXPLICIT MOCK MODE ONLY
            // ==========================================

            /*
             * Mock data must NEVER be enabled simply
             * because NODE_ENV is development.
             *
             * Enable it explicitly with:
             *
             * USE_MOCK_CHART=true
             *
             * This allows us to test the optimizer
             * without pretending that mock data is
             * real railway availability.
             */

            const useMockData =
                process.env.USE_MOCK_CHART === "true";


            if (useMockData) {

                console.log("\n🧪 EXPLICIT MOCK MODE");
                console.log(
                    "⚠️ Real IRCTC chart data will NOT be used."
                );

            } else {

                console.log(
                    "\n🚆 REAL IRCTC MODE"
                );

            }


            // ==========================================
            // MOCK WORKFLOW
            // ==========================================

            if (useMockData) {

                console.log(
                    "\n🧪 USING DYNAMIC MOCK CHART DATA"
                );

                const mockChartData = {
                    chartPrepared: true,
                    cdd: mockChart.cdd || [],
                    chartOneTime: null,
                    chartTwoTime: null,
                    coaches: mockChart.cdd || []
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


                // ==========================================
                // Generate mock vacancies
                // ==========================================

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


            // ==========================================
            // REAL IRCTC CHART
            // ==========================================

            const journeyDate =
                journey.journeyDate
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
                    error.message
                );


                /*
                 * IMPORTANT:
                 *
                 * Do NOT use mock data here.
                 *
                 * Do NOT mark the chart as prepared.
                 *
                 * Do NOT run the optimizer.
                 *
                 * The next monitoring cycle can try again.
                 */

                return null;
            }


            // ==========================================
            // REAL CHART STATUS
            // ==========================================

            if (!chart) {

                console.log(
                    "⚠️ Empty chart response."
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


            // ==========================================
            // CHART NOT PREPARED
            // ==========================================

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


                return null;
            }


            // ==========================================
            // REAL CHART PREPARED
            // ==========================================

            console.log(
                "\n========================================"
            );

            console.log(
                "🟢 REAL IRCTC CHART PREPARED"
            );

            console.log(
                "========================================"
            );


            // ==========================================
            // Fetch REAL vacant berths
            // ==========================================

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
                    error.message
                );


                /*
                 * Again, NEVER replace this with
                 * mock vacancy data automatically.
                 */

                return null;
            }


            const vacantBerths =
                vacancyResponse?.vbd || [];


            console.log(
                "\n✅ REAL VACANT BERTHS RECEIVED:",
                vacantBerths.length
            );


            if (!vacantBerths.length) {

                console.log(
                    "ℹ️ No vacant berths returned by IRCTC."
                );

            }


            // ==========================================
            // RUN OPTIMIZER
            // ==========================================

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
                error.message
            );

            if (error.stack) {
                console.log(error.stack);
            }

            throw error;
        }
    }


    // ==========================================
    // JOURNEY OPTIMIZER
    // ==========================================

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

                chart: chartData,

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


module.exports =
    new ChartWorkflowService();