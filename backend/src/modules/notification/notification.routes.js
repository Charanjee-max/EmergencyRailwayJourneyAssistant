const express = require("express");

const router = express.Router();

const authenticate = require(
  "../../middleware/auth.middleware"
);

const notificationController = require(
  "./notification.controller"
);

// =========================================
// GET NOTIFICATIONS
// =========================================

router.get(
  "/",
  authenticate,
  notificationController.getNotifications
);


// =========================================
// MARK ALL READ
// =========================================

router.patch(
  "/read-all",
  authenticate,
  notificationController.markAllAsRead
);


// =========================================
// MARK ONE READ
// =========================================

router.patch(
  "/:id/read",
  authenticate,
  notificationController.markAsRead
);


// =========================================
// DELETE ONE
// =========================================

router.delete(
  "/:id",
  authenticate,
  notificationController.deleteNotification
);


// =========================================
// DELETE ALL
// =========================================

router.delete(
  "/",
  authenticate,
  notificationController.deleteAllNotifications
);

module.exports = router;