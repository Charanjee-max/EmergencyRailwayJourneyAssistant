const settingsService = require(
  "./settings.service"
);

class SettingsController {

  // =========================================
  // GET SETTINGS
  // =========================================

  async getSettings(req, res) {

    try {

      const userId = req.user.id;

      const settings =
        await settingsService.getSettings(
          userId
        );

      return res.status(200).json({
        success: true,
        data: settings
      });

    } catch (error) {

      console.error(
        "Get Settings Error:",
        error
      );

      return res.status(
        error.statusCode || 500
      ).json({
        success: false,
        message:
          error.message ||
          "Failed to get settings"
      });
    }
  }


  // =========================================
  // UPDATE SETTINGS
  // =========================================

  async updateSettings(req, res) {

    try {

      const userId = req.user.id;

      const settings =
        await settingsService.updateSettings(
          userId,
          req.body
        );

      return res.status(200).json({
        success: true,
        message:
          "Settings updated successfully.",
        data: settings
      });

    } catch (error) {

      console.error(
        "Update Settings Error:",
        error
      );

      return res.status(
        error.statusCode || 500
      ).json({
        success: false,
        message:
          error.message ||
          "Failed to update settings"
      });
    }
  }
}

module.exports = new SettingsController();