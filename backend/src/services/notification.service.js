const transporter = require("../config/mail");

const sendNotification = async (
  journey,
  previousStatus,
  currentStatus
) => {
  try {
    const mailOptions = {
      from: process.env.MAIL_USER,

      // Change this to the email where you want to receive notifications
      to: process.env.MAIL_USER,

      subject: "🚆 ERJA - Seat Availability Changed",

      html: `
        <h2>🚆 Emergency Railway Journey Assistant</h2>

        <p><strong>Train Number:</strong> ${journey.trainNumber}</p>

        <p><strong>Journey Date:</strong> ${
          journey.journeyDate.toISOString().split("T")[0]
        }</p>

        <p><strong>Route:</strong> ${journey.boardingStation} → ${journey.destinationStation}</p>

        <hr>

        <p><strong>Previous Status:</strong> ${previousStatus}</p>

        <p><strong>Current Status:</strong> ${currentStatus}</p>

        <hr>

        <p>This email was generated automatically by ERJA.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log("========================================");
    console.log("📧 EMAIL SENT SUCCESSFULLY");
    console.log("========================================");
    console.log(`To : ${mailOptions.to}`);
    console.log("========================================");
  } catch (error) {
    console.log("========================================");
    console.log("❌ EMAIL SENDING FAILED");
    console.log("========================================");
    console.log(error.message);
    console.log("========================================");
  }
};

module.exports = {
  sendNotification,
};