const mongoose = require("mongoose");

// =========================================================
// USER SCHEMA
// =========================================================

const userSchema = new mongoose.Schema(
  {
    // =======================================================
    // FULL NAME
    // =======================================================

    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: 3,
      maxlength: 100,
    },


    // =======================================================
    // EMAIL
    // =======================================================

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      index: true,
    },


    // =======================================================
    // PASSWORD
    // =======================================================

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      maxlength: 128,
    },


    // =======================================================
    // PHONE NUMBER
    // =======================================================

    phoneNumber: {
      type: String,
      default: "",
      trim: true,
      maxlength: 20,
    },


    // =======================================================
    // EMAIL VERIFICATION
    // =======================================================

    isEmailVerified: {
      type: Boolean,
      default: false,
    },


    // =======================================================
    // ACCOUNT STATUS
    // =======================================================

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },


    // =======================================================
    // ROLE
    // =======================================================

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },


    // =======================================================
    // USER PREFERENCES
    // =======================================================

    preferences: {

      emailNotifications: {
        type: Boolean,
        default: true,
      },

      websiteNotifications: {
        type: Boolean,
        default: true,
      },

    },

  },

  {
    timestamps: true,

    // -------------------------------------------------------
    // Reject fields that are not defined in this schema.
    // -------------------------------------------------------

    strict: true,

    // -------------------------------------------------------
    // Prevent MongoDB operators from being used as schema
    // fields through normal Mongoose document creation.
    // -------------------------------------------------------

    strictQuery: true,
  }
);


// =========================================================
// EXPORT
// =========================================================

const User =
  mongoose.model(
    "User",
    userSchema
  );

module.exports = User;