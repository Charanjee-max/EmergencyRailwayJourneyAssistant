// =========================================================
// ERJA - JOURNEY MONITOR SERVICE
// =========================================================
//
// Responsibilities:
// 1. Find all active journeys
// 2. Check whether train has reached its final station
// 3. Complete the journey when train reaches final station
// 4. Run Workflow Manager
// 5. Workflow Manager handles:
//      - Chart timing
//      - IRCTC chart preparation
//      - IRCTC vacant berth data
//      - Journey optimization
//      - Recommendations
//
// IMPORTANT:
// RailRadar seat availability is NO LONGER USED here.
//
// RailRadar should only be used by the dedicated
// live-train-status functionality.
//
// =========================================================

const Journey = require("../modules/journey/journey.model");

const workflowManager =
    require("../workflows/workflowManager");

const {
    checkAndCompleteJourney,
} = require("../modules/journey/journey.service");


// =========================================================
// MONITOR ALL ACTIVE JOURNEYS
// =========================================================

const monitorPendingJourneys = async () => {

    try {

        console.log(
            "========================================"
        );

        console.log(
            "🚆 Journey Monitoring Started"
        );

        console.log(
            "========================================"
        );


        // =====================================================
        // FIND ACTIVE JOURNEYS
        // =====================================================
        //
        // Do not monitor:
        //
        // COMPLETED
        // CANCELLED
        //
        // Monitor:
        //
        // PENDING
        // MONITORING
        // CHART_PREPARED
        // RECOMMENDATION_READY
        //
        // =====================================================

        const journeys =
            await Journey.find({
                status: {
                    $nin: [
                        "COMPLETED",
                        "CANCELLED",
                    ],
                },
            }).sort({
                createdAt: 1,
            });


        console.log(
            `Active Journeys Found: ${journeys.length}`
        );


        // =====================================================
        // PROCESS EACH JOURNEY
        // =====================================================

        for (const journey of journeys) {

            try {

                console.log(
                    "----------------------------------------"
                );

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


                // =================================================
                // VALIDATE JOURNEY DATE
                // =================================================

                if (!journey.journeyDate) {

                    console.log(
                        "⚠ Journey date is missing."
                    );

                    continue;
                }


                // =================================================
                // JOURNEY COMPLETION CHECK
                // =================================================
                //
                // IMPORTANT:
                //
                // Completion is based on the TRAIN'S FINAL
                // STATION, not passenger destination.
                //
                // Example:
                //
                // Train route:
                // SC → BZA → VSKP
                //
                // Passenger:
                // SC → BZA
                //
                // Journey remains active until the TRAIN reaches
                // VSKP.
                //
                // =================================================

                try {

                    console.log(
                        "\n🏁 Checking train completion..."
                    );


                    const completion =
                        await checkAndCompleteJourney(
                            journey
                        );


                    // =================================================
                    // TRAIN HAS REACHED FINAL STATION
                    // =================================================

                    if (
                        completion?.completed
                    ) {

                        console.log(
                            "🏁 Train has reached its final station."
                        );


                        console.log(
                            `🏁 Final Station: ${
                                completion.finalStationCode ||
                                ""
                            } ${
                                completion.finalStationName ||
                                ""
                            }`
                        );


                        console.log(
                            "🗂 Journey moved to completed history."
                        );


                        // -----------------------------------------
                        // DO NOT RUN WORKFLOW
                        // -----------------------------------------
                        //
                        // The journey is finished.
                        //
                        // -----------------------------------------

                        continue;
                    }


                    // =================================================
                    // COMPLETION STATUS COULD NOT BE DETERMINED
                    // =================================================

                    if (
                        completion?.determined === false
                    ) {

                        console.log(
                            "⚠ Unable to determine journey completion status."
                        );


                        if (
                            completion?.message
                        ) {

                            console.log(
                                completion.message
                            );
                        }
                    }

                } catch (
                    completionError
                ) {

                    console.log(
                        "⚠ Journey completion check failed."
                    );

                    console.log(
                        completionError.message
                    );

                    // ---------------------------------------------
                    // IMPORTANT:
                    //
                    // Do NOT stop monitoring the journey just
                    // because completion check failed.
                    //
                    // Workflow Manager can still attempt to
                    // process the journey.
                    //
                    // ---------------------------------------------
                }


                // =================================================
                // WORKFLOW MANAGER
                // =================================================
                //
                // Workflow Manager is now the main processing
                // pipeline for active journeys.
                //
                // It handles:
                //
                // 1. Chart timing
                // 2. IRCTC chart preparation
                // 3. IRCTC vacant berth API
                // 4. Reservation graph
                // 5. Journey optimizer
                // 6. Recommendation generation
                //
                // =================================================

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

                } catch (
                    workflowError
                ) {

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


                    if (
                        workflowError.stack
                    ) {

                        console.log(
                            workflowError.stack
                        );
                    }


                    console.log(
                        "========================================"
                    );
                }


            } catch (
                journeyError
            ) {

                // =================================================
                // INDIVIDUAL JOURNEY ERROR
                // =================================================
                //
                // One journey failure must NOT stop other journeys.
                //
                // =================================================

                console.log(
                    "========================================"
                );

                console.log(
                    "❌ JOURNEY MONITORING FAILED"
                );

                console.log(
                    "========================================"
                );


                console.log(
                    `Journey ID: ${
                        journey?._id ||
                        "UNKNOWN"
                    }`
                );


                console.log(
                    journeyError.message
                );


                if (
                    journeyError.stack
                ) {

                    console.log(
                        journeyError.stack
                    );
                }


                console.log(
                    "========================================"
                );
            }
        }


        // =====================================================
        // MONITORING COMPLETED
        // =====================================================

        console.log(
            "========================================"
        );

        console.log(
            "✅ Journey Monitoring Completed"
        );

        console.log(
            "========================================"
        );


    } catch (
        error
    ) {

        // =====================================================
        // GLOBAL MONITORING ERROR
        // =====================================================

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


        if (
            error.stack
        ) {

            console.error(
                error.stack
            );
        }


        console.error(
            "========================================"
        );
    }
};


// =========================================================
// EXPORT
// =========================================================

module.exports = {
    monitorPendingJourneys,
};