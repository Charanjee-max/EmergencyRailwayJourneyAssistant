const {
  getTrainScheduleService,
} = require("./src/services/ntes.service");

async function test() {
  try {
    const result =
      await getTrainScheduleService(
        "12745",
        "06-Sep-2026"
      );

    console.log("\n================================");
    console.log("🚆 NTES SERVICE TEST");
    console.log("================================");

    console.log(
      "Train:",
      result.trainNumber
    );

    console.log(
      "Stops:",
      result.stops.length
    );

    console.log("\nRoute:");

    result.stops.forEach((stop) => {
      console.log(
        `${stop.no}. ${stop.code} - ${stop.station} - Day ${stop.day} - ${stop.arrival} / ${stop.departure}`
      );
    });

    console.log(
      "\n✅ NTES SERVICE WORKING"
    );
  } catch (error) {
    console.error(
      "\n❌ NTES SERVICE FAILED"
    );

    console.error(error.message);

    process.exitCode = 1;
  }
}

test();