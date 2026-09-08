const express = require("express");
const authenticate = require("../../middleware/auth.middleware");

const {
  checkPNR,
  getAllPNRs,
  getPNRById,
  deletePNR,
} = require("./pnr.controller");

const router = express.Router();

router.use(authenticate);

router.post("/check", checkPNR);
router.get("/", getAllPNRs);
router.get("/:id", getPNRById);
router.delete("/:id", deletePNR);

module.exports = router;