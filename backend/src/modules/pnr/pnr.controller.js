const {
    checkPNRService,
    getAllPNRsService,
    getPNRByIdService,
    deletePNRService,
} = require("./pnr.service");

const {
    checkPNRValidation,
    pnrIdValidation,
} = require("./pnr.validation");


// =========================================================
// CHECK PNR
// =========================================================

const checkPNR = async (req, res) => {
    try {

        const {
            error,
            value,
        } = checkPNRValidation(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors: error.details.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
        }

        const result = await checkPNRService(
            value.pnr,
            req.user.id,
            value.journeyId || null
        );

        return res.status(200).json({
            success: true,
            message: "PNR status fetched and saved successfully.",
            data: result,
        });

    } catch (error) {

        console.error(
            "❌ PNR CHECK ERROR:",
            error.message
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Unable to fetch PNR status.",
        });
    }
};


// =========================================================
// GET ALL PNRs
// =========================================================

const getAllPNRs = async (req, res) => {
    try {

        const result =
            await getAllPNRsService(req.user.id);

        return res.status(200).json({
            success: true,
            data: result,
        });

    } catch (error) {

        console.error(
            "❌ GET PNRs ERROR:",
            error.message
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Unable to fetch PNRs.",
        });
    }
};


// =========================================================
// GET PNR BY ID
// =========================================================

const getPNRById = async (req, res) => {
    try {

        const result =
            await getPNRByIdService(
                req.params.id,
                req.user.id
            );

        return res.status(200).json({
            success: true,
            data: result,
        });

    } catch (error) {

        console.error(
            "❌ GET PNR ERROR:",
            error.message
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Unable to fetch PNR.",
        });
    }
};


// =========================================================
// DELETE PNR
// =========================================================

const deletePNR = async (req, res) => {
    try {

        await deletePNRService(
            req.params.id,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            message: "PNR deleted successfully.",
        });

    } catch (error) {

        console.error(
            "❌ DELETE PNR ERROR:",
            error.message
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Unable to delete PNR.",
        });
    }
};


module.exports = {
    checkPNR,
    getAllPNRs,
    getPNRById,
    deletePNR,
};