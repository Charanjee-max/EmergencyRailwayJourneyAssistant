const Journey = require("./journey.model");
const Chart = require("../chart/chart.model");

const {
    getStopsBetweenService,
} = require("../train/train.service");


// =========================================================
// Create Journey
// =========================================================

const createJourney = async (
    journeyData,
    userId
) => {

    // =====================================================
    // NORMALIZE INPUT
    // =====================================================

    const trainNumber =
        String(
            journeyData.trainNumber || ""
        ).trim();

    const boardingStation =
        String(
            journeyData.boardingStation || ""
        )
            .trim()
            .toUpperCase();

    const destinationStation =
        String(
            journeyData.destinationStation || ""
        )
            .trim()
            .toUpperCase();


    // =====================================================
    // BASIC CHECK
    // =====================================================

    if (
        !trainNumber ||
        !boardingStation ||
        !destinationStation
    ) {
        const error = new Error(
            "Train number, source station and destination station are required."
        );

        error.statusCode = 400;

        throw error;
    }


    // =====================================================
    // VALIDATE TRAIN ROUTE
    // =====================================================
    //
    // This uses the timetable already stored in TrainStop.
    //
    // It checks:
    //
    // 1. Train timetable exists
    // 2. Source station exists
    // 3. Destination station exists
    // 4. Source occurs before destination
    //
    // IMPORTANT:
    // Do this BEFORE Journey.create().
    // =====================================================

    console.log(
        "\n========================================"
    );

    console.log(
        "🚆 VALIDATING JOURNEY ROUTE"
    );

    console.log(
        "========================================"
    );

    console.log(
        "Train:",
        trainNumber
    );

    console.log(
        "Source:",
        boardingStation
    );

    console.log(
        "Destination:",
        destinationStation
    );


    let routeValidation;

    try {

        routeValidation =
            await getStopsBetweenService({
                trainNumber,
                from: boardingStation,
                to: destinationStation,
            });

    } catch (error) {

        console.error(
            "❌ TRAIN ROUTE VALIDATION ERROR:",
            error.message
        );

        const routeError =
            new Error(
                error.message ||
                `Unable to validate route for train ${trainNumber}.`
            );

        routeError.statusCode = 400;

        throw routeError;
    }


    // =====================================================
    // ROUTE IS INVALID
    // =====================================================

    if (
        !routeValidation ||
        routeValidation.found !== true
    ) {

        console.log(
            "❌ JOURNEY ROUTE INVALID"
        );

        console.log(
            routeValidation?.message ||
            "Selected source and destination are not valid for this train."
        );

        console.log(
            "========================================\n"
        );


        const error = new Error(
            routeValidation?.message ||
            `Train ${trainNumber} does not operate from ${boardingStation} to ${destinationStation}.`
        );

        error.statusCode = 400;

        throw error;
    }


    // =====================================================
    // ROUTE VALID
    // =====================================================

    console.log(
        "✅ JOURNEY ROUTE VALIDATED"
    );

    console.log(
        `Train: ${trainNumber}`
    );

    console.log(
        `Source: ${boardingStation}`
    );

    console.log(
        `Destination: ${destinationStation}`
    );

    console.log(
        `Stops in journey: ${routeValidation.count}`
    );

    console.log(
        "========================================\n"
    );


    // =====================================================
    // CREATE JOURNEY
    // =====================================================

    const journey =
        await Journey.create({

            userId,

            trainNumber,

            journeyDate:
                journeyData.journeyDate,

            boardingStation,

            destinationStation,

            allowedClasses:
                journeyData.allowedClasses,

            allowMixedClass:
                journeyData.allowMixedClass,

            preferredStrategy:
                journeyData.preferredStrategy,

        });


    return journey;
};


// =========================================================
// Get All Journeys Of Logged-in User
// =========================================================

const getUserJourneys =
    async (userId) => {

        const journeys =
            await Journey.find({
                userId,
            })
                .sort({
                    createdAt: -1,
                })
                .lean();


        // =====================================================
        // Attach latest IRCTC chart information
        // =====================================================

        const journeysWithChart =
            await Promise.all(

                journeys.map(
                    async (journey) => {

                        const chart =
                            await Chart.findOne({

                                trainNumber:
                                    journey.trainNumber,

                                journeyDate:
                                    new Date(
                                        journey.journeyDate
                                    )
                                        .toISOString()
                                        .split("T")[0],

                                boardingStation:
                                    journey.boardingStation,

                            })
                                .sort({
                                    fetchedAt: -1,
                                })
                                .lean();


                        return {

                            ...journey,

                            chart: chart
                                ? {

                                    prepared:
                                        chart.chartPrepared === true,

                                    chartPrepared:
                                        chart.chartPrepared === true,

                                    chartOneDate:
                                        chart.chartOneDate ||
                                        null,

                                    chartTwoDate:
                                        chart.chartTwoDate ||
                                        null,

                                    fetchedAt:
                                        chart.fetchedAt ||
                                        null,

                                }
                                : {

                                    prepared: false,

                                    chartPrepared: false,

                                    chartOneDate: null,

                                    chartTwoDate: null,

                                    fetchedAt: null,

                                },

                        };

                    }
                )
            );


        return journeysWithChart;
    };


// =========================================================
// Get Single Journey By ID
// =========================================================

const getJourneyById =
    async (
        journeyId,
        userId
    ) => {

        const journey =
            await Journey.findOne({

                _id: journeyId,

                userId,

            });


        if (!journey) {

            throw new Error(
                "Journey request not found."
            );

        }


        return journey;
    };


// =========================================================
// EXPORT
// =========================================================

module.exports = {

    createJourney,

    getUserJourneys,

    getJourneyById,

};