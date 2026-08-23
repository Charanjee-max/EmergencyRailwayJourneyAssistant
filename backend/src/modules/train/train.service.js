// Search Train Service
const searchTrainService = async (query) => {
  const { trainNumber } = query;

  // Temporary response (Sprint 5 - Step 1)
  return {
    trainNumber,
    trainName: "Falaknuma Express",
    from: "BDCR",
    to: "SC",
    status: "Running On Time",
  };
};

module.exports = {
  searchTrainService,
};