const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const {
    rateLimit,
    ipKeyGenerator,
} = require("express-rate-limit");

const authRoutes = require("./modules/auth/auth.routes");
const journeyRoutes = require("./modules/journey/journey.routes");
const trainRoutes = require("./modules/train/train.routes");
const chartRoutes = require("./modules/chart/chart.routes");
const recommendationRoutes = require("./modules/recommendation/recommendation.routes");
const profileRoutes = require("./modules/profile/profile.routes");
const settingsRoutes = require("./modules/settings/settings.routes");
const notificationRoutes = require("./modules/notification/notification.routes");
const pnrRoutes = require("./modules/pnr/pnr.routes");
const stationRoutes = require("./modules/station/station.routes");

const app = express();

app.use(helmet());

// In production, set CORS_ORIGINS to a comma-separated list of exact
// frontend origins, for example: https://your-erja-site.vercel.app
const configuredOrigins = process.env.CORS_ORIGINS;

const allowedOrigins = configuredOrigins
    ? configuredOrigins
          .split(",")
          .map((origin) => origin.trim())
          .filter(Boolean)
    : process.env.NODE_ENV === "production"
      ? []
      : [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow tools and server-to-server requests that send no Origin.
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

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please try again later.",
    },
});

app.use(globalLimiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message:
            "Too many authentication attempts. Please try again later.",
    },
});

const railwayApiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message:
            "Too many railway API requests. Please wait a few minutes and try again.",
    },
    keyGenerator: (req) => ipKeyGenerator(req.ip),
});

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        project: "Emergency Railway Journey Assistant",
        version: "1.0.0",
        message: "ERJA Backend is running successfully 🚆",
    });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/journey", journeyRoutes);
app.use("/api/train", railwayApiLimiter, trainRoutes);
app.use("/api/station", stationRoutes);
app.use("/api/chart", chartRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/pnr", pnrRoutes);

module.exports = app;