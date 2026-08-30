const User = require("../auth/auth.model");

class SettingsService {

  // =========================================
  // GET SETTINGS
  // =========================================

  async getSettings(userId) {

    const user = await User.findById(userId)
      .select(
        "preferences"
      );

    if (!user) {

      const error = new Error(
        "User not found."
      );

      error.statusCode = 404;

      throw error;
    }

    return {
      emailNotifications:
        user.preferences?.emailNotifications ??
        true,

      websiteNotifications:
        user.preferences?.websiteNotifications ??
        true
    };
  }


  // =========================================
  // UPDATE SETTINGS
  // =========================================

  async updateSettings(
    userId,
    data
  ) {

    const updates = {};

    if (
      data.emailNotifications !==
      undefined
    ) {

      updates[
        "preferences.emailNotifications"
      ] = Boolean(
        data.emailNotifications
      );
    }

    if (
      data.websiteNotifications !==
      undefined
    ) {

      updates[
        "preferences.websiteNotifications"
      ] = Boolean(
        data.websiteNotifications
      );
    }

    const user =
      await User.findByIdAndUpdate(
        userId,
        {
          $set: updates
        },
        {
          new: true,
          runValidators: true
        }
      ).select("preferences");

    if (!user) {

      const error = new Error(
        "User not found."
      );

      error.statusCode = 404;

      throw error;
    }

    return {
      emailNotifications:
        user.preferences
          ?.emailNotifications ??
        true,

      websiteNotifications:
        user.preferences
          ?.websiteNotifications ??
        true
    };
  }
}

module.exports = new SettingsService();