const Journey = require("../modules/journey/journey.model");

// Monitor all pending journeys
const monitorPendingJourneys = async () => {
  try {
    console.log("========================================");
    console.log("🚆 Journey Monitoring Started");
    console.log("========================================");

    const journeys = await Journey.find({
      status: "PENDING",
    });

    console.log(`Pending Journeys Found: ${journeys.length}`);

    journeys.forEach((journey) => {
      console.log("----------------------------------------");
      console.log(`Journey ID: ${journey._id}`);
      console.log(`Train Number: ${journey.trainNumber}`);
      console.log(`Journey Date: ${journey.journeyDate}`);
      console.log(`Source: ${journey.boardingStation}`);
      console.log(`Destination: ${journey.destinationStation}`);
    });

    console.log("========================================");
    console.log("✅ Journey Monitoring Completed");
    console.log("========================================");
  } catch (error) {
    console.error("❌ Journey Monitoring Failed");
    console.error(error.message);
  }
};

module.exports = {
  monitorPendingJourneys,
};