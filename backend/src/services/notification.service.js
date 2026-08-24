const sendNotification = async (journey, previousStatus, currentStatus) => {
  console.log("");
  console.log("========================================");
  console.log("📢 NOTIFICATION");
  console.log("========================================");

  console.log(`Journey ID   : ${journey._id}`);
  console.log(`Train Number : ${journey.trainNumber}`);
  console.log(
    `Journey Date : ${journey.journeyDate.toISOString().split("T")[0]}`
  );
  console.log(
    `Route        : ${journey.boardingStation} → ${journey.destinationStation}`
  );

  console.log("----------------------------------------");

  console.log(`Previous : ${previousStatus}`);
  console.log(`Current  : ${currentStatus}`);

  console.log("----------------------------------------");

  console.log("📧 Email Notification (Coming Soon)");

  console.log("========================================");
  console.log("");
};

module.exports = {
  sendNotification,
};