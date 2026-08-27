const Journey = require("../modules/journey/journey.model");
const axios = require("axios");
const { sendNotification } = require("./notification.service");
const workflowManager = require("../workflows/workflowManager");

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

        // Find seat availability for the journey date
        const todayAvailability = response.data.data.calendar.find(
          (item) =>
            item.rawDate ===
            journey.journeyDate.toISOString().split("T")[0]
        );

        if (!todayAvailability) {
          console.log("⚠ Journey date not found in RailRadar response.");
          continue;
        }

        const currentStatus = todayAvailability.status;
        const currentSeats = todayAvailability.availableSeats;

        console.log(`Current Status : ${currentStatus}`);
        console.log(`Current Seats  : ${currentSeats}`);

        // First monitoring
        if (!journey.lastSeatStatus) {
          journey.lastSeatStatus = currentStatus;
          journey.lastAvailableSeats = currentSeats;
          journey.lastCheckedAt = new Date();

          await journey.save();

          console.log("📝 Initial seat status saved.");
        }

        // Status changed
        else if (
          journey.lastSeatStatus !== currentStatus ||
          journey.lastAvailableSeats !== currentSeats
        ) {
          const previousStatus = journey.lastSeatStatus;

          console.log("========================================");
          console.log("🎉 SEAT AVAILABILITY CHANGED");
          console.log("========================================");

          console.log(`Journey ID      : ${journey._id}`);
          console.log(`Train Number    : ${journey.trainNumber}`);
          console.log(
            `Journey Date    : ${
              journey.journeyDate.toISOString().split("T")[0]
            }`
          );
          console.log(`Source          : ${journey.boardingStation}`);
          console.log(`Destination     : ${journey.destinationStation}`);

          console.log("----------------------------------------");

          console.log(
            `Status Changed  : ${journey.lastSeatStatus} → ${currentStatus}`
          );

          console.log(
            `Seats Changed   : ${journey.lastAvailableSeats} → ${currentSeats}`
          );

          // Update MongoDB
          journey.lastSeatStatus = currentStatus;
          journey.lastAvailableSeats = currentSeats;
          journey.lastCheckedAt = new Date();

          await journey.save();

          console.log("✅ MongoDB Updated.");

          // Send notification
          await sendNotification(
            journey,
            previousStatus,
            currentStatus
          );

          console.log("========================================");
        }

        // No change
        else {
          journey.lastCheckedAt = new Date();

          await journey.save();

          console.log("ℹ No Change.");
        }
      } catch (apiError) {
        console.log("❌ RailRadar API Failed");

        if (apiError.response) {
          console.log(apiError.response.data);
        } else {
          console.log(apiError.message);
        }
      }

      // =========================================
      // Workflow Manager
      // =========================================

      try {
        await workflowManager.processJourney(journey);
      } catch (error) {
        console.log("========================================");
        console.log("❌ WORKFLOW MANAGER FAILED");
        console.log("========================================");
        console.log(error.message);
        console.log("========================================");
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