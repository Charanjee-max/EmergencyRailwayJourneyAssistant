const transporter =
    require("../../config/mail");

const Notification =
    require("./notification.model");


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


// =========================================================
// CREATE IN-APP NOTIFICATION
// =========================================================

const createNotification = async ({
    userId,
    type = "SYSTEM",
    title,
    message,
    journeyId = null,
}) => {

    if (!userId) {

        throw new Error(
            "User ID is required."
        );
    }


    if (
        !title ||
        typeof title !== "string"
    ) {

        throw new Error(
            "Notification title is required."
        );
    }


    if (
        !message ||
        typeof message !== "string"
    ) {

        throw new Error(
            "Notification message is required."
        );
    }


    const notification =
        await Notification.create({

            userId,

            type,

            title:
                title.trim(),

            message:
                message.trim(),

            journeyId,

            isRead: false,
        });


    return notification;
};


// =========================================================
// GET NOTIFICATIONS
// =========================================================

const getNotifications = async (
    userId,
    query = {}
) => {

    if (!userId) {

        throw new Error(
            "User ID is required."
        );
    }


    const requestedLimit =
        Number.parseInt(
            query.limit,
            10
        );


    const limit =
        Number.isFinite(requestedLimit)
            ? Math.min(
                Math.max(
                    requestedLimit,
                    1
                ),
                100
            )
            : 50;


    const [
        notifications,
        unreadCount,
    ] =
        await Promise.all([

            Notification.find({
                userId,
            })
                .sort({
                    createdAt: -1,
                })
                .limit(limit)
                .lean(),

            Notification.countDocuments({
                userId,
                isRead: false,
            }),

        ]);


    return {

        notifications,

        unreadCount,
    };
};


// =========================================================
// MARK NOTIFICATION AS READ
// =========================================================

const markAsRead = async (
    notificationId,
    userId
) => {

    if (!notificationId) {

        throw new Error(
            "Notification ID is required."
        );
    }


    if (!userId) {

        throw new Error(
            "User ID is required."
        );
    }


    const notification =
        await Notification.findOneAndUpdate(

            {
                _id:
                    notificationId,

                userId,
            },

            {
                $set: {
                    isRead: true,
                },
            },

            {
                new: true,
            }

        ).lean();


    if (!notification) {

        const error =
            new Error(
                "Notification not found."
            );

        error.statusCode = 404;

        throw error;
    }


    return notification;
};


// =========================================================
// MARK ALL NOTIFICATIONS AS READ
// =========================================================

const markAllAsRead = async (
    userId
) => {

    if (!userId) {

        throw new Error(
            "User ID is required."
        );
    }


    const result =
        await Notification.updateMany(

            {
                userId,

                isRead: false,
            },

            {
                $set: {
                    isRead: true,
                },
            }

        );


    return {

        matchedCount:
            result.matchedCount ??
            result.n ??
            0,

        modifiedCount:
            result.modifiedCount ??
            result.nModified ??
            0,
    };
};


// =========================================================
// DELETE ONE NOTIFICATION
// =========================================================

const deleteNotification = async (
    notificationId,
    userId
) => {

    if (!notificationId) {

        throw new Error(
            "Notification ID is required."
        );
    }


    if (!userId) {

        throw new Error(
            "User ID is required."
        );
    }


    const notification =
        await Notification.findOneAndDelete({

            _id:
                notificationId,

            userId,

        }).lean();


    if (!notification) {

        const error =
            new Error(
                "Notification not found."
            );

        error.statusCode = 404;

        throw error;
    }


    return notification;
};


// =========================================================
// DELETE ALL NOTIFICATIONS
// =========================================================

const deleteAllNotifications = async (
    userId
) => {

    if (!userId) {

        throw new Error(
            "User ID is required."
        );
    }


    const result =
        await Notification.deleteMany({

            userId,

        });


    return {

        deletedCount:
            result.deletedCount ??
            result.n ??
            0,
    };
};


// =========================================================
// EXPORT
// =========================================================

module.exports = {

    sendNotification,

    createNotification,

    getNotifications,

    markAsRead,

    markAllAsRead,

    deleteNotification,

    deleteAllNotifications,
};