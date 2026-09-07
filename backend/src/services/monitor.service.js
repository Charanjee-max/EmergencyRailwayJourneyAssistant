const Journey = require("../modules/journey/journey.model");
const workflowManager = require("../workflows/workflowManager");

// =========================================
// Monitor all pending journeys
// =========================================

const monitorPendingJourneys = async () => {
    try {
        console.log("========================================");
        console.log("🚆 Journey Monitoring Started");
        console.log("========================================");

        // =========================================
        // Find pending journeys
        // =========================================

        const journeys = await Journey.find({
            status: "PENDING",
        });

        console.log(
            `Pending Journeys Found: ${journeys.length}`
        );

        // =========================================
        // No journeys
        // =========================================

        if (!journeys.length) {
            console.log("ℹ No pending journeys.");
            console.log("========================================");

            return;
        }

        // =========================================
        // Process each journey
        // =========================================

        for (const journey of journeys) {

            console.log("----------------------------------------");

            console.log(
                `Journey ID: ${journey._id}`
            );

            console.log(
                `Train Number: ${journey.trainNumber}`
            );

            console.log(
                `Journey Date: ${journey.journeyDate}`
            );

            console.log(
                `Source: ${journey.boardingStation}`
            );

            console.log(
                `Destination: ${journey.destinationStation}`
            );

            // =========================================
            // Validate journey date
            // =========================================

            if (!journey.journeyDate) {

                console.log(
                    "⚠ Journey date is missing."
                );

                continue;
            }

            // =========================================
            // Validate train
            // =========================================

            if (!journey.trainNumber) {

                console.log(
                    "⚠ Train number is missing."
                );

                continue;
            }

            // =========================================
            // Validate source
            // =========================================

            if (!journey.boardingStation) {

                console.log(
                    "⚠ Boarding station is missing."
                );

                continue;
            }

            // =========================================
            // Validate destination
            // =========================================

            if (!journey.destinationStation) {

                console.log(
                    "⚠ Destination station is missing."
                );

                continue;
            }

            // =========================================
            // Workflow Manager
            // =========================================

            try {

                console.log(
                    "========================================"
                );

                console.log(
                    "🚆 Running Workflow Manager"
                );

                console.log(
                    "========================================"
                );

                await workflowManager.processJourney(
                    journey
                );

                console.log(
                    "✅ Workflow Manager Completed"
                );

            } catch (workflowError) {

                console.log(
                    "========================================"
                );

                console.log(
                    "❌ WORKFLOW MANAGER FAILED"
                );

                console.log(
                    "========================================"
                );

                console.log(
                    workflowError.message
                );

                if (workflowError.stack) {
                    console.log(
                        workflowError.stack
                    );
                }

                console.log(
                    "========================================"
                );
            }
        }

        // =========================================
        // Monitoring completed
        // =========================================

        console.log(
            "========================================"
        );

        console.log(
            "✅ Journey Monitoring Completed"
        );

        console.log(
            "========================================"
        );

    } catch (error) {

        console.error(
            "========================================"
        );

        console.error(
            "❌ Journey Monitoring Failed"
        );

        console.error(
            "========================================"
        );

        console.error(
            error.message
        );

        if (error.stack) {
            console.error(
                error.stack
            );
        }
    }
};

module.exports = {
    monitorPendingJourneys,
};