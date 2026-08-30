const Journey = require("../modules/journey/journey.model");
const axios = require("axios");
const { sendNotification } = require("./notification.service");
const workflowManager = require("../workflows/workflowManager");

const RAILRADAR_TIMEOUT = 15000;

// =========================================
// Monitor all pending journeys
// =========================================

const monitorPendingJourneys = async () => {
  try {
    console.log("========================================");
    console.log("🚆 Journey Monitoring Started");
    console.log("========================================");

    // =========================================
    // Find pending journeys
    // =========================================

    const journeys = await Journey.find({
      status: "PENDING",
    });

    console.log(
      `Pending Journeys Found: ${journeys.length}`
    );

    // =========================================
    // Process each journey
    // =========================================

    for (const journey of journeys) {
      console.log("----------------------------------------");
      console.log(`Journey ID: ${journey._id}`);
      console.log(`Train Number: ${journey.trainNumber}`);
      console.log(`Journey Date: ${journey.journeyDate}`);
      console.log(`Source: ${journey.boardingStation}`);
      console.log(`Destination: ${journey.destinationStation}`);

      // =========================================
      // Validate journey date
      // =========================================

      if (!journey.journeyDate) {
        console.log("⚠ Journey date is missing.");
        continue;
      }

      const journeyDate = journey.journeyDate
        .toISOString()
        .split("T")[0];

      // =========================================
      // Get first enabled class
      // =========================================

      const enabledClass = journey.allowedClasses?.find(
        (item) => item.enabled
      );

      if (!enabledClass) {
        console.log("⚠ No enabled class found.");
        continue;
      }

      console.log(
        `Preferred Class: ${enabledClass.class}`
      );

      // =========================================
      // RailRadar Seat Availability
      // =========================================

      try {
        console.log("========================================");
        console.log("🚆 Calling RailRadar Seat API");
        console.log("========================================");

        console.log({
          trainNumber: journey.trainNumber,
          journeyDate,
          source: journey.boardingStation,
          destination: journey.destinationStation,
          classCode: enabledClass.class,
          quotaCode: "GN",
        });

        const response = await axios.get(
          `${process.env.RAILRADAR_BASE_URL}/trains/${journey.trainNumber}/seats`,
          {
            headers: {
              Authorization: `Bearer ${process.env.RAILRADAR_API_KEY}`,
            },

            params: {
              journeyDate,
              source: journey.boardingStation,
              destination: journey.destinationStation,
              classCode: enabledClass.class,
              quotaCode: "GN",
            },

            timeout: RAILRADAR_TIMEOUT,
          }
        );

        console.log("✅ Seat Availability Received");

        // =========================================
        // Validate RailRadar response
        // =========================================

        const calendar =
          response?.data?.data?.calendar;

        if (!Array.isArray(calendar)) {
          console.log(
            "⚠ RailRadar response does not contain a valid calendar."
          );

          continue;
        }

        // =========================================
        // Find availability for journey date
        // =========================================

        const todayAvailability = calendar.find(
          (item) =>
            item.rawDate === journeyDate
        );

        if (!todayAvailability) {
          console.log(
            "⚠ Journey date not found in RailRadar response."
          );

          continue;
        }

        // =========================================
        // Current availability
        // =========================================

        const currentStatus =
          todayAvailability.status ?? null;

        const currentSeats =
          todayAvailability.availableSeats ?? null;

        console.log(
          `Current Status : ${currentStatus}`
        );

        console.log(
          `Current Seats  : ${currentSeats}`
        );

        // =========================================
        // First monitoring
        // =========================================

        if (!journey.lastSeatStatus) {
          journey.lastSeatStatus =
            currentStatus;

          journey.lastAvailableSeats =
            currentSeats;

          journey.lastCheckedAt =
            new Date();

          await journey.save();

          console.log(
            "📝 Initial seat status saved."
          );
        }

        // =========================================
        // Status / seat count changed
        // =========================================

        else if (
          journey.lastSeatStatus !==
            currentStatus ||
          journey.lastAvailableSeats !==
            currentSeats
        ) {
          const previousStatus =
            journey.lastSeatStatus;

          const previousSeats =
            journey.lastAvailableSeats;

          console.log(
            "========================================"
          );

          console.log(
            "🎉 SEAT AVAILABILITY CHANGED"
          );

          console.log(
            "========================================"
          );

          console.log(
            `Journey ID      : ${journey._id}`
          );

          console.log(
            `Train Number    : ${journey.trainNumber}`
          );

          console.log(
            `Journey Date    : ${journeyDate}`
          );

          console.log(
            `Source          : ${journey.boardingStation}`
          );

          console.log(
            `Destination     : ${journey.destinationStation}`
          );

          console.log(
            "----------------------------------------"
          );

          console.log(
            `Status Changed  : ${previousStatus} → ${currentStatus}`
          );

          console.log(
            `Seats Changed   : ${previousSeats} → ${currentSeats}`
          );

          // =========================================
          // Update MongoDB
          // =========================================

          journey.lastSeatStatus =
            currentStatus;

          journey.lastAvailableSeats =
            currentSeats;

          journey.lastCheckedAt =
            new Date();

          await journey.save();

          console.log(
            "✅ MongoDB Updated."
          );

          // =========================================
          // Send notification
          // =========================================

          try {
            await sendNotification(
              journey,
              previousStatus,
              currentStatus
            );

            console.log(
              "🔔 Notification Sent."
            );
          } catch (notificationError) {
            console.log(
              "⚠ Notification Failed."
            );

            console.log(
              notificationError.message
            );
          }

          console.log(
            "========================================"
          );
        }

        // =========================================
        // No change
        // =========================================

        else {
          journey.lastCheckedAt =
            new Date();

          await journey.save();

          console.log(
            "ℹ No Change."
          );
        }
      } catch (apiError) {
        // =========================================
        // RailRadar API Error
        // =========================================

        console.log(
          "========================================"
        );

        console.log(
          "❌ RailRadar API Failed"
        );

        console.log(
          "========================================"
        );

        // -----------------------------------------
        // Rate limit / quota exceeded
        // -----------------------------------------

        if (
          apiError.response?.status === 429 ||
          apiError.response?.data?.error?.code ===
            "TOO_MANY_REQUESTS"
        ) {
          console.log(
            "🚨 RailRadar rate limit / monthly quota reached."
          );

          console.log(
            "⏭ Skipping RailRadar check for this journey."
          );

          if (apiError.response?.data) {
            console.dir(
              apiError.response.data,
              { depth: null }
            );
          }
        }

        // -----------------------------------------
        // Timeout
        // -----------------------------------------

        else if (
          apiError.code === "ECONNABORTED" ||
          apiError.code === "ETIMEDOUT"
        ) {
          console.log(
            "⏱ RailRadar request timed out."
          );

          console.log(
            "⏭ Skipping this journey for this cycle."
          );
        }

        // -----------------------------------------
        // Other HTTP errors
        // -----------------------------------------

        else if (apiError.response) {
          console.log(
            `HTTP Status: ${apiError.response.status}`
          );

          console.log(
            "RailRadar Response:"
          );

          console.dir(
            apiError.response.data,
            { depth: null }
          );
        }

        // -----------------------------------------
        // Network / unknown errors
        // -----------------------------------------

        else {
          console.log(
            "Message:",
            apiError.message
          );

          if (apiError.code) {
            console.log(
              "Code:",
              apiError.code
            );
          }
        }

        console.log(
          "========================================"
        );
      }

      // =========================================
      // Workflow Manager
      // =========================================
      //
      // IMPORTANT:
      // Keep this outside the RailRadar try/catch.
      //
      // In development with FORCE_CHART=true,
      // the workflow can use the mock chart data
      // even when RailRadar quota is exhausted.
      // =========================================

      try {
        console.log(
          "========================================"
        );

        console.log(
          "🚆 Running Workflow Manager"
        );

        console.log(
          "========================================"
        );

        await workflowManager.processJourney(
          journey
        );

        console.log(
          "✅ Workflow Manager Completed"
        );
      } catch (workflowError) {
        console.log(
          "========================================"
        );

        console.log(
          "❌ WORKFLOW MANAGER FAILED"
        );

        console.log(
          "========================================"
        );

        console.log(
          workflowError.message
        );

        console.log(
          "========================================"
        );
      }
    }

    // =========================================
    // Monitoring completed
    // =========================================

    console.log(
      "========================================"
    );

    console.log(
      "✅ Journey Monitoring Completed"
    );

    console.log(
      "========================================"
    );
  } catch (error) {
    console.error(
      "========================================"
    );

    console.error(
      "❌ Journey Monitoring Failed"
    );

    console.error(
      "========================================"
    );

    console.error(
      error.message
    );
  }
};

module.exports = {
  monitorPendingJourneys,
};