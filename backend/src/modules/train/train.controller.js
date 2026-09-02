const {
  searchTrainService,
  getLiveTrainStatusService,
  getSeatAvailabilityService,
  getTrainStopsService,
  checkTrainStopService,
  getStopsBetweenService,
} = require("./train.service");

// ============================================================
// Search Train
// ============================================================

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

// ============================================================
// Live Train Running Status
// ============================================================

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

// ============================================================
// Seat Availability Forecast
// ============================================================

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

// ============================================================
// Get Complete Train Timetable
// ============================================================

const getTrainStops = async (req, res) => {
  try {
    const result = await getTrainStopsService(req.query);

    return res.status(200).json({
      success: true,
      message: "Train timetable fetched successfully.",
      count: result.length,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// Check Train Stop
// ============================================================

const checkTrainStop = async (req, res) => {
  try {
    const result = await checkTrainStopService(req.query);

    return res.status(200).json({
      success: true,
      message: "Train stop checked successfully.",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// Get Stops Between Two Stations
// ============================================================

const getStopsBetween = async (req, res) => {
  try {
    const result = await getStopsBetweenService(req.query);

    return res.status(200).json({
      success: true,
      message: "Stops between stations fetched successfully.",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// Exports
// ============================================================

module.exports = {
  searchTrain,
  getLiveTrainStatus,
  getSeatAvailability,
  getTrainStops,
  checkTrainStop,
  getStopsBetween,
};