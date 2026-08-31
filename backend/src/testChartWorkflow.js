require("dotenv").config();

const mongoose = require("mongoose");

const Journey = require("./modules/journey/journey.model");
const workflowManager = require("./workflows/workflowManager");

async function testChartWorkflow() {

    try {

        console.log("\n========================================");
        console.log("🧪 MANUAL CHART WORKFLOW TEST");
        console.log("========================================");

        await mongoose.connect(
            process.env.MONGODB_URI
        );

        console.log("✅ MongoDB Connected");

        // =====================================================
        // EXACT TEST JOURNEY
        // =====================================================

        const journey =
            await Journey.findOne({
                _id: "6a955657de494ea70daf6874"
            });

        if (!journey) {

            console.log(
                "\n❌ TEST JOURNEY NOT FOUND"
            );

            return;
        }

        console.log(
            "\n========================================"
        );

        console.log(
            "🚆 JOURNEY FOUND"
        );

        console.log(
            "========================================"
        );

        console.log(
            "ID:",
            journey._id.toString()
        );

        console.log(
            "Train:",
            journey.trainNumber
        );

        console.log(
            "Date:",
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

        console.log(
            "Allowed Classes:",
            journey.allowedClasses
        );

        console.log(
            "Allow Mixed Class:",
            journey.allowMixedClass
        );

        // =====================================================
        // START WORKFLOW
        // =====================================================

        console.log(
            "\n🚆 Starting Workflow Manager..."
        );

        await workflowManager.processJourney(
            journey
        );

        // =====================================================
        // COMPLETE
        // =====================================================

        console.log(
            "\n========================================"
        );

        console.log(
            "✅ TEST COMPLETED"
        );

        console.log(
            "========================================"
        );

    } catch (error) {

        console.error(
            "\n========================================"
        );

        console.error(
            "❌ TEST FAILED"
        );

        console.error(
            "========================================"
        );

        console.error(
            "Message:",
            error.message
        );

        console.error(
            error.stack
        );

    } finally {

        await mongoose.disconnect();

        console.log(
            "\nMongoDB disconnected."
        );
    }
}

testChartWorkflow();