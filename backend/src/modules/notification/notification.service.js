const Notification = require("./notification.model");

class NotificationService {

  // =========================================
  // CREATE
  // =========================================

  async createNotification({
    userId,
    type = "SYSTEM",
    title,
    message,
    journeyId = null,
  }) {

    if (!userId) {
      throw new Error("userId is required.");
    }

    if (!title || !message) {
      throw new Error(
        "Notification title and message are required."
      );
    }

    return await Notification.create({
      userId,
      type,
      title,
      message,
      journeyId,
    });
  }


  // =========================================
  // GET USER NOTIFICATIONS
  // =========================================

  async getNotifications(userId, options = {}) {

    const limit = Math.min(
      Math.max(Number(options.limit) || 50, 1),
      100
    );

    const notifications =
      await Notification.find({
        userId,
      })
        .sort({
          createdAt: -1,
        })
        .limit(limit)
        .lean();

    const unreadCount =
      await Notification.countDocuments({
        userId,
        isRead: false,
      });

    return {
      notifications,
      unreadCount,
    };
  }


  // =========================================
  // MARK ONE AS READ
  // =========================================

  async markAsRead(
    notificationId,
    userId
  ) {

    const notification =
      await Notification.findOneAndUpdate(
        {
          _id: notificationId,
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
      );

    if (!notification) {
      const error = new Error(
        "Notification not found."
      );

      error.statusCode = 404;

      throw error;
    }

    return notification;
  }


  // =========================================
  // MARK ALL AS READ
  // =========================================

  async markAllAsRead(userId) {

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
      modifiedCount:
        result.modifiedCount,
    };
  }


  // =========================================
  // DELETE ONE
  // =========================================

  async deleteNotification(
    notificationId,
    userId
  ) {

    const notification =
      await Notification.findOneAndDelete({
        _id: notificationId,
        userId,
      });

    if (!notification) {
      const error = new Error(
        "Notification not found."
      );

      error.statusCode = 404;

      throw error;
    }

    return notification;
  }


  // =========================================
  // DELETE ALL
  // =========================================

  async deleteAllNotifications(userId) {

    const result =
      await Notification.deleteMany({
        userId,
      });

    return {
      deletedCount:
        result.deletedCount,
    };
  }
}

module.exports = new NotificationService();