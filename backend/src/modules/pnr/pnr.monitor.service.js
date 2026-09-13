const PNR = require("./pnr.model");
const Journey = require("../journey/journey.model");
const { checkPNRService } = require("./pnr.service");


// =========================================================
// PNR MONITOR CONFIGURATION
// =========================================================

// Minimum time between RailKit checks for the same PNR.
const PNR_CHECK_INTERVAL_MINUTES = 15;

// Maximum PNRs checked in one monitoring cycle.
const MAX_PNRS_PER_CYCLE = 20;


// =========================================================
// GLOBAL STATE
// =========================================================

// Prevent two PNR monitoring cycles from running together.
let monitoringInProgress = false;

// Once RailKit reports quota exhaustion, stop making
// additional RailKit calls until the backend is restarted.
let railKitQuotaExceeded = false;


// =========================================================
// RAILKIT QUOTA DETECTION
// =========================================================

const isRailKitQuotaError = (error) => {

    const statusCode =
        Number(error?.statusCode || 0);

    const message =
        String(error?.message || "")
            .toLowerCase();

    return (
        statusCode === 429 ||
        message.includes("usage limit exceeded") ||
        message.includes("usage limit") ||
        message.includes("quota") ||
        message.includes("billing cycle") ||
        message.includes("rate limit")
    );
};


// =========================================================
// MONITOR PNRs
// =========================================================

const monitorPNRs = async () => {

    // -------------------------------------------------------
    // PREVENT OVERLAPPING MONITORING
    // -------------------------------------------------------

    if (monitoringInProgress) {

        console.log(
            "⏭ PNR monitoring already running. Skipping cycle."
        );

        return;
    }


    // -------------------------------------------------------
    // STOP AFTER RAILKIT QUOTA ERROR
    // -------------------------------------------------------

    if (railKitQuotaExceeded) {

        console.log(
            "⏭ PNR monitoring skipped because RailKit quota is exhausted."
        );

        return;
    }


    monitoringInProgress = true;


    try {

        console.log("\n========================================");
        console.log("🎫 PNR MONITORING STARTED");
        console.log("========================================");


        // ---------------------------------------------------
        // CALCULATE CHECK CUTOFF
        // ---------------------------------------------------

        const cutoff =
            new Date(
                Date.now() -
                PNR_CHECK_INTERVAL_MINUTES *
                60 *
                1000
            );


        // ---------------------------------------------------
        // ONLY MONITOR PNRs LINKED TO ERJA JOURNEYS
        // ---------------------------------------------------
        //
        // This prevents orphan/unlinked PNRs from consuming
        // RailKit quota forever.
        //

        const pnrs =
            await PNR.find({
                journeyId: {
                    $ne: null,
                },

                $or: [
                    {
                        lastCheckedAt: {
                            $lte: cutoff,
                        },
                    },
                    {
                        lastCheckedAt: null,
                    },
                ],
            })
                .sort({
                    lastCheckedAt: 1,
                })
                .limit(MAX_PNRS_PER_CYCLE)
                .lean();


        console.log(
            `🎫 PNRs eligible for checking: ${pnrs.length}`
        );


        // ---------------------------------------------------
        // NOTHING TO CHECK
        // ---------------------------------------------------

        if (!pnrs.length) {

            console.log(
                "✅ No PNR requires checking right now."
            );

            return;
        }


        // ---------------------------------------------------
        // PROCESS ONE PNR AT A TIME
        // ---------------------------------------------------

        for (const savedPNR of pnrs) {

            // -----------------------------------------------
            // STOP IMMEDIATELY AFTER QUOTA ERROR
            // -----------------------------------------------

            if (railKitQuotaExceeded) {

                console.log(
                    "⏭ Remaining PNR checks skipped because RailKit quota is exhausted."
                );

                break;
            }


            try {

                console.log(
                    `\n🎫 Checking PNR: ${savedPNR.pnr}`
                );


                // -------------------------------------------
                // VERIFY LINKED JOURNEY
                // -------------------------------------------

                const journey =
                    await Journey.findOne({
                        _id: savedPNR.journeyId,
                    })
                        .select(
                            "_id userId status trainNumber journeyDate"
                        )
                        .lean();


                // -------------------------------------------
                // JOURNEY NO LONGER EXISTS
                // -------------------------------------------

                if (!journey) {

                    console.log(
                        `⏭ PNR ${savedPNR.pnr}: linked journey no longer exists.`
                    );

                    continue;
                }


                // -------------------------------------------
                // COMPLETED / CANCELLED JOURNEY
                // -------------------------------------------

                if (
                    journey.status === "COMPLETED" ||
                    journey.status === "CANCELLED"
                ) {

                    console.log(
                        `⏭ PNR ${savedPNR.pnr}: journey is ${journey.status}.`
                    );

                    continue;
                }


                // -------------------------------------------
                // CHECK PNR THROUGH RAILKIT
                // -------------------------------------------

                await checkPNRService(
                    savedPNR.pnr,
                    savedPNR.userId,
                    savedPNR.journeyId
                );


                console.log(
                    `✅ PNR ${savedPNR.pnr} checked successfully.`
                );


            } catch (error) {

                // -------------------------------------------
                // RAILKIT QUOTA
                // -------------------------------------------

                if (
                    isRailKitQuotaError(error)
                ) {

                    console.error(
                        "🚨 RAILKIT QUOTA EXCEEDED"
                    );

                    console.error(
                        "⏭ Stopping all remaining PNR checks."
                    );

                    railKitQuotaExceeded =
                        true;

                    break;
                }


                // -------------------------------------------
                // INDIVIDUAL PNR FAILURE
                // -------------------------------------------

                console.error(
                    `❌ PNR ${savedPNR.pnr} monitoring failed:`,
                    error.message
                );
            }
        }


    } catch (error) {

        console.error(
            "❌ PNR MONITORING CYCLE ERROR:",
            error.message
        );


    } finally {

        monitoringInProgress = false;

        console.log("\n========================================");
        console.log("✅ PNR MONITORING COMPLETED");
        console.log("========================================");
    }
};


// =========================================================
// RESET QUOTA LOCK
// =========================================================
//
// Normally this should NOT be called automatically.
// RailKit's billing-cycle limit cannot safely be inferred
// by ERJA.
//

const resetRailKitQuotaState = () => {

    railKitQuotaExceeded = false;

    console.log(
        "🔄 RailKit quota protection state reset."
    );
};


// =========================================================
// EXPORT
// =========================================================

module.exports = {
    monitorPNRs,
    resetRailKitQuotaState,
};