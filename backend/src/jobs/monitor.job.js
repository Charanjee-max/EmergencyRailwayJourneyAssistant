const cron = require("node-cron");
const {
  monitorPendingJourneys,
} = require("../services/monitor.service");

// Run every 30 minutes
const startJourneyMonitoringJob = () => {
  console.log("========================================");
  console.log("🚆 Journey Monitoring Job Started");
  console.log("Runs every 30 minutes");
  console.log("========================================");

  cron.schedule("*/30 * * * *", async () => {
    console.log(
      "\n⏰ Running Journey Monitoring Job..."
    );

    await monitorPendingJourneys();
  });
};

module.exports = {
  startJourneyMonitoringJob,
};