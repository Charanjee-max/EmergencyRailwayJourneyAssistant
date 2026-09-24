require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./app");
const connectDB = require("./config/database");
const {
    startJourneyMonitoringJob,
} = require("./jobs/monitor.job");

const PORT = process.env.PORT || 5000;
const SHUTDOWN_TIMEOUT_MS = 10000;

let server;
let monitoringJobs;
let isShuttingDown = false;

const shutdown = (signal) => {
    if (isShuttingDown) {
        return;
    }

    isShuttingDown = true;

    console.log(`\n${signal} received. Shutting down ERJA...`);

    if (monitoringJobs) {
        monitoringJobs.stop();
    }

    const forceShutdownTimer = setTimeout(() => {
        console.error(
            "⚠️ Graceful shutdown timed out. Forcing process exit."
        );
        process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    forceShutdownTimer.unref();

    const closeDatabaseAndExit = async (serverError) => {
        if (serverError) {
            console.error(
                "❌ Error while closing the HTTP server:",
                serverError.message
            );
            process.exitCode = 1;
        }

        try {
            if (monitoringJobs) {
                await monitoringJobs.waitForRunningJobs();
            }

            await mongoose.disconnect();
            console.log("✅ MongoDB connection closed.");
        } catch (error) {
            console.error(
                "❌ Error during shutdown:",
                error.message
            );
            process.exitCode = 1;
        } finally {
            clearTimeout(forceShutdownTimer);
            process.exit();
        }
    };

    if (server) {
        server.close(closeDatabaseAndExit);
    } else {
        closeDatabaseAndExit();
    }
};

const startServer = async () => {
    await connectDB();

    server = await new Promise((resolve, reject) => {
        const httpServer = app.listen(PORT, () => {
            resolve(httpServer);
        });

        httpServer.once("error", reject);
    });

    console.log("========================================");
    console.log("🚆 Emergency Railway Journey Assistant");
    console.log(`Server listening on port ${PORT}`);
    console.log(
        `Environment: ${process.env.NODE_ENV || "development"}`
    );
    console.log("========================================");

    monitoringJobs = startJourneyMonitoringJob();

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
};

startServer().catch(async (error) => {
    console.error(
        "❌ ERJA failed to start:",
        error.message
    );

    try {
        await mongoose.disconnect();
    } catch (disconnectError) {
        console.error(
            "❌ Could not close MongoDB after startup failure:",
            disconnectError.message
        );
    }

    process.exitCode = 1;
});