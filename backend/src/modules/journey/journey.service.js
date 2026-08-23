const Journey = require("./journey.model");

// Create Journey
const createJourney = async (journeyData, userId) => {
  const journey = await Journey.create({
    userId,
    trainNumber: journeyData.trainNumber,
    journeyDate: journeyData.journeyDate,
    boardingStation: journeyData.boardingStation,
    destinationStation: journeyData.destinationStation,
    allowedClasses: journeyData.allowedClasses,
    allowMixedClass: journeyData.allowMixedClass,
    preferredStrategy: journeyData.preferredStrategy,
  });

  return journey;
};

// Get All Journeys of Logged-in User
const getUserJourneys = async (userId) => {
  return await Journey.find({ userId }).sort({
    createdAt: -1,
  });
};

// Get Single Journey By ID
const getJourneyById = async (journeyId, userId) => {
  const journey = await Journey.findOne({
    _id: journeyId,
    userId,
  });

  if (!journey) {
    throw new Error("Journey request not found.");
  }

  return journey;
};

module.exports = {
  createJourney,
  getUserJourneys,
  getJourneyById,
};