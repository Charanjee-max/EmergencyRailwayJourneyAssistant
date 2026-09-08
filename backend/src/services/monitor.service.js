const Journey = require("../modules/journey/journey.model");
const axios = require("axios");

const {
    sendNotification,
} = require("./notification.service");

const workflowManager =
    require("../workflows/workflowManager");

const {
    checkAndCompleteJourney,
} = require("../modules/journey/journey.service");

const RAILRADAR_TIMEOUT = 15000;

// =========================================================
// RAILRADAR QUOTA STATE
// =========================================================
//
// Once RailRadar returns monthly quota exceeded,
// ERJA stops calling the RailRadar seat API for the
// remainder of the current server session.
//
// The flag resets when Node.js server restarts.
// =========================================================

let railRadarQuotaExceeded = false;


// =========================================================
// CHECK RAILRADAR QUOTA STATE
// =========================================================

const isRailRadarQuotaExceeded = () => {
    return railRadarQuotaExceeded;
};


// =========================================================
// MARK RAILRADAR QUOTA AS EXCEEDED
// =========================================================

const markRailRadarQuotaExceeded = () => {

    if (!railRadarQuotaExceeded) {

        railRadarQuotaExceeded = true;

        console.log(
            "🚨 RailRadar monthly quota has been exhausted."
        );

        console.log(
            "🛑 RailRadar seat monitoring disabled for this server session."
        );
    }
};


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
                // =================================================

                try {

                    console.log(
                        "\n🏁 Checking train completion..."
                    );


                    const completion =
                        await checkAndCompleteJourney(
                            journey
                        );


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
                        // DO NOT RUN:
                        //
                        // RailRadar
                        // Workflow
                        //
                        // -----------------------------------------

                        continue;
                    }


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
                }


                // =================================================
                // JOURNEY DATE
                // =================================================

                const journeyDate =
                    journey.journeyDate
                        .toISOString()
                        .split("T")[0];


                // =================================================
                // GET FIRST ENABLED CLASS
                // =================================================

                const enabledClass =
                    journey.allowedClasses?.find(
                        (item) =>
                            item.enabled
                    );


                if (
                    !enabledClass
                ) {

                    console.log(
                        "⚠ No enabled class found."
                    );

                } else {

                    console.log(
                        `Preferred Class: ${enabledClass.class}`
                    );
                }


                // =================================================
                // RAILRADAR SEAT MONITORING
                // =================================================
                //
                // RailRadar is only used here for monitoring.
                //
                // ERJA reservation recommendation uses:
                //
                // IRCTC chart
                // IRCTC vacant berth data
                //
                // =================================================

                if (
                    railRadarQuotaExceeded
                ) {

                    console.log(
                        "⏭ RailRadar monitoring skipped."
                    );

                    console.log(
                        "Reason: monthly quota already exhausted."
                    );

                } else if (
                    !enabledClass
                ) {

                    console.log(
                        "⏭ RailRadar seat check skipped because no class is enabled."
                    );

                } else {

                    try {

                        console.log(
                            "========================================"
                        );

                        console.log(
                            "🚆 Calling RailRadar Seat API"
                        );

                        console.log(
                            "========================================"
                        );


                        console.log({
                            trainNumber:
                                journey.trainNumber,

                            journeyDate,

                            source:
                                journey.boardingStation,

                            destination:
                                journey.destinationStation,

                            classCode:
                                enabledClass.class,

                            quotaCode:
                                "GN",
                        });


                        // =============================================
                        // CALL RAILRADAR
                        // =============================================

                        const response =
                            await axios.get(
                                `${process.env.RAILRADAR_BASE_URL}/trains/${journey.trainNumber}/seats`,
                                {
                                    headers: {
                                        Authorization:
                                            `Bearer ${process.env.RAILRADAR_API_KEY}`,
                                    },

                                    params: {
                                        journeyDate,

                                        source:
                                            journey.boardingStation,

                                        destination:
                                            journey.destinationStation,

                                        classCode:
                                            enabledClass.class,

                                        quotaCode:
                                            "GN",
                                    },

                                    timeout:
                                        RAILRADAR_TIMEOUT,
                                }
                            );


                        console.log(
                            "✅ Seat Availability Received"
                        );


                        // =============================================
                        // VALIDATE RESPONSE
                        // =============================================

                        const calendar =
                            response?.data?.data?.calendar;


                        if (
                            !Array.isArray(calendar)
                        ) {

                            console.log(
                                "⚠ RailRadar response does not contain a valid calendar."
                            );

                            continue;
                        }


                        // =============================================
                        // FIND JOURNEY DATE
                        // =============================================

                        const todayAvailability =
                            calendar.find(
                                (item) =>
                                    item.rawDate ===
                                    journeyDate
                            );


                        if (
                            !todayAvailability
                        ) {

                            console.log(
                                "⚠ Journey date not found in RailRadar response."
                            );

                            continue;
                        }


                        // =============================================
                        // CURRENT AVAILABILITY
                        // =============================================

                        const currentStatus =
                            todayAvailability.status ??
                            null;


                        const currentSeats =
                            todayAvailability.availableSeats ??
                            null;


                        console.log(
                            `Current Status : ${currentStatus}`
                        );

                        console.log(
                            `Current Seats  : ${currentSeats}`
                        );


                        // =============================================
                        // FIRST MONITORING
                        // =============================================

                        if (
                            !journey.lastSeatStatus
                        ) {

                            journey.lastSeatStatus =
                                currentStatus;

                            journey.lastAvailableSeats =
                                currentSeats;

                            journey.lastCheckedAt =
                                new Date();


                            await journey.save();


                            console.log(
                                "📝 Initial seat status saved."
                            );
                        }


                        // =============================================
                        // STATUS / SEAT COUNT CHANGED
                        // =============================================

                        else if (

                            journey.lastSeatStatus !==
                                currentStatus ||

                            journey.lastAvailableSeats !==
                                currentSeats

                        ) {

                            const previousStatus =
                                journey.lastSeatStatus;


                            const previousSeats =
                                journey.lastAvailableSeats;


                            console.log(
                                "========================================"
                            );

                            console.log(
                                "🎉 SEAT AVAILABILITY CHANGED"
                            );

                            console.log(
                                "========================================"
                            );


                            console.log(
                                `Journey ID      : ${journey._id}`
                            );

                            console.log(
                                `Train Number    : ${journey.trainNumber}`
                            );

                            console.log(
                                `Journey Date    : ${journeyDate}`
                            );

                            console.log(
                                `Source          : ${journey.boardingStation}`
                            );

                            console.log(
                                `Destination     : ${journey.destinationStation}`
                            );


                            console.log(
                                "----------------------------------------"
                            );


                            console.log(
                                `Status Changed  : ${previousStatus} → ${currentStatus}`
                            );

                            console.log(
                                `Seats Changed   : ${previousSeats} → ${currentSeats}`
                            );


                            // =========================================
                            // UPDATE DATABASE
                            // =========================================

                            journey.lastSeatStatus =
                                currentStatus;

                            journey.lastAvailableSeats =
                                currentSeats;

                            journey.lastCheckedAt =
                                new Date();


                            await journey.save();


                            console.log(
                                "✅ MongoDB Updated."
                            );


                            // =========================================
                            // SEND NOTIFICATION
                            // =========================================

                            try {

                                await sendNotification(
                                    journey,
                                    previousStatus,
                                    currentStatus
                                );


                                console.log(
                                    "🔔 Notification Sent."
                                );

                            } catch (
                                notificationError
                            ) {

                                console.log(
                                    "⚠ Notification Failed."
                                );


                                console.log(
                                    notificationError.message
                                );
                            }


                            console.log(
                                "========================================"
                            );
                        }


                        // =============================================
                        // NO CHANGE
                        // =============================================

                        else {

                            journey.lastCheckedAt =
                                new Date();


                            await journey.save();


                            console.log(
                                "ℹ No Change."
                            );
                        }

                    } catch (
                        apiError
                    ) {

                        console.log(
                            "========================================"
                        );

                        console.log(
                            "❌ RailRadar API Failed"
                        );

                        console.log(
                            "========================================"
                        );


                        // =============================================
                        // RATE LIMIT / MONTHLY QUOTA
                        // =============================================

                        const quotaExceeded =
                            apiError.response?.status ===
                                429 ||

                            apiError.response?.data?.error?.code ===
                                "TOO_MANY_REQUESTS";


                        if (
                            quotaExceeded
                        ) {

                            console.log(
                                "🚨 RailRadar rate limit / monthly quota reached."
                            );


                            console.log(
                                "🛑 Disabling RailRadar calls for the rest of this server session."
                            );


                            markRailRadarQuotaExceeded();


                            if (
                                apiError.response?.data
                            ) {

                                console.dir(
                                    apiError.response.data,
                                    {
                                        depth: null,
                                    }
                                );
                            }

                        }

                        // =============================================
                        // TIMEOUT
                        // =============================================

                        else if (

                            apiError.code ===
                                "ECONNABORTED" ||

                            apiError.code ===
                                "ETIMEDOUT"

                        ) {

                            console.log(
                                "⏱ RailRadar request timed out."
                            );


                            console.log(
                                "⏭ Skipping this journey for this cycle."
                            );

                        }

                        // =============================================
                        // OTHER HTTP ERRORS
                        // =============================================

                        else if (
                            apiError.response
                        ) {

                            console.log(
                                `HTTP Status: ${apiError.response.status}`
                            );


                            console.log(
                                "RailRadar Response:"
                            );


                            console.dir(
                                apiError.response.data,
                                {
                                    depth: null,
                                }
                            );

                        }

                        // =============================================
                        // NETWORK / UNKNOWN ERROR
                        // =============================================

                        else {

                            console.log(
                                "Message:",
                                apiError.message
                            );


                            if (
                                apiError.code
                            ) {

                                console.log(
                                    "Code:",
                                    apiError.code
                                );
                            }
                        }


                        console.log(
                            "========================================"
                        );
                    }
                }


                // =================================================
                // WORKFLOW MANAGER
                // =================================================
                //
                // IMPORTANT:
                //
                // This is intentionally outside the RailRadar
                // try/catch.
                //
                // Therefore RailRadar quota exhaustion does NOT
                // stop the IRCTC workflow.
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
                // One journey failure must not stop other journeys.
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
    isRailRadarQuotaExceeded,
};