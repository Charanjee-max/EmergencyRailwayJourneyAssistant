const {
    createJourney,
    getUserJourneys,
    getJourneyById,
} = require("./journey.service");

const {
    createJourneyValidation,
} = require("./journey.validation");

const workflowManager =
    require("../../workflows/workflowManager");


// =========================================================
// Create Journey Request
// =========================================================

const create = async (
    req,
    res
) => {

    try {

        // =====================================================
        // REQUEST VALIDATION
        // =====================================================

        const {
            error,
        } =
            createJourneyValidation(
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
                                err.path[0],

                            message:
                                err.message,

                        })
                    ),

            });
        }


        // =====================================================
        // CREATE JOURNEY
        // =====================================================

        const journey =
            await createJourney(
                req.body,
                req.user.id
            );


        // =====================================================
        // SUCCESS
        // =====================================================

        return res.status(201).json({

            success: true,

            message:
                "Journey request created successfully.",

            data: journey,

        });

    } catch (err) {

        console.error(
            "❌ CREATE JOURNEY ERROR:",
            err.message
        );


        // =====================================================
        // ROUTE VALIDATION / BUSINESS ERROR
        // =====================================================

        if (
            err.statusCode
        ) {

            return res.status(
                err.statusCode
            ).json({

                success: false,

                message:
                    err.message,

            });
        }


        // =====================================================
        // UNKNOWN SERVER ERROR
        // =====================================================

        return res.status(500).json({

            success: false,

            message:
                "Unable to create journey.",

        });
    }
};


// =========================================================
// Get All Journey Requests
// =========================================================

const getAll =
    async (
        req,
        res
    ) => {

        try {

            const journeys =
                await getUserJourneys(
                    req.user.id
                );


            return res.status(200).json({

                success: true,

                message:
                    "Journey requests fetched successfully.",

                data: journeys,

            });

        } catch (err) {

            console.error(
                "❌ GET JOURNEYS ERROR:",
                err.message
            );


            return res.status(500).json({

                success: false,

                message:
                    err.message,

            });
        }
    };


// =========================================================
// Get Journey By ID
// =========================================================

const getById =
    async (
        req,
        res
    ) => {

        try {

            const journey =
                await getJourneyById(
                    req.params.id,
                    req.user.id
                );


            return res.status(200).json({

                success: true,

                message:
                    "Journey request fetched successfully.",

                data: journey,

            });

        } catch (err) {

            return res.status(404).json({

                success: false,

                message:
                    err.message,

            });
        }
    };


// =========================================================
// MANUAL WORKFLOW TEST
// =========================================================

const runWorkflow =
    async (
        req,
        res
    ) => {

        try {

            console.log(
                "\n========================================"
            );

            console.log(
                "🧪 MANUAL JOURNEY WORKFLOW TRIGGERED"
            );

            console.log(
                "========================================"
            );


            // =================================================
            // Get journey and verify ownership
            // =================================================

            const journey =
                await getJourneyById(
                    req.params.id,
                    req.user.id
                );


            console.log(
                "Journey ID:",
                journey._id
            );

            console.log(
                "Train:",
                journey.trainNumber
            );

            console.log(
                "Source:",
                journey.boardingStation
            );

            console.log(
                "Destination:",
                journey.destinationStation
            );


            console.log(
                "\n🚆 Starting Workflow Manager..."
            );


            await workflowManager.processJourney(
                journey
            );


            console.log(
                "✅ Manual Workflow Completed"
            );

            console.log(
                "========================================\n"
            );


            return res.status(200).json({

                success: true,

                message:
                    "Journey workflow executed successfully.",

                data: {

                    journeyId:
                        journey._id,

                    trainNumber:
                        journey.trainNumber,

                    source:
                        journey.boardingStation,

                    destination:
                        journey.destinationStation,

                },

            });

        } catch (err) {

            console.log(
                "❌ Manual Workflow Failed:",
                err.message
            );


            return res.status(500).json({

                success: false,

                message:
                    err.message,

            });
        }
    };


// =========================================================
// EXPORTS
// =========================================================

module.exports = {

    create,

    getAll,

    getById,

    runWorkflow,

};