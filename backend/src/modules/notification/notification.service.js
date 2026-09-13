const transporter =
    require("../../config/mail");


// =========================================================
// EMAIL NOTIFICATION
// =========================================================

const sendNotification = async (
    journey,
    previousStatus,
    currentStatus
) => {

    try {

        // -------------------------------------------------
        // BASIC VALIDATION
        // -------------------------------------------------

        if (!journey) {

            throw new Error(
                "Journey information is required."
            );
        }


        const recipient =
            process.env.MAIL_USER;


        if (
            !recipient ||
            typeof recipient !== "string"
        ) {

            throw new Error(
                "MAIL_USER is not configured."
            );
        }


        // -------------------------------------------------
        // SANITIZE VALUES
        // -------------------------------------------------

        const trainNumber =
            String(
                journey.trainNumber || ""
            )
                .trim()
                .slice(0, 10);


        const boardingStation =
            String(
                journey.boardingStation || ""
            )
                .trim()
                .slice(0, 20);


        const destinationStation =
            String(
                journey.destinationStation || ""
            )
                .trim()
                .slice(0, 20);


        const safePreviousStatus =
            String(
                previousStatus || "UNKNOWN"
            )
                .trim()
                .slice(0, 100);


        const safeCurrentStatus =
            String(
                currentStatus || "UNKNOWN"
            )
                .trim()
                .slice(0, 100);


        let journeyDate = "";


        if (journey.journeyDate) {

            const date =
                new Date(
                    journey.journeyDate
                );


            if (!Number.isNaN(date.getTime())) {

                journeyDate =
                    date.toISOString()
                        .split("T")[0];
            }
        }


        // -------------------------------------------------
        // EMAIL
        // -------------------------------------------------

        const mailOptions = {

            from: recipient,

            to: recipient,

            subject:
                "ERJA - Journey Update",

            text: `
Emergency Railway Journey Assistant

Train Number: ${trainNumber}

Journey Date: ${journeyDate}

Route:
${boardingStation} → ${destinationStation}

Previous Status:
${safePreviousStatus}

Current Status:
${safeCurrentStatus}

This email was generated automatically by ERJA.
            `.trim(),

            html: `
                <h2>
                    Emergency Railway Journey Assistant
                </h2>

                <p>
                    <strong>Train Number:</strong>
                    ${trainNumber}
                </p>

                <p>
                    <strong>Journey Date:</strong>
                    ${journeyDate}
                </p>

                <p>
                    <strong>Route:</strong>
                    ${boardingStation}
                    →
                    ${destinationStation}
                </p>

                <hr>

                <p>
                    <strong>Previous Status:</strong>
                    ${safePreviousStatus}
                </p>

                <p>
                    <strong>Current Status:</strong>
                    ${safeCurrentStatus}
                </p>

                <hr>

                <p>
                    This email was generated automatically by ERJA.
                </p>
            `,
        };


        await transporter.sendMail(
            mailOptions
        );


        console.log(
            "📧 ERJA notification email sent."
        );


    } catch (error) {

        console.error(
            "❌ ERJA email notification failed:",
            error.message
        );

        // Do NOT expose SMTP details.
    }
};


module.exports = {
    sendNotification,
};