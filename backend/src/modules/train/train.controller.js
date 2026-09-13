const {
    searchTrainService,
    getLiveTrainStatusService,
    getSeatAvailabilityService,
    getTrainStopsService,
    checkTrainStopService,
    getStopsBetweenService,
} = require("./train.service");

const {
    searchTrainValidation,
    liveTrainValidation,
    seatAvailabilityValidation,
    trainStopsValidation,
    checkTrainStopValidation,
    stopsBetweenValidation,
} = require("./train.validation");


// ============================================================
// VALIDATION RESPONSE
// ============================================================

const validationErrorResponse = (
    res,
    error
) => {

    return res.status(400).json({

        success: false,

        message:
            "Validation failed.",

        errors:
            error.details.map((err) => ({

                field:
                    err.path.join("."),

                message:
                    err.message,

            })),

    });
};


// ============================================================
// SEARCH TRAIN
// ============================================================

const searchTrain = async (
    req,
    res
) => {

    try {

        const {
            error,
            value,
        } = searchTrainValidation(
            req.query
        );

        if (error) {
            return validationErrorResponse(
                res,
                error
            );
        }

        const result =
            await searchTrainService(
                value
            );

        return res.status(200).json({

            success: true,

            message:
                "Train search successful.",

            data:
                result,

        });

    } catch (error) {

        console.error(
            "❌ SEARCH TRAIN ERROR:",
            error.message
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to search train.",

        });

    }

};


// ============================================================
// LIVE TRAIN RUNNING STATUS
// ============================================================

const getLiveTrainStatus = async (
    req,
    res
) => {

    try {

        const {
            error,
            value,
        } = liveTrainValidation(
            req.query
        );

        if (error) {
            return validationErrorResponse(
                res,
                error
            );
        }

        const result =
            await getLiveTrainStatusService(
                value
            );

        return res.status(200).json({

            success: true,

            message:
                "Live train status fetched successfully.",

            data:
                result,

        });

    } catch (error) {

        console.error(
            "❌ LIVE TRAIN ERROR:",
            error.message
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to fetch live train status.",

        });

    }

};


// ============================================================
// SEAT AVAILABILITY
// ============================================================

const getSeatAvailability = async (
    req,
    res
) => {

    try {

        const {
            error,
            value,
        } = seatAvailabilityValidation(
            req.query
        );

        if (error) {
            return validationErrorResponse(
                res,
                error
            );
        }

        const result =
            await getSeatAvailabilityService(
                value
            );

        return res.status(200).json({

            success: true,

            message:
                "Seat availability fetched successfully.",

            data:
                result,

        });

    } catch (error) {

        console.error(
            "❌ SEAT AVAILABILITY ERROR:",
            error.message
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to fetch seat availability.",

        });

    }

};


// ============================================================
// COMPLETE TRAIN TIMETABLE
// ============================================================

const getTrainStops = async (
    req,
    res
) => {

    try {

        const {
            error,
            value,
        } = trainStopsValidation(
            req.query
        );

        if (error) {
            return validationErrorResponse(
                res,
                error
            );
        }

        const result =
            await getTrainStopsService(
                value
            );

        return res.status(200).json({

            success: true,

            message:
                "Train timetable fetched successfully.",

            count:
                result.length,

            data:
                result,

        });

    } catch (error) {

        console.error(
            "❌ TRAIN STOPS ERROR:",
            error.message
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to fetch train timetable.",

        });

    }

};


// ============================================================
// CHECK TRAIN STOP
// ============================================================

const checkTrainStop = async (
    req,
    res
) => {

    try {

        const {
            error,
            value,
        } = checkTrainStopValidation(
            req.query
        );

        if (error) {
            return validationErrorResponse(
                res,
                error
            );
        }

        const result =
            await checkTrainStopService(
                value
            );

        return res.status(200).json({

            success: true,

            message:
                "Train stop checked successfully.",

            data:
                result,

        });

    } catch (error) {

        console.error(
            "❌ CHECK TRAIN STOP ERROR:",
            error.message
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to check train stop.",

        });

    }

};


// ============================================================
// STOPS BETWEEN
// ============================================================

const getStopsBetween = async (
    req,
    res
) => {

    try {

        const {
            error,
            value,
        } = stopsBetweenValidation(
            req.query
        );

        if (error) {
            return validationErrorResponse(
                res,
                error
            );
        }

        const result =
            await getStopsBetweenService(
                value
            );

        return res.status(200).json({

            success: true,

            message:
                "Stops between stations fetched successfully.",

            data:
                result,

        });

    } catch (error) {

        console.error(
            "❌ STOPS BETWEEN ERROR:",
            error.message
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to fetch stops between stations.",

        });

    }

};


// ============================================================
// EXPORT
// ============================================================

module.exports = {

    searchTrain,

    getLiveTrainStatus,

    getSeatAvailability,

    getTrainStops,

    checkTrainStop,

    getStopsBetween,

};