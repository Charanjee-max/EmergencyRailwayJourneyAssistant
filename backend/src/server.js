require("dotenv").config();

console.log("🚆 SERVER FILE LOADED");

const app = require("./app");
const connectDB = require("./config/database");
const { startJourneyMonitoringJob } = require("./jobs/monitor.job");
const { sendNotification } = require("./services/notification.service");

// Connect Database
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`
========================================
🚆 Emergency Railway Journey Assistant
========================================

Server running on:
http://localhost:${PORT}

Environment: ${process.env.NODE_ENV || "development"}

========================================
`);

  // Start Background Monitoring Job
  startJourneyMonitoringJob();

  // -------- TEMPORARY EMAIL TEST --------
  await sendNotification(
    {
      _id: "TEST123",
      trainNumber: "12746",
      journeyDate: new Date(),
      boardingStation: "BDCR",
      destinationStation: "SC",
    },
    "AVAILABLE-0151",
    "AVAILABLE-0120"
  );
});