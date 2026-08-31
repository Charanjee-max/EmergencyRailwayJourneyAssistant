const Journey = require("./journey.model");
const Chart = require("../chart/chart.model");

// =========================================================
// Create Journey
// =========================================================

const createJourney = async (journeyData, userId) => {

    const journey = await Journey.create({

        userId,

        trainNumber:
            journeyData.trainNumber,

        journeyDate:
            journeyData.journeyDate,

        boardingStation:
            journeyData.boardingStation,

        destinationStation:
            journeyData.destinationStation,

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

const getUserJourneys = async (userId) => {

    const journeys =
        await Journey.find({
            userId,
        }).sort({
            createdAt: -1,
        }).lean();


    // =====================================================
    // Attach latest IRCTC chart information
    // =====================================================

    const journeysWithChart =
        await Promise.all(

            journeys.map(async (journey) => {

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
                                chart.chartOneDate || null,

                            chartTwoDate:
                                chart.chartTwoDate || null,

                            fetchedAt:
                                chart.fetchedAt || null,

                        }
                        : {

                            prepared: false,

                            chartPrepared: false,

                            chartOneDate: null,

                            chartTwoDate: null,

                            fetchedAt: null,

                        },

                };

            })

        );


    return journeysWithChart;
};


// =========================================================
// Get Single Journey By ID
// =========================================================

const getJourneyById = async (
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