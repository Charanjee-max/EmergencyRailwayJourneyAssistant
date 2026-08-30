const chartService = require("../chart.service");
const journeyOptimizer = require("../../journeyOptimizer/journeyOptimizer.service");

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

            const enabledClass = journey.allowedClasses.find(
                cls => cls.enabled
            );

            if (!enabledClass) {

                console.log("❌ No enabled class found.");

                return null;
            }

            console.log(
                "Preferred Class:",
                enabledClass.class
            );

            // ==========================================
            // Fetch real chart
            // ==========================================

            const chart = await chartService.fetchAndCacheChart(

                journey.trainNumber,

                journey.journeyDate
                    .toISOString()
                    .split("T")[0],

                journey.boardingStation

            );

            // ==========================================
            // Development Override
            // ==========================================

            const useMockData =
                process.env.NODE_ENV === "development" &&
                process.env.FORCE_CHART === "true";

            if (useMockData) {

                console.log("\n🧪 DEVELOPMENT MODE");
                console.log("🚀 Using dynamic mock chart data.");

                chart.chartPrepared = true;

            }

            // ==========================================
            // Check Chart
            // ==========================================

            if (!chart.chartPrepared) {

                console.log(
                    "⏳ Chart not prepared yet."
                );

                return null;
            }

            console.log("✅ Chart Prepared");

            // ==========================================
            // Prepare Chart + Vacancies
            // ==========================================

            let chartData = chart;
            let vacantBerths = [];

            if (useMockData) {

                console.log(
                    "\n🧪 USING DYNAMIC MOCK DATA"
                );

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

                // ------------------------------------------
                // Use the mock chart route
                // ------------------------------------------

                chartData = {
                    ...chart.toObject(),

                    chartPrepared: true,

                    cdd: mockChart.cdd
                };

                // ------------------------------------------
                // Generate vacancies according to journey
                // ------------------------------------------

                vacantBerths =
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

            } else {

                // ==========================================
                // REAL IRCTC VACANCY DATA
                // ==========================================

                const vacancyResponse =
                    await chartService.fetchVacantBerth(

                        journey.trainNumber,

                        journey.journeyDate
                            .toISOString()
                            .split("T")[0],

                        journey.boardingStation,

                        enabledClass.class,

                        2

                    );

                vacantBerths =
                    vacancyResponse?.vbd || [];

            }

            console.log(
                "\n✅ Vacant Berths Received:",
                vacantBerths.length
            );

            // ==========================================
            // Run Journey Optimizer
            // ==========================================

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

                    vacancies: vacantBerths

                });

            console.log(
                "\n✅ Journey Optimizer Completed"
            );

            console.log(
                "Recommendations Generated:",
                recommendations?.length || 0
            );

            return recommendations;

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

            console.log(error.message);

            if (error.stack) {
                console.log(error.stack);
            }

            throw error;
        }
    }
}

module.exports = new ChartWorkflowService();