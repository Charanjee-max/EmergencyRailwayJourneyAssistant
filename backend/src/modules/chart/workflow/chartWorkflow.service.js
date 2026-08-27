const chartService = require("../chart.service");
const journeyOptimizer = require("../../journeyOptimizer/journeyOptimizer.service");

class ChartWorkflowService {

    async processJourney(journey) {

        try {

            console.log("\n========================================");
            console.log("🚆 CHART WORKFLOW STARTED");
            console.log("========================================");

            // Get enabled class
            const enabledClass = journey.allowedClasses.find(
                cls => cls.enabled
            );

            if (!enabledClass) {

                console.log("❌ No enabled class found.");

                return null;

            }

            // Fetch chart
            const chart = await chartService.fetchAndCacheChart(

                journey.trainNumber,

                journey.journeyDate.toISOString().split("T")[0],

                journey.boardingStation

            );

            // Check chart preparation
            if (!chart.chartPrepared) {

                console.log("⏳ Chart not prepared yet.");

                return null;

            }

            console.log("✅ Chart Prepared");

            // Fetch vacant berths
            const vacantBerths = await chartService.fetchVacantBerth(

                journey.trainNumber,

                journey.journeyDate.toISOString().split("T")[0],

                journey.boardingStation,

                enabledClass.class,

                2

            );

            console.log("✅ Vacant Berths Received");

            // Run Journey Optimizer
            const recommendations = await journeyOptimizer.optimize({

                journey,

                route: {

                    stations: chart.cdd

                },

                chart,

                vacancies: vacantBerths.vbd || []

            });

            console.log("✅ Journey Optimizer Completed");

            return recommendations;

        } catch (error) {

            console.log("========================================");
            console.log("❌ CHART WORKFLOW FAILED");
            console.log("========================================");

            console.log(error.message);

            throw error;

        }

    }

}

module.exports = new ChartWorkflowService();