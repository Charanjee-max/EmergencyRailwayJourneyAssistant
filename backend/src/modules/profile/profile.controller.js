const profileService = require("./profile.service");

class ProfileController {

  // =========================================
  // GET PROFILE
  // =========================================

  async getProfile(req, res) {

    try {

      const userId = req.user.id;

      const profile =
        await profileService.getProfile(
          userId
        );

      return res.status(200).json({
        success: true,
        data: profile
      });

    } catch (error) {

      console.error(
        "Get Profile Error:",
        error
      );

      return res.status(
        error.statusCode || 500
      ).json({
        success: false,
        message:
          error.message ||
          "Failed to get profile"
      });
    }
  }


  // =========================================
  // UPDATE PROFILE
  // =========================================

  async updateProfile(req, res) {

    try {

      const userId = req.user.id;

      const profile =
        await profileService.updateProfile(
          userId,
          req.body
        );

      return res.status(200).json({
        success: true,
        message:
          "Profile updated successfully.",
        data: profile
      });

    } catch (error) {

      console.error(
        "Update Profile Error:",
        error
      );

      return res.status(
        error.statusCode || 500
      ).json({
        success: false,
        message:
          error.message ||
          "Failed to update profile"
      });
    }
  }
}

module.exports = new ProfileController();