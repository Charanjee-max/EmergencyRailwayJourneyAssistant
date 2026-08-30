const express = require("express");

const router = express.Router();

const authenticate = require(
  "../../middleware/auth.middleware"
);

const settingsController = require(
  "./settings.controller"
);

router.get(
  "/",
  authenticate,
  settingsController.getSettings
);

router.patch(
  "/",
  authenticate,
  settingsController.updateSettings
);

module.exports = router;