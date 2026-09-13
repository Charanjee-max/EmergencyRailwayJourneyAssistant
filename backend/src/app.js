const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const {
    rateLimit,
    ipKeyGenerator,
} = require("express-rate-limit");

// =========================================================
// ROUTES
// =========================================================

const authRoutes =
    require("./modules/auth/auth.routes");

const journeyRoutes =
    require("./modules/journey/journey.routes");

const trainRoutes =
    require("./modules/train/train.routes");

const chartRoutes =
    require("./modules/chart/chart.routes");

const recommendationRoutes =
    require("./modules/recommendation/recommendation.routes");

const profileRoutes =
    require("./modules/profile/profile.routes");

const settingsRoutes =
    require("./modules/settings/settings.routes");

const notificationRoutes =
    require("./modules/notification/notification.routes");

const pnrRoutes =
    require("./modules/pnr/pnr.routes");

const stationRoutes =
    require("./modules/station/station.routes");


// =========================================================
// APP
// =========================================================

const app = express();


// =========================================================
// SECURITY HEADERS
// =========================================================

app.use(
    helmet()
);


// =========================================================
// CORS
// =========================================================

const allowedOrigins = [
    "http://localhost:5173",
];

app.use(
    cors({
        origin: (origin, callback) => {

            // Allow requests without Origin
            // such as Postman/server-to-server requests.
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error("CORS policy: Origin not allowed.")
            );
        },

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization",
        ],

        credentials: true,
    })
);


// =========================================================
// REQUEST BODY LIMITS
// =========================================================

app.use(
    express.json({
        limit: "100kb",
    })
);

app.use(
    express.urlencoded({
        extended: false,
        limit: "100kb",
    })
);


// =========================================================
// GLOBAL RATE LIMITER
// =========================================================

const globalLimiter =
    rateLimit({

        windowMs:
            15 * 60 * 1000,

        limit:
            300,

        standardHeaders:
            "draft-8",

        legacyHeaders:
            false,

        message: {
            success: false,
            message:
                "Too many requests. Please try again later.",
        },

    });

app.use(globalLimiter);


// =========================================================
// AUTH RATE LIMITER
// =========================================================

const authLimiter =
    rateLimit({

        windowMs:
            15 * 60 * 1000,

        limit:
            20,

        standardHeaders:
            "draft-8",

        legacyHeaders:
            false,

        message: {
            success: false,
            message:
                "Too many authentication attempts. Please try again later.",
        },

    });


// =========================================================
// RAILWAY API RATE LIMITER
//
// Protects expensive railway-related endpoints.
//
// IMPORTANT:
// This limiter is mounted before the train router's
// authentication middleware, so it intentionally uses IP
// instead of req.user.id.
//
// Current limit:
// 30 requests / 5 minutes / IP
// =========================================================

const railwayApiLimiter =
    rateLimit({

        windowMs:
            5 * 60 * 1000,

        limit:
            30,

        standardHeaders:
            "draft-8",

        legacyHeaders:
            false,

        message: {
            success: false,
            message:
                "Too many railway API requests. Please wait a few minutes and try again.",
        },

        keyGenerator: (req) => {
    return ipKeyGenerator(req.ip);
},

    });


// =========================================================
// HEALTH CHECK
// =========================================================

app.get("/", (req, res) => {

    res.status(200).json({

        success: true,

        project:
            "Emergency Railway Journey Assistant",

        version:
            "1.0.0",

        message:
            "ERJA Backend is running successfully 🚆",

    });

});


// =========================================================
// API ROUTES
// =========================================================


// ---------------------------------------------------------
// Authentication
// ---------------------------------------------------------

app.use(
    "/api/auth",
    authLimiter,
    authRoutes
);


// ---------------------------------------------------------
// Journey
// ---------------------------------------------------------

app.use(
    "/api/journey",
    journeyRoutes
);


// ---------------------------------------------------------
// Train
//
// Dedicated railway API rate limiter is applied here.
// ---------------------------------------------------------

app.use(
    "/api/train",
    railwayApiLimiter,
    trainRoutes
);


// ---------------------------------------------------------
// Station
// ---------------------------------------------------------

app.use(
    "/api/station",
    stationRoutes
);


// ---------------------------------------------------------
// Chart
// ---------------------------------------------------------

app.use(
    "/api/chart",
    chartRoutes
);


// ---------------------------------------------------------
// Recommendations
// ---------------------------------------------------------

app.use(
    "/api/recommendations",
    recommendationRoutes
);


// ---------------------------------------------------------
// Profile
// ---------------------------------------------------------

app.use(
    "/api/profile",
    profileRoutes
);


// ---------------------------------------------------------
// Settings
// ---------------------------------------------------------

app.use(
    "/api/settings",
    settingsRoutes
);


// ---------------------------------------------------------
// Notifications
// ---------------------------------------------------------

app.use(
    "/api/notifications",
    notificationRoutes
);


// ---------------------------------------------------------
// PNR
// ---------------------------------------------------------

app.use(
    "/api/pnr",
    pnrRoutes
);


// =========================================================
// EXPORT
// =========================================================

module.exports = app;