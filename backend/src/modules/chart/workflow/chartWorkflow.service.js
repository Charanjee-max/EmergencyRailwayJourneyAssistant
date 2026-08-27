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

            // ==========================================
// Development Override
// ==========================================

if (
    process.env.NODE_ENV === "development" &&
    process.env.FORCE_CHART === "true"
) {

    console.log("🧪 DEVELOPMENT MODE");
    console.log("🚀 Forcing chart as prepared.");

    chart.chartPrepared = true;

}

// ==========================================
// Check Chart
// ==========================================

if (!chart.chartPrepared) {

    console.log("⏳ Chart not prepared yet.");

    return null;

}

console.log("✅ Chart Prepared");

            console.log("✅ Chart Prepared");

            // ==========================================
// Development Mode
// ==========================================

let chartData = chart;
let vacantBerths;

if (
    process.env.NODE_ENV === "development" &&
    process.env.FORCE_CHART === "true"
) {

    console.log("🧪 USING MOCK CHART DATA");

    chartData = {
        ...chart.toObject(),
        chartPrepared: true,
        cdd: mockChart.cdd
    };

    vacantBerths = mockVacancies;

} else {

    vacantBerths = await chartService.fetchVacantBerth(
        journey.trainNumber,
        journey.journeyDate.toISOString().split("T")[0],
        journey.boardingStation,
        enabledClass.class,
        2
    );

}

console.log("✅ Vacant Berths Received");

            // Run Journey Optimizer
            const recommendations = await journeyOptimizer.optimize({

                journey,

                route: {
    stations: chartData.cdd || []
},

chart: chartData,

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