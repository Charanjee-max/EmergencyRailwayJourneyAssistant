const chartWorkflow = require("../modules/chart/workflow/chartWorkflow.service");

class WorkflowManager {

    async processJourney(journey) {

        console.log("\n========================================");
        console.log("🚆 WORKFLOW MANAGER");
        console.log("========================================");

        try {

            // Workflow 1
            await chartWorkflow.processJourney(journey);

            console.log("✅ Chart Workflow Completed");

        } catch (error) {

            console.log("❌ Chart Workflow Failed");
            console.log(error.message);

        }

    }

    async processJourneys(journeys = []) {

        for (const journey of journeys) {

            await this.processJourney(journey);

        }

    }

}

module.exports = new WorkflowManager();