const fs = require("fs");
const path = require("path");

const ntesParser = require("./services/ntesParser");

const htmlPath = path.join(
  __dirname,
  "../!DOCTYPE HTML.txt"
);

try {
  console.log("\n========================================");
  console.log("       ERJA - NTES PARSER TEST");
  console.log("========================================\n");

  if (!fs.existsSync(htmlPath)) {
    throw new Error(
      `NTES HTML file not found:\n${htmlPath}`
    );
  }

  const html = fs.readFileSync(htmlPath, "utf8");

  console.log("HTML file loaded successfully");
  console.log("HTML size:", html.length, "characters");

  const result = ntesParser.parse(html, {
  journeyDate: "16-Sep-2026",
});

  console.log("\n========================================");
  console.log("TRAIN INFORMATION");
  console.log("========================================");

  console.log(JSON.stringify(result.train, null, 2));

  console.log("\n========================================");
  console.log("LIVE RUNNING STATUS");
  console.log("========================================");

  console.log(JSON.stringify(result.status, null, 2));

  console.log("\n========================================");
  console.log("STOP SUMMARY");
  console.log("========================================");

  console.log("Total stops:", result.stops.length);

  if (result.stops.length > 0) {
    console.log("\nFirst stop:");
    console.log(
      JSON.stringify(result.stops[0], null, 2)
    );

    console.log("\nLast stop:");
    console.log(
      JSON.stringify(
        result.stops[result.stops.length - 1],
        null,
        2
      )
    );
  }

  console.log("\n========================================");
  console.log("ALL PARSED STOPS");
  console.log("========================================\n");

  result.stops.forEach((stop) => {
    console.log(
      `${String(stop.routeOrder).padStart(3, " ")} | ` +
      `${String(stop.code || "-").padEnd(8, " ")} | ` +
      `${String(stop.name || "-").padEnd(30, " ")} | ` +
      `ARR: ${stop.actualArrival || stop.scheduledArrival || "-"} | ` +
      `DEP: ${stop.actualDeparture || stop.scheduledDeparture || "-"} | ` +
      `PF: ${stop.platform || "-"} | ` +
      `KM: ${stop.distanceKm ?? "-"}`
    );
  });

  console.log("\n========================================");
  console.log("PARSER TEST COMPLETED");
  console.log("========================================\n");

} catch (error) {
  console.error("\n========================================");
  console.error("NTES PARSER TEST FAILED");
  console.error("========================================\n");

  console.error(error.message);

  if (error.stack) {
    console.error("\nStack:");
    console.error(error.stack);
  }

  process.exitCode = 1;
}