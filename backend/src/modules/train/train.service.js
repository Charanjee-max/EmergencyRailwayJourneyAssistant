const axios = require("axios");

// Search Train Details
const searchTrainService = async (query) => {
  const { trainNumber } = query;

  if (!trainNumber) {
    throw new Error("Train number is required.");
  }

  try {
    const response = await axios.get(
      `${process.env.RAILRADAR_BASE_URL}/trains/${trainNumber}?haltsOnly=true`,
      {
        headers: {
          Authorization: `Bearer ${process.env.RAILRADAR_API_KEY}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data?.message ||
          `RailRadar API Error (${error.response.status})`
      );
    }

    throw new Error("Unable to connect to RailRadar API.");
  }
};

// Live Train Running Status
const getLiveTrainStatusService = async (query) => {
  const { trainNumber } = query;

  if (!trainNumber) {
    throw new Error("Train number is required.");
  }

  try {
    const response = await axios.get(
      `${process.env.RAILRADAR_BASE_URL}/trains/${trainNumber}/live`,
      {
        headers: {
          Authorization: `Bearer ${process.env.RAILRADAR_API_KEY}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data?.message ||
          `RailRadar API Error (${error.response.status})`
      );
    }

    throw new Error("Unable to connect to RailRadar API.");
  }
};

module.exports = {
  searchTrainService,
  getLiveTrainStatusService,
};