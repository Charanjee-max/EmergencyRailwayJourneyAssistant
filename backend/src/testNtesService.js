require("dotenv").config();

const mongoose = require("mongoose");

const connectDB =
  require("./config/database");

const ntesService =
  require("./modules/train/ntes.service");


// ============================================================
// ERJA - NTES SERVICE + MONGODB SYNC TEST
// ============================================================

async function main() {

  try {

    console.log("\n========================================");
    console.log("       ERJA - NTES SERVICE TEST");
    console.log("========================================\n");


    // ========================================================
    // CONFIGURATION
    // ========================================================

    const trainNumber =
      "18189";

    const journeyDate =
      "16-Sep-2026";


    // ========================================================
    // CONNECT TO MONGODB
    // ========================================================

    console.log(
      "Connecting to MongoDB..."
    );

    await connectDB();

    console.log(
      "✅ MongoDB connection ready."
    );


    // ========================================================
    // START NTES SYNC
    // ========================================================

    console.log(
      "\n========================================"
    );

    console.log(
      "🚆 STARTING NTES → MONGODB SYNC"
    );

    console.log(
      "========================================\n"
    );

    console.log(
      "Train:",
      trainNumber
    );

    console.log(
      "Journey Date:",
      journeyDate
    );


    const result =
      await ntesService.syncNtesTrainStopsService(
        trainNumber,
        journeyDate
      );


    // ========================================================
    // TRAIN INFORMATION
    // ========================================================

    console.log(
      "\n========================================"
    );

    console.log(
      "TRAIN INFORMATION"
    );

    console.log(
      "========================================\n"
    );

    console.log(
      JSON.stringify(
        result.train,
        null,
        2
      )
    );


    // ========================================================
    // LIVE STATUS
    // ========================================================

    console.log(
      "\n========================================"
    );

    console.log(
      "LIVE RUNNING STATUS"
    );

    console.log(
      "========================================\n"
    );

    console.log(
      JSON.stringify(
        result.status,
        null,
        2
      )
    );


    // ========================================================
    // PARSER SUMMARY
    // ========================================================

    console.log(
      "\n========================================"
    );

    console.log(
      "PARSER SUMMARY"
    );

    console.log(
      "========================================\n"
    );

    console.log(
      JSON.stringify(
        result.summary,
        null,
        2
      )
    );


    // ========================================================
    // MONGODB SYNC RESULT
    // ========================================================

    console.log(
      "\n========================================"
    );

    console.log(
      "MONGODB SYNC RESULT"
    );

    console.log(
      "========================================\n"
    );


    console.log(
      "Stops parsed:",
      result.stops.length
    );


    if (
      result.mongoSync
    ) {

      console.log(
        "Matched:",
        result.mongoSync.matchedCount
      );

      console.log(
        "Modified:",
        result.mongoSync.modifiedCount
      );

      console.log(
        "Inserted:",
        result.mongoSync.upsertedCount
      );
    }


    // ========================================================
    // FIRST STOP
    // ========================================================

    if (
      result.stops.length > 0
    ) {

      console.log(
        "\n========================================"
      );

      console.log(
        "FIRST STOP"
      );

      console.log(
        "========================================\n"
      );

      console.log(
        JSON.stringify(
          result.stops[0],
          null,
          2
        )
      );
    }


    // ========================================================
    // LAST STOP
    // ========================================================

    if (
      result.stops.length > 0
    ) {

      console.log(
        "\n========================================"
      );

      console.log(
        "LAST STOP"
      );

      console.log(
        "========================================\n"
      );

      console.log(
        JSON.stringify(
          result.stops[
            result.stops.length - 1
          ],
          null,
          2
        )
      );
    }


    // ========================================================
    // ALL STOPS
    // ========================================================

    console.log(
      "\n========================================"
    );

    console.log(
      "ALL NTES STOPS"
    );

    console.log(
      "========================================\n"
    );


    result.stops.forEach(
      (stop) => {

        console.log(

          `${String(
            stop.routeOrder
          ).padStart(3, " ")} | ` +

          `${String(
            stop.code || "-"
          ).padEnd(7, " ")} | ` +

          `${String(
            stop.name || "-"
          ).padEnd(30, " ")} | ` +

          `ARR: ${
            stop.actualArrival ||
            stop.scheduledArrival ||
            "-"
          } | ` +

          `DEP: ${
            stop.actualDeparture ||
            stop.scheduledDeparture ||
            "-"
          } | ` +

          `PF: ${
            stop.platform ||
            "-"
          } | ` +

          `KM: ${
            stop.distanceKm ??
            "-"
          }`
        );
      }
    );


    // ========================================================
    // FINAL RESULT
    // ========================================================

    console.log(
      "\n========================================"
    );

    console.log(
      "✅ NTES → MONGODB SYNC COMPLETED"
    );

    console.log(
      "========================================\n"
    );


  } catch (error) {

    console.error(
      "\n========================================"
    );

    console.error(
      "❌ NTES SERVICE TEST FAILED"
    );

    console.error(
      "========================================\n"
    );

    console.error(
      error.message
    );

    if (
      error.stack
    ) {

      console.error(
        "\nStack:"
      );

      console.error(
        error.stack
      );
    }

    process.exitCode = 1;

  } finally {

    // ========================================================
    // CLOSE MONGODB CONNECTION
    // ========================================================

    if (
      mongoose.connection.readyState !== 0
    ) {

      console.log(
        "\nClosing MongoDB connection..."
      );

      await mongoose.connection.close();

      console.log(
        "✅ MongoDB connection closed."
      );
    }
  }
}


// ============================================================
// RUN TEST
// ============================================================

main();