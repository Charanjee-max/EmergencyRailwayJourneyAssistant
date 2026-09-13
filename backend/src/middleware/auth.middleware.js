const jwt = require("jsonwebtoken");

const {
  getAuthenticatedUser,
} = require("../modules/auth/auth.service");


// =========================================================
// JWT CONFIGURATION
// =========================================================

const JWT_ISSUER =
  process.env.JWT_ISSUER ||
  "emergency-railway-journey-assistant";

const JWT_AUDIENCE =
  process.env.JWT_AUDIENCE ||
  "erja-client";


// =========================================================
// AUTHENTICATION MIDDLEWARE
// =========================================================

const authenticate = async (
  req,
  res,
  next
) => {

  try {

    // -----------------------------------------------------
    // JWT secret must exist
    // -----------------------------------------------------

    if (!process.env.JWT_SECRET) {

      console.error(
        "❌ JWT_SECRET is not configured."
      );

      return res.status(500).json({

        success: false,

        message:
          "Authentication service is not configured.",

      });

    }


    // -----------------------------------------------------
    // Read Authorization header
    // -----------------------------------------------------

    const authHeader =
      req.headers.authorization;


    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {

      return res.status(401).json({

        success: false,

        message:
          "Access denied. Authentication required.",

      });

    }


    // -----------------------------------------------------
    // Extract token safely
    // -----------------------------------------------------

    const token =
      authHeader.slice(7).trim();


    if (!token) {

      return res.status(401).json({

        success: false,

        message:
          "Access denied. Authentication required.",

      });

    }


    // -----------------------------------------------------
    // Verify JWT
    // -----------------------------------------------------

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET,
        {
          algorithms: ["HS256"],

          issuer:
            JWT_ISSUER,

          audience:
            JWT_AUDIENCE,
        }
      );


    // -----------------------------------------------------
    // Validate token subject
    // -----------------------------------------------------

    if (
      !decoded ||
      typeof decoded.sub !== "string" ||
      !decoded.sub
    ) {

      return res.status(401).json({

        success: false,

        message:
          "Invalid or expired token.",

      });

    }


    // -----------------------------------------------------
    // Get current user from database
    // -----------------------------------------------------

    const user =
      await getAuthenticatedUser(
        decoded.sub
      );


    if (!user) {

      return res.status(401).json({

        success: false,

        message:
          "Invalid or expired token.",

      });

    }


    // -----------------------------------------------------
    // Attach trusted database identity
    //
    // DO NOT trust email/role from the request.
    // -----------------------------------------------------

    req.user = {

      id:
        user._id.toString(),

      fullName:
        user.fullName,

      email:
        user.email,

      role:
        user.role,

    };


    // -----------------------------------------------------
    // Continue
    // -----------------------------------------------------

    next();

  } catch (error) {

    // -----------------------------------------------------
    // Never expose JWT internals to the client
    // -----------------------------------------------------

    return res.status(401).json({

      success: false,

      message:
        "Invalid or expired token.",

    });

  }

};


module.exports =
  authenticate;