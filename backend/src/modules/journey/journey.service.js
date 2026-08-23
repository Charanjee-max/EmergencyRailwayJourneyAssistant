const Journey = require("./journey.model");
const mongoose = require("mongoose");

const createJourney = async (journeyData) => {
  const journey = await Journey.create(journeyData);
  return journey;
};

const getAllJourneys = async (userId) => {
  return await Journey.find({ userId });
};

const getJourneyById = async (journeyId) => {
  console.log("==================================");
  console.log("Journey ID:", journeyId);
  console.log("Journey ID Type:", typeof journeyId);
  console.log("Is Valid ObjectId:", mongoose.Types.ObjectId.isValid(journeyId));

  const allJourneys = await Journey.find();
  console.log("All Journey IDs:");
  allJourneys.forEach((j) => {
    console.log(j._id.toString());
  });

  const journey = await Journey.findById(journeyId);

  console.log("Found Journey:", journey);
  console.log("==================================");

  if (!journey) {
    throw new Error("Journey request not found.");
  }

  return journey;
};

module.exports = {
  createJourney,
  getAllJourneys,
  getJourneyById,
};