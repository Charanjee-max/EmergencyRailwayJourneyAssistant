const PNR = require("./pnr.model");
const Journey = require("../journey/journey.model");
const { checkPNRService } = require("./pnr.service");


// =========================================================
// PNR MONITOR CONFIGURATION
// =========================================================

// Minimum time between ConfirmTkt checks for the same PNR.
const PNR_CHECK_INTERVAL_MINUTES = 15;

// Maximum PNRs checked in one monitoring cycle.
const MAX_PNRS_PER_CYCLE = 20;


// =========================================================
// GLOBAL STATE
// =========================================================

// Prevent two PNR monitoring cycles from running together.
let monitoringInProgress = false;

// Once ConfirmTkt reports quota exhaustion, stop making
// additional ConfirmTkt calls until the backend is restarted.
let confirmTktQuotaExceeded = false;


// =========================================================
// CONFIRMTKT QUOTA DETECTION
// =========================================================

const isConfirmTktQuotaError = (error) => {

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
    // STOP AFTER CONFIRMTKT QUOTA ERROR
    // -------------------------------------------------------

    if (confirmTktQuotaExceeded) {

        console.log(
            "⏭ PNR monitoring skipped because ConfirmTkt quota is exhausted."
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
        // ConfirmTkt quota forever.
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

            if (confirmTktQuotaExceeded) {

                console.log(
                    "⏭ Remaining PNR checks skipped because ConfirmTkt quota is exhausted."
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
                // CHECK PNR THROUGH CONFIRMTKT
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
                // CONFIRMTKT QUOTA
                // -------------------------------------------

                if (
                    isConfirmTktQuotaError(error)
                ) {

                    console.error(
                        "🚨 CONFIRMTKT QUOTA EXCEEDED"
                    );

                    console.error(
                        "⏭ Stopping all remaining PNR checks."
                    );

                    confirmTktQuotaExceeded =
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
// ConfirmTkt's billing-cycle limit cannot safely be inferred
// by ERJA.
//

const resetConfirmTktQuotaState = () => {

    confirmTktQuotaExceeded = false;

    console.log(
        "🔄 ConfirmTkt quota protection state reset."
    );
};


// =========================================================
// EXPORT
// =========================================================

module.exports = {
    monitorPNRs,
    resetConfirmTktQuotaState,
};