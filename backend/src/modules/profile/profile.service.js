const User = require("../auth/auth.model");

class ProfileService {

  // =========================================
  // GET PROFILE
  // =========================================

  async getProfile(userId) {

    const user = await User.findById(userId).select(
      "-password"
    );

    if (!user) {
      const error = new Error(
        "User not found."
      );

      error.statusCode = 404;

      throw error;
    }

    return user;
  }


  // =========================================
  // UPDATE PROFILE
  // =========================================

  async updateProfile(userId, data) {

    const allowedFields = [
      "fullName",
      "phoneNumber"
    ];

    const updates = {};

    for (const field of allowedFields) {

      if (
        data[field] !== undefined
      ) {
        updates[field] = data[field];
      }

    }

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      {
        new: true,
        runValidators: true
      }
    ).select("-password");

    if (!user) {
      const error = new Error(
        "User not found."
      );

      error.statusCode = 404;

      throw error;
    }

    return user;
  }
}

module.exports = new ProfileService();