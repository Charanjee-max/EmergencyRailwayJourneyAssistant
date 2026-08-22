const {
  createJourney,
  getUserJourneys,
  getJourneyById,
} = require("./journey.service");

const {
  createJourneyValidation,
} = require("./journey.validation");

// Create Journey Request
const create = async (req, res) => {
  try {
    // Validate Request
    const { error } = createJourneyValidation(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: error.details.map((err) => ({
          field: err.path[0],
          message: err.message,
        })),
      });
    }

    const journey = await createJourney(req.body, req.user.id);

    return res.status(201).json({
      success: true,
      message: "Journey request created successfully.",
      data: journey,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get All Journey Requests
const getAll = async (req, res) => {
  try {
    const journeys = await getUserJourneys(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Journey requests fetched successfully.",
      data: journeys,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get Journey By ID
const getById = async (req, res) => {
    console.log("✅ getById controller called");
console.log("Params:", req.params);
console.log("User:", req.user);
  try {
    const journey = await getJourneyById(
      req.params.id,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Journey request fetched successfully.",
      data: journey,
    });

  } catch (err) {
    return res.status(404).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  create,
  getAll,
  getById,
};