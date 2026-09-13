const {
  registerUser,
  loginUser,
} = require("./auth.service");


const {
  registerValidation,
  loginValidation,
} = require("./auth.validation");


// =========================================================
// REGISTER CONTROLLER
// =========================================================

const register = async (
  req,
  res
) => {

  try {

    // -----------------------------------------------------
    // Validate request
    // -----------------------------------------------------

    const {
      error,
      value,
    } =
      registerValidation(
        req.body
      );


    if (error) {

      return res.status(400).json({

        success: false,

        message:
          "Validation failed.",

        errors:
          error.details.map(
            (err) => ({

              field:
                err.path.join("."),

              message:
                err.message,

            })
          ),

      });

    }


    // -----------------------------------------------------
    // Register user
    // -----------------------------------------------------

    const result =
      await registerUser(
        value
      );


    // -----------------------------------------------------
    // Success
    // -----------------------------------------------------

    return res.status(201).json({

      success: true,

      message:
        "User registered successfully.",

      data:
        result,

    });

  } catch (err) {

    console.error(
      "REGISTER ERROR:",
      err.message
    );


    // -----------------------------------------------------
    // Duplicate email
    // -----------------------------------------------------

    if (
      err.code === 11000 ||
      err.statusCode === 409
    ) {

      return res.status(409).json({

        success: false,

        message:
          "Email is already registered.",

      });

    }


    // -----------------------------------------------------
    // Server error
    // -----------------------------------------------------

    return res.status(
      err.statusCode || 500
    ).json({

      success: false,

      message:
        err.statusCode
          ? err.message
          : "Unable to register user.",

    });

  }

};


// =========================================================
// LOGIN CONTROLLER
// =========================================================

const login = async (
  req,
  res
) => {

  try {

    // -----------------------------------------------------
    // Validate request
    // -----------------------------------------------------

    const {
      error,
      value,
    } =
      loginValidation(
        req.body
      );


    if (error) {

      return res.status(400).json({

        success: false,

        message:
          "Validation failed.",

        errors:
          error.details.map(
            (err) => ({

              field:
                err.path.join("."),

              message:
                err.message,

            })
          ),

      });

    }


    // -----------------------------------------------------
    // Authenticate
    // -----------------------------------------------------

    const result =
      await loginUser(
        value.email,
        value.password
      );


    // -----------------------------------------------------
    // Success
    // -----------------------------------------------------

    return res.status(200).json({

      success: true,

      message:
        "Login successful.",

      data:
        result,

    });

  } catch (err) {

    console.error(
      "LOGIN ERROR:",
      err.message
    );


    // -----------------------------------------------------
    // Never reveal:
    //
    // - whether email exists
    // - whether account is disabled
    // - password mismatch details
    // -----------------------------------------------------

    return res.status(401).json({

      success: false,

      message:
        "Invalid email or password.",

    });

  }

};


// =========================================================
// EXPORT
// =========================================================

module.exports = {

  register,

  login,

};