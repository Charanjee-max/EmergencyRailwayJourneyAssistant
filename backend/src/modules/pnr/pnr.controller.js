const {
  checkPNRService,
  getAllPNRsService,
  getPNRByIdService,
  deletePNRService,
} = require("./pnr.service");

const checkPNR = async (req, res) => {
    try {
        const result = await checkPNRService(
            req.body.pnr,
            req.user.id,
            req.body.journeyId || null
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

const getAllPNRs = async (req, res) => {
  try {
    const result = await getAllPNRsService(req.user.id);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

const getPNRById = async (req, res) => {
  try {
    const result = await getPNRByIdService(
      req.params.id,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

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
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  checkPNR,
  getAllPNRs,
  getPNRById,
  deletePNR,
};