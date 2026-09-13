const express = require("express");

const router = express.Router();

const authenticate = require(
    "../../middleware/auth.middleware"
);

const notificationController = require(
    "./notification.controller"
);

const {
    getNotificationsValidation,
    notificationIdValidation,
} = require("./notification.validation");


// =========================================================
// VALIDATE QUERY
// =========================================================

const validateNotificationQuery = (
    req,
    res,
    next
) => {

    const result =
        getNotificationsValidation(req.query);


    if (result.error) {

        return res.status(400).json({
            success: false,
            message:
                result.error.details
                    .map((detail) => detail.message)
                    .join(", "),
        });
    }


    req.query = result.value;

    next();
};


// =========================================================
// VALIDATE NOTIFICATION ID
// =========================================================

const validateNotificationId = (
    req,
    res,
    next
) => {

    const result =
        notificationIdValidation(
            req.params.id
        );


    if (result.error) {

        return res.status(400).json({
            success: false,
            message: "Invalid notification ID.",
        });
    }


    next();
};


// =========================================================
// GET NOTIFICATIONS
// =========================================================

router.get(
    "/",
    authenticate,
    validateNotificationQuery,
    notificationController.getNotifications
);


// =========================================================
// MARK ALL READ
// =========================================================

router.patch(
    "/read-all",
    authenticate,
    notificationController.markAllAsRead
);


// =========================================================
// MARK ONE READ
// =========================================================

router.patch(
    "/:id/read",
    authenticate,
    validateNotificationId,
    notificationController.markAsRead
);


// =========================================================
// DELETE ONE
// =========================================================

router.delete(
    "/:id",
    authenticate,
    validateNotificationId,
    notificationController.deleteNotification
);


// =========================================================
// DELETE ALL
// =========================================================

router.delete(
    "/",
    authenticate,
    notificationController.deleteAllNotifications
);


module.exports = router;