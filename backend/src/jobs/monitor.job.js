const cron = require("node-cron");
const {
  monitorPendingJourneys,
} = require("../services/monitor.service");

// Run every 2 minutes
const startJourneyMonitoringJob = () => {
  console.log("========================================");
  console.log("🚆 Journey Monitoring Job Started");
  console.log("Runs every 2 minutes");
  console.log("========================================");

  cron.schedule("*/2 * * * *", async () => {
    console.log(
      "\n⏰ Running Journey Monitoring Job..."
    );

    await monitorPendingJourneys();
  });
};

module.exports = {
  startJourneyMonitoringJob,
};