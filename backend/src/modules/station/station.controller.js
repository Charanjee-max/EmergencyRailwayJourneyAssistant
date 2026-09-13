const {
    searchStationService,
} = require("./station.service");

const {
    searchStationValidation,
} = require("./station.validation");


// ============================================================
// VALIDATION ERROR RESPONSE
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
// SEARCH STATION
// ============================================================

const searchStation = async (
    req,
    res
) => {

    try {

        // ------------------------------------------------------
        // Validate query parameters
        // ------------------------------------------------------

        const {
            error,
            value,
        } = searchStationValidation(
            req.query
        );

        if (error) {

            return validationErrorResponse(
                res,
                error
            );

        }


        // ------------------------------------------------------
        // Search local station directory
        // ------------------------------------------------------

        const result =
            await searchStationService(
                value
            );


        // ------------------------------------------------------
        // Response
        // ------------------------------------------------------

        return res.status(200).json({

            success: true,

            message:
                "Station search successful.",

            data:
                result,

        });

    } catch (error) {

        console.error(
            "❌ STATION SEARCH ERROR:",
            error.message
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to search stations.",

        });

    }
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
    searchStation,
};