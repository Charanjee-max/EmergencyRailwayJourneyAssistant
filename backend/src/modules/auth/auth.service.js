const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./auth.model");

// =========================================================
// AUTHENTICATION CONFIGURATION
// =========================================================

const JWT_EXPIRES_IN =
  process.env.JWT_EXPIRES_IN || "7d";

const JWT_ISSUER =
  process.env.JWT_ISSUER ||
  "emergency-railway-journey-assistant";

const JWT_AUDIENCE =
  process.env.JWT_AUDIENCE ||
  "erja-client";


// =========================================================
// VALIDATE JWT CONFIGURATION
// =========================================================

const validateJwtConfiguration = () => {

  if (!process.env.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET is not configured."
    );
  }

  if (
    typeof process.env.JWT_SECRET !== "string" ||
    process.env.JWT_SECRET.length < 32
  ) {
    throw new Error(
      "JWT_SECRET must contain at least 32 characters."
    );
  }

};


// =========================================================
// CREATE JWT
// =========================================================

const createAccessToken = (user) => {

  validateJwtConfiguration();

  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },

    process.env.JWT_SECRET,

    {
      expiresIn: JWT_EXPIRES_IN,

      issuer:
        JWT_ISSUER,

      audience:
        JWT_AUDIENCE,

      algorithm:
        "HS256",
    }
  );

};


// =========================================================
// REGISTER USER
// =========================================================

const registerUser = async (userData) => {

  validateJwtConfiguration();

  const {
    fullName,
    email,
    password,
  } = userData;


  // -------------------------------------------------------
  // Check whether email already exists
  // -------------------------------------------------------

  const existingUser =
    await User.findOne({
      email,
    })
      .select("_id")
      .lean();


  if (existingUser) {

    const error =
      new Error(
        "Email is already registered."
      );

    error.statusCode = 409;

    throw error;
  }


  // -------------------------------------------------------
  // Hash password
  // -------------------------------------------------------

  const hashedPassword =
    await bcrypt.hash(
      password,
      12
    );


  // -------------------------------------------------------
  // Create user
  // -------------------------------------------------------

  const user =
    await User.create({

      fullName,

      email,

      password:
        hashedPassword,

    });


  // -------------------------------------------------------
  // Generate JWT
  // -------------------------------------------------------

  const token =
    createAccessToken(user);


  // -------------------------------------------------------
  // Return only safe user fields
  // -------------------------------------------------------

  return {

    token,

    user: {

      id:
        user._id,

      fullName:
        user.fullName,

      email:
        user.email,

      role:
        user.role,

    },

  };

};


// =========================================================
// LOGIN USER
// =========================================================

const loginUser = async (
  email,
  password
) => {

  validateJwtConfiguration();


  // -------------------------------------------------------
  // Find user
  //
  // Password is explicitly selected because authentication
  // requires it.
  // -------------------------------------------------------

  const user =
    await User.findOne({
      email,
    })
      .select(
        "_id fullName email password role isActive"
      );


  // -------------------------------------------------------
  // Generic authentication failure
  // -------------------------------------------------------

  if (!user) {

    const error =
      new Error(
        "Invalid email or password."
      );

    error.statusCode = 401;

    throw error;
  }


  // -------------------------------------------------------
  // Disabled account
  //
  // Keep the external message generic.
  // -------------------------------------------------------

  if (!user.isActive) {

    const error =
      new Error(
        "Invalid email or password."
      );

    error.statusCode = 401;

    throw error;
  }


  // -------------------------------------------------------
  // Compare password
  // -------------------------------------------------------

  const isMatch =
    await bcrypt.compare(
      password,
      user.password
    );


  if (!isMatch) {

    const error =
      new Error(
        "Invalid email or password."
      );

    error.statusCode = 401;

    throw error;
  }


  // -------------------------------------------------------
  // Generate JWT
  // -------------------------------------------------------

  const token =
    createAccessToken(user);


  // -------------------------------------------------------
  // Return safe fields only
  // -------------------------------------------------------

  return {

    token,

    user: {

      id:
        user._id,

      fullName:
        user.fullName,

      email:
        user.email,

      role:
        user.role,

    },

  };

};


// =========================================================
// GET USER FOR AUTHENTICATION
// =========================================================
//
// Used by auth.middleware.js.
//
// IMPORTANT:
// The JWT alone should not determine whether an account
// is still allowed to access ERJA.
//
// If an admin disables an account, the next authenticated
// request will fail even if the old JWT has not expired.
// =========================================================

const getAuthenticatedUser =
  async (userId) => {

    if (!userId) {
      return null;
    }


    const user =
      await User.findById(userId)
        .select(
          "_id fullName email role isActive"
        )
        .lean();


    if (!user) {
      return null;
    }


    if (!user.isActive) {
      return null;
    }


    return user;
  };


// =========================================================
// EXPORT
// =========================================================

module.exports = {

  registerUser,

  loginUser,

  getAuthenticatedUser,

  createAccessToken,

};