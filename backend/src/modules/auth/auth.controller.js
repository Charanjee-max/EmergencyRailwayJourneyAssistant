const {
  registerUser,
  loginUser,
} = require("./auth.service");

const {
  registerValidation,
} = require("./auth.validation");

// Register Controller
const register = async (req, res) => {
  try {
    // Validate Request
    const { error } = registerValidation(req.body);

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

    // Register User
    const result = await registerUser(req.body);

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: result,
    });

  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// Login Controller
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await loginUser(email, password);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: result,
    });

  } catch (err) {
    return res.status(401).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  register,
  login,
};