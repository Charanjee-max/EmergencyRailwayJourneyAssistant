const notificationService = require(
  "./notification.service"
);

class NotificationController {

  // =========================================
  // GET
  // =========================================

  async getNotifications(req, res) {

    try {

      const userId = req.user.id;

      const result =
        await notificationService.getNotifications(
          userId,
          req.query
        );

      return res.status(200).json({
        success: true,
        data: result.notifications,
        unreadCount: result.unreadCount,
      });

    } catch (error) {

      console.error(
        "Get Notifications Error:",
        error
      );

      return res.status(
        error.statusCode || 500
      ).json({
        success: false,
        message:
          error.message ||
          "Failed to get notifications",
      });
    }
  }


  // =========================================
  // MARK ONE READ
  // =========================================

  async markAsRead(req, res) {

    try {

      const userId = req.user.id;

      const notification =
        await notificationService.markAsRead(
          req.params.id,
          userId
        );

      return res.status(200).json({
        success: true,
        message:
          "Notification marked as read.",
        data: notification,
      });

    } catch (error) {

      console.error(
        "Mark Notification Read Error:",
        error
      );

      return res.status(
        error.statusCode || 500
      ).json({
        success: false,
        message:
          error.message ||
          "Failed to update notification",
      });
    }
  }


  // =========================================
  // MARK ALL READ
  // =========================================

  async markAllAsRead(req, res) {

    try {

      const userId = req.user.id;

      const result =
        await notificationService.markAllAsRead(
          userId
        );

      return res.status(200).json({
        success: true,
        message:
          "All notifications marked as read.",
        data: result,
      });

    } catch (error) {

      console.error(
        "Mark All Notifications Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update notifications",
      });
    }
  }


  // =========================================
  // DELETE ONE
  // =========================================

  async deleteNotification(req, res) {

    try {

      const userId = req.user.id;

      await notificationService.deleteNotification(
        req.params.id,
        userId
      );

      return res.status(200).json({
        success: true,
        message:
          "Notification deleted.",
      });

    } catch (error) {

      console.error(
        "Delete Notification Error:",
        error
      );

      return res.status(
        error.statusCode || 500
      ).json({
        success: false,
        message:
          error.message ||
          "Failed to delete notification",
      });
    }
  }


  // =========================================
  // DELETE ALL
  // =========================================

  async deleteAllNotifications(req, res) {

    try {

      const userId = req.user.id;

      const result =
        await notificationService.deleteAllNotifications(
          userId
        );

      return res.status(200).json({
        success: true,
        message:
          "All notifications deleted.",
        data: result,
      });

    } catch (error) {

      console.error(
        "Delete All Notifications Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete notifications",
      });
    }
  }
}

module.exports =
  new NotificationController();