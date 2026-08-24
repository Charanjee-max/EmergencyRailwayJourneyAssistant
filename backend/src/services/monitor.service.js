const Journey = require("../modules/journey/journey.model");
const axios = require("axios");

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

    for (const journey of journeys) {
      console.log("----------------------------------------");
      console.log(`Journey ID: ${journey._id}`);
      console.log(`Train Number: ${journey.trainNumber}`);
      console.log(`Journey Date: ${journey.journeyDate}`);
      console.log(`Source: ${journey.boardingStation}`);
      console.log(`Destination: ${journey.destinationStation}`);

      // Get first enabled class
      const enabledClass = journey.allowedClasses.find(
        (item) => item.enabled
      );

      if (!enabledClass) {
        console.log("⚠ No enabled class found.");
        continue;
      }

      try {
        const response = await axios.get(
          `${process.env.RAILRADAR_BASE_URL}/trains/${journey.trainNumber}/seats`,
          {
            headers: {
              Authorization: `Bearer ${process.env.RAILRADAR_API_KEY}`,
            },
            params: {
              journeyDate: journey.journeyDate
                .toISOString()
                .split("T")[0],
              source: journey.boardingStation,
              destination: journey.destinationStation,
              classCode: enabledClass.class,
              quotaCode: "GN",
            },
          }
        );

        console.log("✅ Seat Availability Received");

        console.log(
          JSON.stringify(response.data, null, 2)
        );
      } catch (apiError) {
        console.log("❌ RailRadar API Failed");

        if (apiError.response) {
          console.log(apiError.response.data);
        } else {
          console.log(apiError.message);
        }
      }
    }

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