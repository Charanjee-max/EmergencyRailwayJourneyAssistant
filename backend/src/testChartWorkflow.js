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

        console.log(
            "✅ MongoDB Connected"
        );


        const journey =
            await Journey.findOne({
                trainNumber: "12746",
                boardingStation: "BDCR",
                destinationStation: "SC",
                journeyDate: {
                    $gte: new Date("2026-09-06T00:00:00.000Z"),
                    $lt: new Date("2026-09-07T00:00:00.000Z")
                }
            }).sort({
                createdAt: -1
            });


        if (!journey) {

            console.log(
                "❌ 06/09/2026 journey not found."
            );

            return;
        }


        console.log(
            "\nJourney Found:"
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
            "\n🚆 Starting Workflow Manager..."
        );


        await workflowManager.processJourney(
            journey
        );


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
            "\n❌ TEST FAILED"
        );

        console.error(
            error.message
        );

        console.error(
            error.stack
        );

    } finally {

        await mongoose.disconnect();

        console.log(
            "MongoDB disconnected."
        );
    }
}


testChartWorkflow();