const express = require("express");

const authenticate =
    require("../../middleware/auth.middleware");

const {
    checkPNR,
    getAllPNRs,
    getPNRById,
    deletePNR,
} = require("./pnr.controller");

const {
    pnrIdValidation,
} = require("./pnr.validation");


const router = express.Router();


// =========================================================
// AUTHENTICATION
// =========================================================

router.use(authenticate);


// =========================================================
// PNR ID VALIDATION
// =========================================================

const validatePNRId = (req, res, next) => {

    const result =
        pnrIdValidation(req.params.id);

    if (result.error) {
        return res.status(400).json({
            success: false,
            message: result.error.message,
        });
    }

    next();
};


// =========================================================
// CHECK PNR
// =========================================================

router.post(
    "/check",
    checkPNR
);


// =========================================================
// GET USER PNRs
// =========================================================

router.get(
    "/",
    getAllPNRs
);


// =========================================================
// GET SINGLE PNR
// =========================================================

router.get(
    "/:id",
    validatePNRId,
    getPNRById
);


// =========================================================
// DELETE PNR
// =========================================================

router.delete(
    "/:id",
    validatePNRId,
    deletePNR
);


module.exports = router;