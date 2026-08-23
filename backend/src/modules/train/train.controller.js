const {
  searchTrainService,
  getLiveTrainStatusService,
  getSeatAvailabilityService,
} = require("./train.service");

// Search Train
const searchTrain = async (req, res) => {
  try {
    const result = await searchTrainService(req.query);

    return res.status(200).json({
      success: true,
      message: "Train search successful.",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Live Train Running Status
const getLiveTrainStatus = async (req, res) => {
  try {
    const result = await getLiveTrainStatusService(req.query);

    return res.status(200).json({
      success: true,
      message: "Live train status fetched successfully.",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Seat Availability Forecast
const getSeatAvailability = async (req, res) => {
  try {
    const result = await getSeatAvailabilityService(req.query);

    return res.status(200).json({
      success: true,
      message: "Seat availability fetched successfully.",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  searchTrain,
  getLiveTrainStatus,
  getSeatAvailability,
};