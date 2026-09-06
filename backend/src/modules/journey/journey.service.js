const Journey = require("./journey.model");
const Chart = require("../chart/chart.model");

const {
    getTrainScheduleService,
} = require("../../services/ntes.service");

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
    // VALIDATE TRAIN ROUTE USING NTES
    // =====================================================

    console.log(
        "\n========================================"
    );

    console.log(
        "🚆 VALIDATING JOURNEY ROUTE WITH NTES"
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


    let trainSchedule;

    try {

        /*
         * NTES expects the train's start date
         * in DD-MMM-YYYY format.
         *
         * Example:
         * 06-Sep-2026
         */

        const journeyDate =
            new Date(
                journeyData.journeyDate
            );

        if (
            Number.isNaN(
                journeyDate.getTime()
            )
        ) {

            const dateError = new Error(
                "Invalid journey date."
            );

            dateError.statusCode = 400;

            throw dateError;
        }


        const day =
            String(
                journeyDate.getDate()
            ).padStart(2, "0");

        const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];

        const month =
            monthNames[
                journeyDate.getMonth()
            ];

        const year =
            journeyDate.getFullYear();

        const trainStartDate =
            `${day}-${month}-${year}`;


        console.log(
            "Journey Date:",
            trainStartDate
        );


        trainSchedule =
            await getTrainScheduleService(
                trainNumber,
                trainStartDate
            );

    } catch (error) {

        console.error(
            "❌ NTES TRAIN SCHEDULE ERROR:",
            error.message
        );


        const routeError =
            new Error(
                error.message ||
                `Unable to retrieve timetable for train ${trainNumber}.`
            );

        routeError.statusCode = 400;

        throw routeError;
    }


    // =====================================================
    // CHECK TIMETABLE
    // =====================================================

    if (
        !trainSchedule ||
        !Array.isArray(
            trainSchedule.stops
        ) ||
        trainSchedule.stops.length === 0
    ) {

        const error = new Error(
            `No timetable found for train ${trainNumber}.`
        );

        error.statusCode = 400;

        throw error;
    }


    const stops =
        trainSchedule.stops;


    // =====================================================
    // FIND SOURCE STATION
    // =====================================================

    const sourceIndex =
        stops.findIndex(
            (stop) =>
                String(
                    stop.code || ""
                )
                    .trim()
                    .toUpperCase() ===
                boardingStation
        );


    // =====================================================
    // FIND DESTINATION STATION
    // =====================================================

    const destinationIndex =
        stops.findIndex(
            (stop) =>
                String(
                    stop.code || ""
                )
                    .trim()
                    .toUpperCase() ===
                destinationStation
        );


    // =====================================================
    // SOURCE NOT FOUND
    // =====================================================

    if (
        sourceIndex === -1
    ) {

        console.log(
            "❌ SOURCE STATION NOT FOUND"
        );

        console.log(
            "Source:",
            boardingStation
        );

        console.log(
            "========================================\n"
        );


        const error = new Error(
            `Departure station ${boardingStation} is not on train ${trainNumber}.`
        );

        error.statusCode = 400;

        throw error;
    }


    // =====================================================
    // DESTINATION NOT FOUND
    // =====================================================

    if (
        destinationIndex === -1
    ) {

        console.log(
            "❌ DESTINATION STATION NOT FOUND"
        );

        console.log(
            "Destination:",
            destinationStation
        );

        console.log(
            "========================================\n"
        );


        const error = new Error(
            `Destination station ${destinationStation} is not on train ${trainNumber}.`
        );

        error.statusCode = 400;

        throw error;
    }


    // =====================================================
    // CHECK ROUTE ORDER
    // =====================================================

    if (
        sourceIndex >= destinationIndex
    ) {

        console.log(
            "❌ INVALID ROUTE ORDER"
        );

        console.log(
            `Source index: ${sourceIndex}`
        );

        console.log(
            `Destination index: ${destinationIndex}`
        );

        console.log(
            "========================================\n"
        );


        const error = new Error(
            `${boardingStation} does not occur before ${destinationStation} in train ${trainNumber}'s timetable.`
        );

        error.statusCode = 400;

        throw error;
    }


    // =====================================================
    // GET STOPS BETWEEN SOURCE AND DESTINATION
    // =====================================================

    const journeyStops =
        stops.slice(
            sourceIndex,
            destinationIndex + 1
        );


    // =====================================================
    // ROUTE VALID
    // =====================================================

    console.log(
        "\n========================================"
    );

    console.log(
        "✅ JOURNEY ROUTE VALIDATED"
    );

    console.log(
        "========================================"
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
        `Stops in journey: ${journeyStops.length}`
    );

    console.log(
        "Route:"
    );

    journeyStops.forEach(
        (stop) => {

            console.log(
                `  ${stop.no}. ${stop.code} - ${stop.station}`
            );

        }
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