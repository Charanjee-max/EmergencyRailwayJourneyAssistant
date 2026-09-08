let railKitQuotaExceeded = false;

const monitorPNRs = async () => {
  console.log("\n========================================");
  console.log("🎫 PNR MONITORING STARTED");
  console.log("========================================");

  const pnrs = await PNR.find({})
    .sort({ updatedAt: -1 });

  console.log("PNRs found:", pnrs.length);

  for (const savedPNR of pnrs) {

    // -----------------------------------------
    // STOP THIS CYCLE AFTER RAILKIT QUOTA ERROR
    // -----------------------------------------
    if (railKitQuotaExceeded) {
      console.log(
        `⏭ Skipping PNR ${savedPNR.pnr} because RailKit quota is exhausted.`
      );
      continue;
    }

    try {
      console.log(
        `\n🎫 Checking PNR: ${savedPNR.pnr}`
      );

      const updatedPNR =
        await checkPNRService(
          savedPNR.pnr,
          savedPNR.userId,
          savedPNR.journeyId || null
        );

      // Keep your existing comparison/history/
      // notification logic here.

    } catch (error) {

      const message =
        String(error.message || "").toLowerCase();

      const quotaExceeded =
        error.statusCode === 429 ||
        message.includes("usage limit exceeded") ||
        message.includes("quota") ||
        message.includes("billing cycle");

      if (quotaExceeded) {

        console.log(
          "🚨 RAILKIT QUOTA EXCEEDED"
        );

        console.log(
          "⏭ Stopping remaining PNR checks for this cycle."
        );

        railKitQuotaExceeded = true;

        continue;
      }

      console.error(
        `❌ PNR ${savedPNR.pnr} monitoring failed:`,
        error.message
      );
    }
  }

  console.log("\n========================================");
  console.log("✅ PNR MONITORING COMPLETED");
  console.log("========================================");
};

module.exports = {
  monitorPNRs,
};