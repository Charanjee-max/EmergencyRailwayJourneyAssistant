require("dotenv").config();

console.log("🚆 SERVER FILE LOADED");

const app = require("./app");
const connectDB = require("./config/database");
const { startJourneyMonitoringJob } = require("./jobs/monitor.job");

// =========================================================
// CONNECT DATABASE
// =========================================================

connectDB();


// =========================================================
// SERVER PORT
// =========================================================

const PORT = process.env.PORT || 5000;


// =========================================================
// START SERVER
// =========================================================

app.listen(PORT, () => {

  console.log(`
========================================
🚆 Emergency Railway Journey Assistant
========================================

Server running on:
http://localhost:${PORT}

Environment: ${process.env.NODE_ENV || "development"}

========================================
`);


  // =======================================================
  // START BACKGROUND MONITORING JOB
  // =======================================================

  startJourneyMonitoringJob();

});