const express = require("express");

const router = express.Router();

const authenticate = require(
  "../../middleware/auth.middleware"
);

const profileController = require(
  "./profile.controller"
);

// =========================================
// Profile Routes
// =========================================

router.get(
  "/",
  authenticate,
  profileController.getProfile
);

router.patch(
  "/",
  authenticate,
  profileController.updateProfile
);

module.exports = router;