const cron = require("node-cron");

const {
    monitorPendingJourneys,
} = require("../services/monitor.service");

const {
    monitorPNRs,
} = require("../modules/pnr/pnr.monitor.service");

const scheduledTasks = [];
const runningJobs = new Set();

const scheduleMonitoredJob = (
    name,
    schedule,
    jobFunction
) => {
    let isRunning = false;

    return cron.schedule(schedule, async () => {
        if (isRunning) {
            console.warn(
                `⚠️ Skipping ${name}; the previous run is still active.`
            );
            return;
        }

        isRunning = true;

        const runPromise = (async () => {
            try {
                console.log(`\n⏰ Running ${name}...`);
                await jobFunction();
            } catch (error) {
                console.error(
                    `❌ ${name} failed:`,
                    error.message
                );
            } finally {
                isRunning = false;
            }
        })();

        runningJobs.add(runPromise);

        try {
            await runPromise;
        } finally {
            runningJobs.delete(runPromise);
        }
    });
};

const startJourneyMonitoringJob = () => {
    if (scheduledTasks.length > 0) {
        return {
            stop() {
                scheduledTasks.forEach((task) => task.stop());
            },
            async waitForRunningJobs() {
                await Promise.allSettled([...runningJobs]);
            },
        };
    }

    console.log("========================================");
    console.log("🚆 Journey Monitoring Job Started");
    console.log("Runs every 2 minutes");
    console.log("========================================");

    scheduledTasks.push(
        scheduleMonitoredJob(
            "Journey Monitoring Job",
            "*/2 * * * *",
            monitorPendingJourneys
        )
    );

    console.log("========================================");
    console.log("🎫 PNR Monitoring Job Started");
    console.log("Runs every 15 minutes");
    console.log("========================================");

    scheduledTasks.push(
        scheduleMonitoredJob(
            "PNR Monitoring Job",
            "*/15 * * * *",
            monitorPNRs
        )
    );

    return {
        stop() {
            scheduledTasks.forEach((task) => task.stop());
        },
        async waitForRunningJobs() {
            await Promise.allSettled([...runningJobs]);
        },
    };
};

module.exports = {
    startJourneyMonitoringJob,
};