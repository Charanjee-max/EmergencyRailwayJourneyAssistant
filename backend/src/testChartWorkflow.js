require("dotenv").config();

const mongoose = require("mongoose");

const Journey = require("./modules/journey/journey.model");
const workflowManager = require("./workflows/workflowManager");

async function testChartWorkflow() {

    try {

        console.log("\n========================================");
        console.log("🧪 MANUAL CHART WORKFLOW TEST");
        console.log("========================================");


        // =====================================================
        // MONGODB
        // =====================================================

        await mongoose.connect(
            process.env.MONGODB_URI
        );

        console.log(
            "✅ MongoDB Connected"
        );


        // =====================================================
        // TEST JOURNEY
        // =====================================================

        const TRAIN_NUMBER = "12764";
        const BOARDING_STATION = "SC";
        const DESTINATION_STATION = "BZA";

        // Today: 31 August 2026
        const JOURNEY_START =
            new Date("2026-08-31T00:00:00.000Z");

        const JOURNEY_END =
            new Date("2026-09-01T00:00:00.000Z");


        console.log(
            "\n🔎 Searching for test journey..."
        );

        console.log(
            "Train:",
            TRAIN_NUMBER
        );

        console.log(
            "Source:",
            BOARDING_STATION
        );

        console.log(
            "Destination:",
            DESTINATION_STATION
        );

        console.log(
            "Date:",
            "2026-08-31"
        );


        // =====================================================
        // FIND JOURNEY
        // =====================================================

        const journey =
            await Journey.findOne({

                trainNumber:
                    TRAIN_NUMBER,

                boardingStation:
                    BOARDING_STATION,

                destinationStation:
                    DESTINATION_STATION,

                journeyDate: {
                    $gte:
                        JOURNEY_START,

                    $lt:
                        JOURNEY_END,
                },

            }).sort({

                createdAt: -1,

            });


        // =====================================================
        // JOURNEY NOT FOUND
        // =====================================================

        if (!journey) {

            console.log(
                "\n❌ TEST JOURNEY NOT FOUND"
            );

            console.log(
                "\nCreate this journey first:"
            );

            console.log(
                "Train: 12764"
            );

            console.log(
                "Source: SC"
            );

            console.log(
                "Destination: BZA"
            );

            console.log(
                "Date: 2026-08-31"
            );

            return;
        }


        // =====================================================
        // JOURNEY FOUND
        // =====================================================

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
            "Preferred Classes:",
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