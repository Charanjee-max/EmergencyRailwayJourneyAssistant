const cron = require("node-cron");

const {
    monitorPendingJourneys,
} = require("../services/monitor.service");

const {
    monitorPNRs,
} = require("../modules/pnr/pnr.monitor.service");


// =========================================================
// JOURNEY MONITORING JOB
// =========================================================

const startJourneyMonitoringJob = () => {

    console.log("========================================");
    console.log("🚆 Journey Monitoring Job Started");
    console.log("Runs every 2 minutes");
    console.log("========================================");


    cron.schedule(
        "*/2 * * * *",
        async () => {

            console.log(
                "\n⏰ Running Journey Monitoring Job..."
            );


            try {

                await monitorPendingJourneys();

            } catch (error) {

                console.error(
                    "❌ Journey monitoring job failed:",
                    error.message
                );
            }
        }
    );


    // =====================================================
    // PNR MONITORING JOB
    // =====================================================

    console.log("========================================");
    console.log("🎫 PNR Monitoring Job Started");
    console.log("Runs every 15 minutes");
    console.log("========================================");


    cron.schedule(
        "*/15 * * * *",
        async () => {

            console.log(
                "\n⏰ Running PNR Monitoring Job..."
            );


            try {

                await monitorPNRs();

            } catch (error) {

                console.error(
                    "❌ PNR monitoring job failed:",
                    error.message
                );
            }
        }
    );
};


// =========================================================
// EXPORT
// =========================================================

module.exports = {
    startJourneyMonitoringJob,
};